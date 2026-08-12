import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const SEMANTIC_MODEL='Xenova/all-MiniLM-L6-v2';
let semanticPipe=null,semanticLoading=null;
function progress(x){
  if(x?.status==='progress'&&x.progress!=null)
    postMessage({type:'status',state:'loading',title:`Loading local meaning checker ${Math.round(x.progress)}%`,detail:x.file||'Sentence-embedding model'});
}
async function getSemantic(){
  if(semanticPipe)return semanticPipe;
  if(semanticLoading)return semanticLoading;
  postMessage({type:'status',state:'loading',title:'Loading local meaning checker…',detail:'Sentence embeddings help recognise legitimate paraphrases without comparing word-for-word.'});
  semanticLoading=pipeline('feature-extraction',SEMANTIC_MODEL,{device:'wasm',progress_callback:progress})
    .then(p=>{semanticPipe=p;postMessage({type:'status',state:'ready',title:'Local meaning checker ready',detail:'Semantic similarity runs in this browser.'});return p})
    .catch(e=>{semanticLoading=null;throw e});
  return semanticLoading
}
async function semanticSimilarity(a,b){
  if(!a||!b)return null;
  const p=await getSemantic(),out=await p([a,b],{pooling:'mean',normalize:true}),v=out.tolist();
  if(!v?.[0]||!v?.[1])return null;
  let dot=0;for(let i=0;i<v[0].length;i++)dot+=v[0][i]*v[1][i];
  return Math.max(-1,Math.min(1,dot))
}
self.onmessage=async e=>{
  const m=e.data||{};if(m.type!=='check')return;
  try{
    const similarity=await semanticSimilarity(String(m.reference||''),String(m.text||''));
    postMessage({type:'result',id:m.id,similarity})
  }catch(err){
    postMessage({type:'error',id:m.id,error:err?.message||String(err)})
  }
};