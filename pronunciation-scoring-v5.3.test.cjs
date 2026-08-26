const assert=require('assert');
const S=require('./pronunciation-scoring-v5.3.js');
const W=(raw,phones,{tier='core',variants=null,focus=[],context_lock=false,context_note=''}={})=>({raw,word:raw.toLowerCase(),tier,variants:variants||[{ipa:phones.join(''),model_phonemes:phones}],focus,context_lock,context_note});
const M=(...words)=>({words});
const T=(s)=>s.trim().split(/\s+/).filter(Boolean).map(p=>({p}));
function withOverall(r,overall=90){return {...r,overall,flu:92,rhythm:90,connected:90}}

// 1. Exact speech passes.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true}),W('here',['h','ɪ','ɹ']));
 const r=withOverall(S.scoreSentence(m,T('l ɪ v h ɪ ɹ')));
 assert(r.clarity>=95); assert(S.gate(r).pass);
}
// 2. Multiple pronunciation variants: reduced weak form is accepted, not forced to variant[0].
{
 const m=M(W('than',['ð','æ','n'],{tier:'weak',variants:[{ipa:'ðæn',model_phonemes:['ð','æ','n']},{ipa:'ðən',model_phonemes:['ð','ə','n']}]}),W('home',['h','oʊ','m']));
 const r=withOverall(S.scoreSentence(m,T('ð ə n h oʊ m')));
 assert.equal(r.words[0].selectedIPA,'/ðən/'); assert.equal(r.words[0].state,'weak'); assert(S.gate(r).pass);
}
// 3. Weak word can disappear without failing the sentence.
{
 const m=M(W('I',['aɪ'],{tier:'weak'}),W('like',['l','aɪ','k']),W('music',['m','j','u','z','ɪ','k']));
 const r=withOverall(S.scoreSentence(m,T('l aɪ k m j u z ɪ k')));
 assert.equal(r.words[0].state,'weak'); assert(S.gate(r).pass);
}
// 4. A deletion-only short-word failure is uncertain, not proof of bad pronunciation.
{
 const m=M(W('cat',['k','æ','t']),W('today',['t','ə','d','eɪ']));
 const r=withOverall(S.scoreSentence(m,T('k æ t ə d eɪ')));
 assert(r.words.some(w=>w.state==='uncertain'||w.state==='review'));
}
// 5. One first-pass context contrast is only a suspicion; it must not hard-fail by itself.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true,context_note:'verb /lɪv/'}),W('nearby',['n','ɪ','ɹ','b','aɪ']));
 const r1=withOverall(S.scoreSentence(m,T('l aɪ v n ɪ ɹ b aɪ')));
 assert.equal(r1.confirmedCritical.length,0); assert(r1.suspectedCritical.length>=1); assert.notEqual(r1.words[0].state,'suspect');
 assert(S.gate(r1).pass,'first unconfirmed critical suspicion should not hard-fail an otherwise strong sentence');
 // Repeating the same contrast on a second valid attempt confirms it.
 const r2=withOverall(S.scoreSentence(m,T('l aɪ v n ɪ ɹ b aɪ'),r1));
 assert(r2.confirmedCritical.length>=1); assert(!S.gate(r2).pass);
}
// 6. Correct retry clears the earlier suspicion.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true}),W('here',['h','ɪ','ɹ']));
 const r1=withOverall(S.scoreSentence(m,T('l aɪ v h ɪ ɹ')));
 const r2=withOverall(S.scoreSentence(m,T('l ɪ v h ɪ ɹ'),r1));
 assert.equal(r2.confirmedCritical.length,0); assert(S.gate(r2).pass);
}
// 7. Final -ed focus must be repeated before becoming a hard critical failure.
{
 const m=M(W('wanted',['w','ɔ','n','t','ɪ','d'],{focus:[{type:'ending',position:'end',label:'-ed /ɪd/',model_variants:[['ɪ','d']]}]}),W('more',['m','ɔ','ɹ']));
 const heard=T('w ɔ n t ɪ t m ɔ ɹ');
 const r1=withOverall(S.scoreSentence(m,heard));
 assert.equal(r1.confirmedCritical.length,0); assert(r1.suspectedCritical.some(x=>x.label==='-ed /ɪd/'));
 const r2=withOverall(S.scoreSentence(m,heard,r1));
 assert(r2.confirmedCritical.some(x=>x.label==='-ed /ɪd/')); assert(!S.gate(r2).pass);
}
// 8. American flap is equivalent to /t/.
{
 assert(S.phEq('t','ɾ'));
 const m=M(W('better',['b','ɛ','t','ɚ']));
 const r=withOverall(S.scoreSentence(m,T('b ɛ ɾ ɚ')));
 assert(r.clarity>=95); assert(S.gate(r).pass);
}
// 9. A single near vowel recognizer confusion among many core words does not collapse the sentence.
{
 const m=M(W('big',['b','ɪ','ɡ']),W('green',['ɡ','ɹ','i']),W('park',['p','ɑ','ɹ','k']),W('near',['n','ɪ','ɹ']),W('home',['h','oʊ','m']));
 const r=withOverall(S.scoreSentence(m,T('b i ɡ ɡ ɹ i p ɑ ɹ k n ɪ ɹ h oʊ m')));
 assert(r.clarity>=78); assert(r.under70Ratio<=.30); assert(S.gate(r).pass);
}
// 10. Broadly bad segmental evidence still fails.
{
 const m=M(W('big',['b','ɪ','ɡ']),W('green',['ɡ','ɹ','i']),W('park',['p','ɑ','ɹ','k']),W('near',['n','ɪ','ɹ']));
 const r=withOverall(S.scoreSentence(m,T('s u t f æ m d oʊ z')));
 assert(!S.gate(r).pass);
}
// 11. Too much uncertain evidence is explicitly inconclusive rather than labelled wrong.
{
 const m=M(W('beautiful',['b','j','u','t','ɪ','f','ə','l']),W('garden',['ɡ','ɑ','ɹ','d','ə','n']),W('outside',['aʊ','t','s','aɪ','d']));
 const r=withOverall(S.scoreSentence(m,T('b j u')));
 const g=S.gate(r); assert(g.inconclusive); assert(!g.pass);
}
// 12. A single low word in a short two-core-word sentence does not fail solely because 1/2 > 30%.
{
 const m=M(W('probably',['p','ɹ','ɑ','b','ə','b','l','i']),W('not',['n','ɑ','t']));
 const r=S.scoreSentence(m,T('p ɹ ɑ b ə b l i n s t'));
 const scored=withOverall(r,90);assert.equal(scored.lowReliableCount,1);assert.equal(scored.allowedLowCount,1);assert(S.gate(scored).pass);
}
// 13. Random CTC noise on a context-locked word is not a heteronym verdict, even if repeated.
{
 const m=M(W('live',['l','ɪ','v'],{context_lock:true}),W('here',['h','ɪ','ɹ']));
 const r1=withOverall(S.scoreSentence(m,T('l ɛ v h ɪ ɹ')));
 const r2=withOverall(S.scoreSentence(m,T('l ɛ v h ɪ ɹ'),r1));
 assert.equal(r1.suspectedCritical.length,0); assert.equal(r2.confirmedCritical.length,0);
}
console.log('pronunciation-scoring-v5.3: 13/13 regression groups passed');
