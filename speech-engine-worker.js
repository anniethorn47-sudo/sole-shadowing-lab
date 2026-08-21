import { AutoModelForCTC, Wav2Vec2FeatureExtractor } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';

const ID='onnx-community/wav2vec2-ljspeech-gruut-ONNX';
const SR=16000, CHUNK_SEC=9, OVERLAP_SEC=.7, CHUNK_TRIGGER_SEC=12;
let model=null,extractor=null,vocab=null,loading=null,engine=null,forceWasm=false;
const SKIP=new Set(['[PAD]','[UNK]','|','<pad>','<unk>','<s>','</s>']);
function status(state,title,detail=''){postMessage({type:'status',state,title,detail,engine})}
function progress(x){if(x?.status==='progress'&&x.progress!=null)status('loading',`Downloading mobile speech model… ${Math.round(x.progress)}%`,x.file||'English phoneme model')}
async function fetchVocab(){if(vocab)return vocab;const r=await fetch(`https://huggingface.co/${ID}/resolve/main/vocab.json`);if(!r.ok)throw new Error(`Could not load phoneme vocabulary (${r.status})`);const obj=await r.json(),arr=[];for(const [t,i] of Object.entries(obj))arr[i]=t;vocab=arr;return arr}
async function releaseModel(){try{await model?.dispose?.()}catch{}model=null;extractor=null;loading=null;engine=null}
async function tryLoad(device,dtype){
  status('loading','Loading mobile pronunciation engine…',device==='webgpu'?'Trying WebGPU · q4f16 (~66 MB)':'Using WASM · q4 (~90 MB)');
  const opts={dtype,progress_callback:progress};if(device==='webgpu')opts.device='webgpu';
  const [m,e]=await Promise.all([AutoModelForCTC.from_pretrained(ID,opts),Wav2Vec2FeatureExtractor.from_pretrained(ID,{progress_callback:progress})]);
  await fetchVocab();model=m;extractor=e;engine={device,dtype,model:ID,chunkSec:CHUNK_SEC};
  // Capability test: the provider must execute this actual phoneme model, not merely expose WebGPU.
  await analyzeChunk(new Float32Array(SR));
}
async function load(){
  if(model&&extractor&&vocab)return;
  if(loading)return loading;
  loading=(async()=>{
    let gpu=false;try{gpu=!forceWasm&&!!self.navigator?.gpu}catch{}
    if(gpu){
      try{await tryLoad('webgpu','q4f16');status('ready','Mobile pronunciation engine ready','WebGPU mode · one English phoneme model for Shadow + Recall');return}
      catch(e){status('loading','WebGPU did not complete safely','Falling back to WASM q4 for compatibility.');await releaseModel();forceWasm=true}
    }
    await tryLoad('wasm','q4');status('ready','Mobile pronunciation engine ready','WASM mode · one English phoneme model for Shadow + Recall');
  })();
  try{await loading}catch(e){await releaseModel();throw e}
}
function argmaxFrame(data,offset,size){let best=0,bv=data[offset];for(let i=1;i<size;i++){const v=data[offset+i];if(v>bv){bv=v;best=i}}return best}
function decodeCTC(logits,duration){
  const dims=logits.dims||[],frames=dims[dims.length-2],size=dims[dims.length-1],d=logits.data,tokens=[];let prev=null,runStart=0;
  function close(id,a,b){if(id==null)return;const p=vocab[id];if(!p||SKIP.has(p))return;tokens.push({p,start:a/frames*duration,end:b/frames*duration})}
  for(let t=0;t<frames;t++){const id=argmaxFrame(d,t*size,size);if(t===0){prev=id;runStart=0;continue}if(id!==prev){close(prev,runStart,t);prev=id;runStart=t}}
  close(prev,runStart,frames);return tokens;
}
async function analyzeChunk(pcm){const input=await extractor(pcm);const out=await model(input);const logits=out.logits||out[Object.keys(out)[0]];if(!logits?.data)throw new Error('Phoneme model returned no logits.');return decodeCTC(logits,pcm.length/SR)}
async function analyzeLoaded(pcm){
  const duration=pcm.length/SR;
  if(duration<=CHUNK_TRIGGER_SEC){const tokens=await analyzeChunk(pcm);return {tokens,ipa:tokens.map(x=>x.p).join(' '),engine:{...engine,chunked:false}}}
  const chunkN=Math.round(CHUNK_SEC*SR),overlapN=Math.round(OVERLAP_SEC*SR),step=Math.max(1,chunkN-overlapN),tokens=[];
  let chunkIndex=0;
  for(let start=0;start<pcm.length;start+=step){
    const end=Math.min(pcm.length,start+chunkN),part=pcm.slice(start,end),partDur=part.length/SR,isFirst=start===0,isLast=end>=pcm.length;
    status('loading','Analyzing long audio safely…',`Chunk ${++chunkIndex} · ${Math.min(duration,end/SR).toFixed(1)} / ${duration.toFixed(1)} s`);
    const local=await analyzeChunk(part),leftCut=isFirst?0:OVERLAP_SEC*.42,rightCut=isLast?partDur:Math.max(leftCut,partDur-OVERLAP_SEC*.42),offset=start/SR;
    for(const t of local){const mid=(t.start+t.end)/2;if(mid<leftCut||mid>rightCut)continue;tokens.push({p:t.p,start:t.start+offset,end:t.end+offset})}
    if(isLast)break;
    await new Promise(r=>setTimeout(r,0));
  }
  tokens.sort((a,b)=>a.start-b.start);
  return {tokens,ipa:tokens.map(x=>x.p).join(' '),engine:{...engine,chunked:true,chunkSec:CHUNK_SEC,overlapSec:OVERLAP_SEC}};
}
async function analyze(pcm){
  await load();
  try{return await analyzeLoaded(pcm)}
  catch(e){
    if(engine?.device==='webgpu'){
      status('loading','WebGPU analysis failed on this device','Retrying once with the lower-risk WASM engine.');
      forceWasm=true;await releaseModel();await load();return await analyzeLoaded(pcm);
    }
    throw e;
  }
}
self.onmessage=async e=>{const m=e.data||{};if(m.type==='warmup'){try{await load();postMessage({type:'warmup',id:m.id,ok:true,engine})}catch(err){postMessage({type:'error',id:m.id,error:err?.message||String(err)})}return}if(m.type!=='analyze')return;try{const pcm=new Float32Array(m.audio),r=await analyze(pcm);status('ready','Mobile pronunciation engine ready',`${String(r.engine?.device||'local').toUpperCase()} · ${r.engine?.chunked?'long-audio chunk mode':'single-pass mode'}`);postMessage({type:'result',id:m.id,...r})}catch(err){postMessage({type:'error',id:m.id,error:err?.message||String(err)})}};
