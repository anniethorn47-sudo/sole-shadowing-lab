class ShadowLabPCMRecorder extends AudioWorkletProcessor {
  constructor(){
    super();
    this.active=true;
    this.batch=[];
    this.batchSamples=0;
    this.batchTarget=Math.max(2048,Math.floor(sampleRate*0.12));
    this.port.onmessage=(e)=>{if(e.data?.type==='stop'){this.flush();this.active=false;this.port.postMessage({type:'stopped'})}};
  }
  flush(){
    if(!this.batchSamples)return;
    const out=new Float32Array(this.batchSamples);let p=0;
    for(const a of this.batch){out.set(a,p);p+=a.length}
    this.port.postMessage({type:'pcm',samples:out.buffer},[out.buffer]);
    this.batch=[];this.batchSamples=0;
  }
  process(inputs,outputs){
    const input=inputs[0]?.[0];
    const output=outputs[0]?.[0];
    if(output)output.fill(0);
    if(this.active&&input?.length){
      const copy=new Float32Array(input);
      this.batch.push(copy);this.batchSamples+=copy.length;
      if(this.batchSamples>=this.batchTarget)this.flush();
    }
    return true;
  }
}
registerProcessor('shadowlab-pcm-recorder',ShadowLabPCMRecorder);
