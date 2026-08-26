const assert=require('assert');
const S=require('./pronunciation-scoring-v5.4.js');
const W=(raw,phones,{tier='core',variants=null,focus=[],context_lock=false,context_note=''}={})=>({raw,word:raw.toLowerCase(),tier,variants:variants||[{ipa:phones.join(''),model_phonemes:phones}],focus,context_lock,context_note});
const M=(...words)=>({words});
const T=(s)=>s.trim().split(/\s+/).filter(Boolean).map(p=>({p}));
function scored(r,overall=92,attempt=1){return {...r,overall,flu:92,rhythm:90,connected:90,validAttemptNo:attempt}}
function gate(r,attempt=r.validAttemptNo||1){return S.gate(r,{validAttemptNo:attempt,forcePassAt:10})}

// 1. Exact speech passes the stricter gate.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true}),W('here',['h','ɪ','ɹ']));
 const r=scored(S.scoreSentence(m,T('l ɪ v h ɪ ɹ')));
 assert(r.clarity>=95); assert(gate(r).naturalPass); assert(!gate(r).forcedPass);
}
// 2. Accepted weak variant passes.
{
 const m=M(W('than',['ð','æ','n'],{tier:'weak',variants:[{ipa:'ðæn',model_phonemes:['ð','æ','n']},{ipa:'ðən',model_phonemes:['ð','ə','n']}]}),W('home',['h','oʊ','m']));
 const r=scored(S.scoreSentence(m,T('ð ə n h oʊ m')));
 assert.equal(r.words[0].selectedIPA,'/ðən/'); assert.equal(r.words[0].state,'weak'); assert(gate(r).pass);
}
// 3. Weak word omission never blocks.
{
 const m=M(W('I',['aɪ'],{tier:'weak'}),W('like',['l','aɪ','k']),W('music',['m','j','u','z','ɪ','k']));
 const r=scored(S.scoreSentence(m,T('l aɪ k m j u z ɪ k')));
 assert.equal(r.words[0].state,'weak'); assert(gate(r).pass);
}
// 4. Uncertain core-word evidence now blocks attempts 1-9, but Safety Pass opens at 10.
{
 const m=M(W('cat',['k','æ','t']),W('today',['t','ə','d','eɪ']));
 const base=S.scoreSentence(m,T('k æ t ə d eɪ'));
 assert(base.uncertainCoreCount>=1 || base.hardLowCount>=1 || base.lowReliableCount>=1);
 const g1=gate(scored(base,92,1),1); assert(!g1.pass); assert(!g1.forcedPass);
 const g10=gate(scored(base,92,10),10); assert(g10.pass); assert(g10.forcedPass); assert(!g10.naturalPass);
}
// 5. First-pass critical contrast already requires a new recording; repeated contrast becomes confirmed.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true,context_note:'verb /lɪv/'}),W('nearby',['n','ɪ','ɹ','b','aɪ']));
 const r1=scored(S.scoreSentence(m,T('l aɪ v n ɪ ɹ b aɪ')),92,1);
 assert.equal(r1.confirmedCritical.length,0); assert(r1.suspectedCritical.length>=1); assert(!gate(r1).pass);
 const r2=scored(S.scoreSentence(m,T('l aɪ v n ɪ ɹ b aɪ'),r1),92,2);
 assert(r2.confirmedCritical.length>=1); assert(!gate(r2).pass);
 assert(gate({...r2,validAttemptNo:10},10).forcedPass);
}
// 6. Correct retry clears the suspicion and passes naturally.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true}),W('here',['h','ɪ','ɹ']));
 const r1=scored(S.scoreSentence(m,T('l aɪ v h ɪ ɹ')),92,1);
 const r2=scored(S.scoreSentence(m,T('l ɪ v h ɪ ɹ'),r1),92,2);
 assert.equal(r2.confirmedCritical.length,0); assert(gate(r2).naturalPass);
}
// 7. Final -ed mismatch blocks on first valid attempt and confirms if repeated.
{
 const m=M(W('wanted',['w','ɔ','n','t','ɪ','d'],{focus:[{type:'ending',position:'end',label:'-ed /ɪd/',model_variants:[['ɪ','d']]}]}),W('more',['m','ɔ','ɹ']));
 const heard=T('w ɔ n t ɪ t m ɔ ɹ');
 const r1=scored(S.scoreSentence(m,heard),92,1);
 assert(r1.suspectedCritical.some(x=>x.label==='-ed /ɪd/')); assert(!gate(r1).pass);
 const r2=scored(S.scoreSentence(m,heard,r1),92,2);
 assert(r2.confirmedCritical.some(x=>x.label==='-ed /ɪd/')); assert(!gate(r2).pass);
}
// 8. American flap remains accepted.
{
 assert(S.phEq('t','ɾ'));
 const m=M(W('better',['b','ɛ','t','ɚ']));
 const r=scored(S.scoreSentence(m,T('b ɛ ɾ ɚ')));
 assert(r.clarity>=95); assert(gate(r).pass);
}
// 9. One recognizer vowel confusion may now trigger repair instead of being silently forgiven.
{
 const m=M(W('big',['b','ɪ','ɡ']),W('green',['ɡ','ɹ','i']),W('park',['p','ɑ','ɹ','k']),W('near',['n','ɪ','ɹ']),W('home',['h','oʊ','m']));
 const r=scored(S.scoreSentence(m,T('b i ɡ ɡ ɹ i p ɑ ɹ k n ɪ ɹ h oʊ m')),92,1);
 const g=gate(r); assert(!g.pass); assert(r.clearPhoneMismatchCount>=1); // Core-vowel substitution now requires repair.
}
// 10. Broadly bad segmental evidence fails attempts 1-9.
{
 const m=M(W('big',['b','ɪ','ɡ']),W('green',['ɡ','ɹ','i']),W('park',['p','ɑ','ɹ','k']),W('near',['n','ɪ','ɹ']));
 const r=scored(S.scoreSentence(m,T('s u t f æ m d oʊ z')),92,1);
 assert(!gate(r).pass);
}
// 11. Severe uncertainty blocks rather than being neutralized.
{
 const m=M(W('beautiful',['b','j','u','t','ɪ','f','ə','l']),W('garden',['ɡ','ɑ','ɹ','d','ə','n']),W('outside',['aʊ','t','s','aɪ','d']));
 const r=scored(S.scoreSentence(m,T('b j u')),92,1);
 const g=gate(r); assert(!g.pass); assert(!g.inconclusive);
}
// 12. A low core word in a short sentence is no longer automatically forgiven.
{
 const m=M(W('probably',['p','ɹ','ɑ','b','ə','b','l','i']),W('not',['n','ɑ','t']));
 const r=scored(S.scoreSentence(m,T('p ɹ ɑ b ə b l i n s t')),92,1);
 assert.equal(r.allowedLowCount,0); assert(!gate(r).pass);
}
// 13. Random context noise is not falsely labelled a heteronym contrast, but still requires repair if evidence is weak.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true}),W('here',['h','ɪ','ɹ']));
 const r1=scored(S.scoreSentence(m,T('l ɛ v h ɪ ɹ')),92,1);
 const r2=scored(S.scoreSentence(m,T('l ɛ v h ɪ ɹ'),r1),92,2);
 assert.equal(r1.suspectedCritical.length,0); assert.equal(r2.confirmedCritical.length,0); assert(!gate(r2).pass);
}
// 14. Safety Pass never activates before attempt 10.
{
 const fake={overall:40,clarity:40,uncertainCoreCount:2,lowReliableCount:2,allowedLowCount:0,hardLowCount:2,suspectedCritical:[],confirmedCritical:[],validAttemptNo:9};
 assert(!gate(fake,9).pass); const g10=gate({...fake,validAttemptNo:10},10); assert(g10.pass&&g10.forcedPass&&!g10.naturalPass);
}
console.log('pronunciation-scoring-v5.4: 14/14 regression groups passed');
