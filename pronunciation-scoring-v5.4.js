(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ShadowScoringV54=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VOWELS=new Set(['i','ɪ','e','ɛ','æ','ə','ɚ','ɝ','ʌ','u','ʊ','oʊ','əʊ','ɔ','ɑ','aɪ','aʊ','eɪ','ɔɪ']);
  const VOICING_PAIRS=[['p','b'],['t','d'],['k','ɡ'],['f','v'],['θ','ð'],['s','z'],['ʃ','ʒ'],['t͡ʃ','d͡ʒ']];
  const NEAR_VOWEL_GROUPS=[
    ['i','ɪ'],['u','ʊ'],['ɛ','æ'],['ə','ʌ','ɚ','ɝ'],['ɑ','ɔ'],['oʊ','əʊ'],['ɚ','ə'],['ɝ','ɚ']
  ];

  // Context-locked words are only treated as critical when the recognizer lands on a
  // known competing English pronunciation (not merely on any random phone mismatch).
  // This keeps heteronym diagnostics useful without turning CTC noise into a verdict.
  const CONTEXT_COMPETITORS={
    live:[['l','ɪ','v'],['l','aɪ','v']],
    use:[['j','u','s'],['j','u','z']],
    used:[['j','u','s','t'],['j','u','z','d']],
    close:[['k','l','oʊ','s'],['k','l','oʊ','z']],
    read:[['ɹ','i','d'],['ɹ','ɛ','d']],
    reading:[['ɹ','i','d','ɪ','ŋ'],['ɹ','ɛ','d','ɪ','ŋ']],
    using:[['j','u','s','ɪ','ŋ'],['j','u','z','ɪ','ŋ']],
    uses:[['j','u','s','ɪ','z'],['j','u','z','ɪ','z']]
  };

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
  function phNorm(p){return String(p||'').replace(/[ˈˌ]/g,'').replace(/dʒ/g,'d͡ʒ').replace(/tʃ/g,'t͡ʃ').replace(/r/g,'ɹ').replace(/g/g,'ɡ').replace(/ː/g,'').trim()}
  function isVowel(p){return VOWELS.has(phNorm(p))}
  function inPair(a,b,pairs){return pairs.some(g=>g.includes(a)&&g.includes(b))}
  function phEq(a,b){a=phNorm(a);b=phNorm(b);if(a===b)return true;return inPair(a,b,[['oʊ','əʊ'],['ɚ','əɹ'],['ɝ','ɜɹ'],['t','ɾ']])}
  function substitutionCost(a,b){
    a=phNorm(a);b=phNorm(b);
    if(phEq(a,b)) return 0;
    if(inPair(a,b,VOICING_PAIRS)) return .46;
    if(inPair(a,b,NEAR_VOWEL_GROUPS)) return .45;
    if(isVowel(a)&&isVowel(b)) return .72;
    const manner=[['m','n','ŋ'],['s','z','ʃ','ʒ'],['f','v','θ','ð'],['p','b','t','d','k','ɡ'],['t͡ʃ','d͡ʒ']];
    if(inPair(a,b,manner)) return .72;
    return 1;
  }

  function localAlign(expected,heard,opts={}){
    const e=expected.map(phNorm),h=heard.map(phNorm),n=e.length,m=h.length;
    const delCost=opts.weak?.38:.88, insCost=opts.weak?.52:.64;
    const dp=Array.from({length:n+1},()=>new Float32Array(m+1));
    const bt=Array.from({length:n+1},()=>new Uint8Array(m+1));
    for(let i=1;i<=n;i++){dp[i][0]=dp[i-1][0]+delCost;bt[i][0]=2}
    for(let j=1;j<=m;j++){dp[0][j]=dp[0][j-1]+insCost;bt[0][j]=3}
    for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
      const sc=substitutionCost(e[i-1],h[j-1]);
      const sub=dp[i-1][j-1]+sc,del=dp[i-1][j]+delCost,ins=dp[i][j-1]+insCost;
      let v=sub,c=1;if(del<v){v=del;c=2}if(ins<v){v=ins;c=3}dp[i][j]=v;bt[i][j]=c;
    }
    let i=n,j=m,map=Array(n).fill(null),ops=[];
    while(i>0||j>0){const c=bt[i][j];if(c===1){const cost=substitutionCost(e[i-1],h[j-1]);map[i-1]=j-1;ops.push({type:cost===0?'match':'sub',ei:i-1,hj:j-1,cost,expected:e[i-1],heard:h[j-1]});i--;j--}else if(c===2){ops.push({type:'del',ei:i-1,hj:null,cost:delCost,expected:e[i-1],heard:null});i--}else{ops.push({type:'ins',ei:null,hj:j-1,cost:insCost,expected:null,heard:h[j-1]});j--}}
    ops.reverse();
    const matches=ops.filter(o=>o.type==='match').length,subs=ops.filter(o=>o.type==='sub').length,dels=ops.filter(o=>o.type==='del').length,ins=ops.filter(o=>o.type==='ins').length;
    const aligned=matches+subs,coverage=n?aligned/n:1;
    const normDen=Math.max(1,n,m*.82);
    const quality=clamp(1-dp[n][m]/normDen,0,1);
    return {cost:dp[n][m],map,ops,matches,subs,dels,ins,coverage,quality,expected:e,heard:h};
  }

  function variantsForWord(w){
    const out=(w?.variants||[]).map((v,vi)=>({
      index:vi, ipa:v.ipa||'', phones:(v.model_phonemes||v.phonemes||[]).map(phNorm)
    })).filter(v=>v.phones.length);
    return out.length?out:[{index:0,ipa:'',phones:[]}];
  }

  function segmentSentence(words,detected){
    const det=detected.map(phNorm),exp=[],ranges=[];
    words.forEach((w,wi)=>{const v=variantsForWord(w)[0],start=exp.length;for(const p of v.phones)exp.push({p,wi,weak:w.tier==='weak'});ranges.push({start,end:exp.length})});
    const n=exp.length,m=det.length,dp=Array.from({length:n+1},()=>new Float32Array(m+1)),bt=Array.from({length:n+1},()=>new Uint8Array(m+1));
    for(let i=1;i<=n;i++){dp[i][0]=dp[i-1][0]+(exp[i-1].weak?.38:.88);bt[i][0]=2}
    for(let j=1;j<=m;j++){dp[0][j]=dp[0][j-1]+.64;bt[0][j]=3}
    for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
      const sub=dp[i-1][j-1]+substitutionCost(exp[i-1].p,det[j-1]),del=dp[i-1][j]+(exp[i-1].weak?.38:.88),ins=dp[i][j-1]+.64;
      let v=sub,c=1;if(del<v){v=del;c=2}if(ins<v){v=ins;c=3}dp[i][j]=v;bt[i][j]=c;
    }
    let i=n,j=m,ops=[];
    while(i>0||j>0){const c=bt[i][j];if(c===1){ops.push({type:substitutionCost(exp[i-1]?.p,det[j-1])===0?'match':'sub',ei:i-1,hj:j-1,wi:exp[i-1]?.wi});i--;j--}else if(c===2){ops.push({type:'del',ei:i-1,hj:null,wi:exp[i-1]?.wi});i--}else{ops.push({type:'ins',ei:null,hj:j-1,wi:null});j--}}
    ops.reverse();
    // Assign each detected phone to the nearest word anchor from the global alignment.
    const heardByWord=Array.from({length:words.length},()=>[]),lastWordAt=Array(ops.length).fill(null),nextWordAt=Array(ops.length).fill(null);
    let last=null;for(let k=0;k<ops.length;k++){if(ops[k].wi!=null)last=ops[k].wi;lastWordAt[k]=last}
    let next=null;for(let k=ops.length-1;k>=0;k--){if(ops[k].wi!=null)next=ops[k].wi;nextWordAt[k]=next}
    let leadingPhones=0,trailingPhones=0;
    for(let k=0;k<ops.length;k++){const o=ops[k];if(o.hj==null)continue;let wi=o.wi;if(wi==null){const a=lastWordAt[k],b=nextWordAt[k];wi=a!=null?a:b;if(a==null)leadingPhones++;if(b==null)trailingPhones++}if(wi!=null)heardByWord[wi].push(det[o.hj])}
    const chosen=words.map((w,wi)=>{
      const heard=heardByWord[wi],weak=w.tier==='weak';let best=null;
      for(const variant of variantsForWord(w)){const al=localAlign(variant.phones,heard,{weak});if(!best||al.cost<best.align.cost-.0001||(Math.abs(al.cost-best.align.cost)<.0001&&variant.phones.length<best.variant.phones.length))best={variant,align:al}}
      return {...best,start:0,end:heard.length,heard};
    });
    return {chosen,cost:dp[n][m],leadingPhones,trailingPhones,detected:det,globalOps:ops};
  }

  function findSubsequence(hay,needle){
    if(!needle.length)return -1;
    outer:for(let i=0;i<=hay.length-needle.length;i++){for(let k=0;k<needle.length;k++)if(!phEq(hay[i+k],needle[k]))continue outer;return i}return -1;
  }
  function focusEvidence(w,choice){
    const out=[],expected=choice.variant.phones,al=choice.align;
    for(const f of (w.focus||[])){
      const variants=(f.model_variants||f.variants||[]).map(v=>v.map(phNorm)).filter(v=>v.length);
      if(!variants.length)continue;
      let best=null;
      for(const fv of variants){
        let pos=-1;
        if(f.position==='end') pos=Math.max(0,expected.length-fv.length);
        else pos=findSubsequence(expected,fv);
        if(pos<0)continue;
        const heard=[];let mapped=0;
        for(let k=0;k<fv.length;k++){const hj=al.map[pos+k];if(hj!=null){mapped++;heard.push(al.heard[hj])}else heard.push(null)}
        const exact=mapped===fv.length&&fv.every((p,k)=>heard[k]!=null&&phEq(p,heard[k]));
        const candidate={label:f.label||f.type||'focus sound',type:f.type||'sound',position:f.position||'any',expected:fv.join(' '),observed:heard.filter(Boolean).join(' ')||'missing',mappedRatio:mapped/fv.length,ok:exact};
        if(!best||candidate.mappedRatio>best.mappedRatio||candidate.ok)best=candidate;
        if(exact)break;
      }
      if(best&&!best.ok)out.push(best);
    }
    return out;
  }

  function knownContextCompetitor(w,choice){
    const key=String(w.word||w.raw||'').toLowerCase(),alts=CONTEXT_COMPETITORS[key]||[];
    if(!alts.length||!choice.heard.length)return null;
    const target=choice.variant.phones.map(phNorm),heard=choice.heard.map(phNorm);
    let best=null;
    for(const raw of alts){
      const alt=raw.map(phNorm);
      if(alt.length===target.length&&alt.every((p,i)=>phEq(p,target[i])))continue;
      const al=localAlign(alt,heard,{weak:false});
      // A context verdict needs very clean evidence for the competing pronunciation.
      // Exact/near-exact alternative beats the intended target by a meaningful margin.
      const candidate={phones:alt,align:al};
      if(!best||al.cost<best.align.cost)best=candidate;
    }
    if(!best)return null;
    const targetFit=choice.align.cost/Math.max(1,target.length),altFit=best.align.cost/Math.max(1,best.phones.length);
    const exactAlt=best.align.coverage>=.95&&best.align.quality>=.90&&best.align.dels===0&&best.align.ins===0;
    if(!exactAlt||altFit>targetFit-.18)return null;
    return {expected:target.join(' '),observed:heard.join(' '),alternative:best.phones.join(' '),quality:Math.round(best.align.quality*100)};
  }
  function signature(word,label,observed){return `${String(word).toLowerCase()}|${label}|${observed||'missing'}`}
  function previousSuspects(previous){
    const set=new Set();
    for(const w of (previous?.words||[]))for(const c of (w.criticalSuspects||[]))set.add(c.signature||signature(w.word||w.raw,c.label,c.observed));
    return set;
  }

  function scoreSentence(manifest,detTokens,previous=null){
    const words=manifest?.words||[],det=(detTokens||[]).map(x=>phNorm(x?.p??x)).filter(Boolean),seg=segmentSentence(words,det),prevSet=previousSuspects(previous),results=[];
    for(let wi=0;wi<words.length;wi++){
      const w=words[wi],choice=seg.chosen[wi],al=choice.align,expectedLen=Math.max(1,choice.variant.phones.length);
      let score=Math.round(clamp(al.quality*100,0,100));
      // Weak/function words are evidence-only. Natural reductions or omission never hard-fail a sentence.
      if(w.tier==='weak') score=Math.max(score,74);
      const specificContrast=al.subs>0&&al.dels===0&&al.coverage>=.72;
      const deletionDominant=al.dels>0&&al.subs===0;
      const evidenceQuality=Math.round(al.quality*100);
      const reliable=al.coverage>=.70&&al.quality>=.48&&(specificContrast||al.matches>=Math.max(1,expectedLen-1));
      let state='good';
      if(w.tier==='weak') state='weak';
      else if(score>=82) state='good';
      else if(score>=70) state='review';
      else if(!reliable||deletionDominant) state='uncertain';
      else state='suspect';

      const criticalSuspects=[];
      if(w.tier!=='weak'){
        for(const f of focusEvidence(w,choice)){
          if(reliable&&f.mappedRatio>=.5){const sig=signature(w.word||w.raw,f.label,f.observed);criticalSuspects.push({...f,signature:sig,confirmed:prevSet.has(sig)})}
        }
        if(w.context_lock&&reliable){
          const contrast=knownContextCompetitor(w,choice);
          if(contrast){
            const observed=`${contrast.expected}→${contrast.alternative}`;
            const sig=signature(w.word||w.raw,'context pronunciation',observed);
            criticalSuspects.push({label:'context pronunciation',type:'context',expected:contrast.expected,observed,alternative:contrast.alternative,evidenceQuality:contrast.quality,signature:sig,confirmed:prevSet.has(sig)});
          }
        }
      }
      const confirmedCritical=criticalSuspects.filter(x=>x.confirmed);
      // Do not convert a first-pass single-phone suspicion into an automatic red failure.
      if(state==='suspect'&&criticalSuspects.length&&!confirmedCritical.length) state='review';
      const heard=al.heard.join(' ');
      results.push({
        raw:w.raw,word:w.word,tier:w.tier,context_lock:!!w.context_lock,context_note:w.context_note||'',
        expectedIPA:(w.variants||[]).map(v=>'/'+v.ipa+'/').join(' or '),selectedIPA:choice.variant.ipa?'/'+choice.variant.ipa+'/':'',
        expectedPhones:choice.variant.phones.join(' '),heard,score:clamp(score,0,100),state,scorable:w.tier!=='weak',
        evidenceQuality,coverage:Math.round(al.coverage*100),matches:al.matches,subs:al.subs,dels:al.dels,ins:al.ins,
        operations:al.ops,criticalSuspects,confirmedCritical,focusFails:criticalSuspects.map(x=>x.label)
      });
    }
    const core=results.filter(w=>w.scorable),reliableCore=core.filter(w=>w.state!=='uncertain');
    const uncertain=core.filter(w=>w.state==='uncertain');
    const lowReliable=reliableCore.filter(w=>w.score<72);
    const hardLow=core.filter(w=>w.score<68);
    const reviewCore=core.filter(w=>w.state==='review');
    const below78=core.filter(w=>w.score<78);
    const clearPhoneMismatch=core.filter(w=>w.coverage>=80&&(w.operations||[]).some(o=>o.type==='sub'&&Number(o.cost)>=.45));
    const confirmed=core.flatMap(w=>w.confirmedCritical.map(c=>({word:w.raw,...c})));
    const suspected=core.flatMap(w=>w.criticalSuspects.filter(c=>!c.confirmed).map(c=>({word:w.raw,...c})));
    // v5.4 is deliberately stricter for training: uncertainty is not labelled "wrong",
    // but it DOES require another valid recording during attempts 1-9.
    // We keep a small neutral floor in the aggregate so one noisy token does not destroy the numeric score,
    // while the gate below still blocks on repair-required evidence.
    const clarity=Math.round(mean(core.map(w=>w.state==='uncertain'?Math.max(72,w.score):(w.criticalSuspects.length&&!w.confirmedCritical.length?Math.max(74,w.score):w.score)))||0);
    const under70Ratio=reliableCore.length?lowReliable.length/reliableCore.length:0;
    const lowReliableCount=lowReliable.length;
    const allowedLowCount=reliableCore.length?Math.floor(reliableCore.length*.20):0;
    const uncertaintyRatio=core.length?uncertain.length/core.length:1;
    const repairRequiredCount=core.filter(w=>w.state==='uncertain'||w.score<78||(w.operations||[]).some(o=>o.type==='sub'&&Number(o.cost)>=.45)||(w.criticalSuspects||[]).length||(w.confirmedCritical||[]).length).length;
    return {words:results,clarity,under70Ratio,lowReliableCount,allowedLowCount,hardLowCount:hardLow.length,below78Count:below78.length,clearPhoneMismatchCount:clearPhoneMismatch.length,reviewCoreCount:reviewCore.length,uncertainCoreCount:uncertain.length,repairRequiredCount,uncertaintyRatio,reliableCoreCount:reliableCore.length,coreCount:core.length,confirmedCritical:confirmed,suspectedCritical:suspected,detectedIPA:det.join(' '),segmentationCost:Math.round(seg.cost*100)/100,leadingPhones:seg.leadingPhones,trailingPhones:seg.trailingPhones};
  }

  function gate(result,opts={}){
    if(!result||result.overall==null)return {pass:false,naturalPass:false,forcedPass:false,inconclusive:false,reasons:['No scored attempt yet.']};
    const attemptNo=Number(opts.attemptNo??opts.validAttemptNo??result.attemptNo??result.validAttemptNo??0)||0;
    const forcePassAt=Math.max(1,Number(opts.forcePassAt??10)||10);
    const reasons=[];
    // Attempts 1-9: stricter practice gate. "Uncertain" means retry required, not automatic forgiveness.
    if((result.uncertainCoreCount||0)>0) reasons.push(`${result.uncertainCoreCount} core word(s) have uncertain phone evidence and need another valid recording.`);
    if(result.overall<82) reasons.push(`Overall ${result.overall} < 82.`);
    if(result.clarity<80) reasons.push(`Pronunciation ${result.clarity} < 80.`);
    if((result.lowReliableCount||0)>(result.allowedLowCount||0)) reasons.push(`${result.lowReliableCount} reliable core word(s) are below 72; this sentence allows ${result.allowedLowCount}.`);
    if((result.clearPhoneMismatchCount||0)>0) reasons.push(`${result.clearPhoneMismatchCount} core word(s) contain a clear phone substitution and need a new recording.`);
    if((result.below78Count||0)>0) reasons.push(`${result.below78Count} core word(s) are below the 78 per-word practice floor.`);
    if((result.hardLowCount||0)>0) reasons.push(`${result.hardLowCount} core word(s) are below the 68 severe-error floor.`);
    if((result.suspectedCritical||[]).length) reasons.push(`${result.suspectedCritical.length} critical sound check(s) need one more valid recording.`);
    if((result.confirmedCritical||[]).length) reasons.push(`${result.confirmedCritical.length} critical pronunciation issue(s) repeated across valid attempts.`);
    const naturalPass=reasons.length===0;
    const forcedPass=!naturalPass&&attemptNo>=forcePassAt;
    return {
      pass:naturalPass||forcedPass,
      naturalPass,
      forcedPass,
      attemptNo,
      forcePassAt,
      inconclusive:false,
      reasons,
      overrideReason:forcedPass?`Safety Pass: ${attemptNo} valid recordings reached without clearing the pronunciation gate.`:''
    };
  }

  return {version:'5.4-strict-10-attempt-safety',phNorm,phEq,substitutionCost,localAlign,segmentSentence,scoreSentence,gate};
});
