const fs=require('fs'),vm=require('vm'),assert=require('assert');
const S=require('./pronunciation-scoring-v5.4.js');
const code=fs.readFileSync('./pronunciation-manifest-v5.js','utf8'),sb={window:{}};vm.createContext(sb);vm.runInContext(code,sb);const P=sb.window.SHADOWLAB_PRONUNCIATION;
const all=[];for(const [routeKey,route] of Object.entries(P.routes))for(const sentence of route.sentences)all.push({routeKey,sentence});
const replacements=['s','z','t','d','k','ɡ','i','ɪ','æ','ɑ','u','ʊ','f','v','θ','ð','t͡ʃ','d͡ʒ'];
function expanded(sentence){return sentence.words.flatMap((w,wi)=>{const v=(w.variants||[])[0];return (v?.model_phonemes||v?.phonemes||[]).map((p,pi)=>({p,wi,pi,w}))})}
let trials=0,blocked=0,safetyBefore10=0,safetyAt10=0;
for(let si=0;si<all.length&&trials<240;si+=Math.max(1,Math.floor(all.length/240))){
  const {sentence}=all[si],t=expanded(sentence),core=t.filter(x=>x.w.tier!=='weak');if(!core.length)continue;
  const target=core[Math.floor(core.length/2)],replacement=replacements.find(x=>S.substitutionCost(target.p,x)>=.72);if(!replacement)continue;
  const q=t.map(x=>({p:x===target?replacement:x.p}));const r=S.scoreSentence(sentence,q);const overall=Math.round(r.clarity*.55+92*.45);
  const g1=S.gate({...r,overall,attemptNo:1},{attemptNo:1,forcePassAt:10});const g9=S.gate({...r,overall,attemptNo:9},{attemptNo:9,forcePassAt:10});const g10=S.gate({...r,overall,attemptNo:10},{attemptNo:10,forcePassAt:10});
  trials++;if(!g1.naturalPass)blocked++;if(g9.forcedPass)safetyBefore10++;if(g10.forcedPass)safetyAt10++;
}
const blockedPct=trials?Math.round(blocked/trials*1000)/10:0;const report={trials,blocked,blockedPct,safetyBefore10,safetyAt10};console.log(JSON.stringify(report,null,2));
assert(blockedPct>=98,'clear one-phone deliberate-error blocking rate should be >=98% in the synthetic sweep');
assert.equal(safetyBefore10,0,'Safety Pass must never open before analyzed attempt 10');
assert(safetyAt10>0,'Safety Pass must open at attempt 10 for unresolved synthetic errors');
