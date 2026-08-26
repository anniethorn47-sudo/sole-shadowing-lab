const fs=require('fs'),vm=require('vm'),assert=require('assert');
const S=require('./pronunciation-scoring-v5.4.js');
const code=fs.readFileSync('./pronunciation-manifest-v5.js','utf8');const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(code,sandbox);const P=sandbox.window.SHADOWLAB_PRONUNCIATION;
const all=[];for(const [routeKey,route] of Object.entries(P.routes))for(const sentence of route.sentences)all.push({routeKey,sentence});
function tokensFor(sentence,useWeakAlt=false){return sentence.words.flatMap(w=>{const vars=w.variants||[];const v=useWeakAlt&&w.tier==='weak'&&vars[1]?vars[1]:vars[0];return (v?.model_phonemes||v?.phonemes||[]).map(p=>({p}))})}
let exactFail=0,weakVariantFail=0,forcedBefore10=0,forcedAt10=0,noiseTrials=0,noiseNeedsRepair=0;
for(const {sentence} of all){
  const exact=S.scoreSentence(sentence,tokensFor(sentence,false));const eg=S.gate({...exact,overall:100,validAttemptNo:1},{validAttemptNo:1,forcePassAt:10});if(!eg.naturalPass)exactFail++;
  const weak=S.scoreSentence(sentence,tokensFor(sentence,true));const wg=S.gate({...weak,overall:100,validAttemptNo:1},{validAttemptNo:1,forcePassAt:10});if(!wg.naturalPass)weakVariantFail++;
}
// Spread 160 single-phone corruption/deletion trials across the corpus. These are allowed to demand repair now.
for(let i=0;i<Math.min(160,all.length);i++){
  const {sentence}=all[Math.floor(i*(all.length-1)/Math.max(1,Math.min(160,all.length)-1))];const toks=tokensFor(sentence,false);if(toks.length<5)continue;
  const q=toks.slice();q.splice(Math.floor(q.length*.48),1);const r=S.scoreSentence(sentence,q);const scored={...r,overall:Math.round(r.clarity*.55+92*.45),validAttemptNo:1};const g1=S.gate(scored,{validAttemptNo:1,forcePassAt:10}),g9=S.gate({...scored,validAttemptNo:9},{validAttemptNo:9,forcePassAt:10}),g10=S.gate({...scored,validAttemptNo:10},{validAttemptNo:10,forcePassAt:10});noiseTrials++;if(!g1.naturalPass)noiseNeedsRepair++;if(g9.forcedPass)forcedBefore10++;if(g10.forcedPass)forcedAt10++;
}
const report={manifestSentences:all.length,exactFail,weakVariantFail,noiseTrials,noiseNeedsRepair,forcedBefore10,forcedAt10};console.log(JSON.stringify(report,null,2));
assert.equal(exactFail,0,'exact manifest pronunciations must naturally pass');
assert.equal(weakVariantFail,0,'accepted weak variants must naturally pass');
assert.equal(forcedBefore10,0,'Safety Pass must never activate before valid attempt 10');
assert(forcedAt10>0,'Some deliberately corrupted attempts should demonstrate Safety Pass at 10');
