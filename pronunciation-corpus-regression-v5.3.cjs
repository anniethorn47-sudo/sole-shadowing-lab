const fs=require('fs'),vm=require('vm'),assert=require('assert');
const S=require('./pronunciation-scoring-v5.3.js');
const code=fs.readFileSync('./pronunciation-manifest-v5.js','utf8');const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(code,sandbox);const P=sandbox.window.SHADOWLAB_PRONUNCIATION;
const all=[];for(const [routeKey,route] of Object.entries(P.routes))for(const sentence of route.sentences)all.push({routeKey,sentence});
const sample=[];const target=Math.min(220,all.length);for(let i=0;i<target;i++)sample.push(all[Math.floor(i*(all.length-1)/Math.max(1,target-1))]);
let exactFail=0,weakVariantFail=0,singleNoiseTrials=0,singleNoiseHardFail=0;
function tokensFor(sentence,useWeakAlt=false){return sentence.words.flatMap(w=>{const vars=w.variants||[];const v=useWeakAlt&&w.tier==='weak'&&vars[1]?vars[1]:vars[0];return (v?.model_phonemes||v?.phonemes||[]).map(p=>({p}))})}
for(const {sentence} of sample){
  const exact=S.scoreSentence(sentence,tokensFor(sentence,false));if(!S.gate({...exact,overall:100}).pass||exact.clarity<98)exactFail++;
  const weak=S.scoreSentence(sentence,tokensFor(sentence,true));if(!S.gate({...weak,overall:100}).pass)weakVariantFail++;
  const coreCount=sentence.words.filter(w=>w.tier!=='weak').length,toks=tokensFor(sentence,false);
  if(coreCount>=5&&toks.length>=10&&singleNoiseTrials<120){const q=toks.slice();q.splice(Math.floor(q.length*.47),1);const r=S.scoreSentence(sentence,q),overall=Math.round(r.clarity*.55+92*.45),g=S.gate({...r,overall});singleNoiseTrials++;if(!g.pass&&!g.inconclusive)singleNoiseHardFail++}
}
const report={manifestSentences:all.length,sampledSentences:sample.length,exactFail,weakVariantFail,singleNoiseTrials,singleNoiseHardFail,singleNoiseHardFailPct:singleNoiseTrials?Math.round(singleNoiseHardFail/singleNoiseTrials*1000)/10:0};
console.log(JSON.stringify(report,null,2));
assert.equal(exactFail,0,'exact manifest pronunciations must pass');assert.equal(weakVariantFail,0,'accepted weak variants must pass');assert(singleNoiseHardFail<=Math.ceil(singleNoiseTrials*.05),'single CTC miss false-hard-fail rate should stay <=5%');
