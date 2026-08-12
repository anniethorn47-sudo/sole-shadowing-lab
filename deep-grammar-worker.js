import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const MODEL_ID="SmolLM2-360M-Instruct-q4f16_1-MLC";
let engine=null,enginePromise=null,unavailableReason="";

function postStatus(state,title,detail=""){postMessage({type:"status",state,title,detail})}

async function getEngine(){
  if(engine)return engine;
  if(unavailableReason)throw new Error(unavailableReason);
  if(enginePromise)return enginePromise;
  enginePromise=webllm.CreateMLCEngine(MODEL_ID,{
    initProgressCallback:p=>{
      const pct=Number.isFinite(Number(p?.progress))?Math.round(Number(p.progress)*100):null;
      postStatus("loading",pct!=null?`Loading deep local grammar ${pct}%`:"Loading deep local grammar…",
        p?.text||"First use downloads a small on-device language model; later checks use the browser cache.");
    }
  }).then(x=>{
    engine=x;postStatus("ready","Deep local grammar ready","Conservative exact-span error tagging is active. No full-answer rewriting.");
    return x
  }).catch(e=>{
    unavailableReason=e?.message||String(e);postStatus("unavailable","Deep local grammar unavailable",unavailableReason);
    throw e
  });
  return enginePromise
}

const SYSTEM=`You are a conservative English grammar error TAGGER for spoken IELTS responses.
Your job is NOT to rewrite the sentence and NOT to improve style.
Return only clear grammar errors or highly conventional collocation errors.

STRICT RULES:
1. Each "span" MUST be an exact contiguous substring copied from the student's transcript.
2. "replacement" must be the SMALLEST correction for that span, usually only a few words.
3. Never invent new facts, examples, people, places, topics, or ideas.
4. Do not compare the student's answer with a model answer. Judge the student's English on its own.
5. Do not flag a sentence merely because another phrasing would sound nicer.
6. Focus on agreement, articles/determiners, countability, tense, verb form/pattern, malformed noun phrases, missing function words, prepositions, word form, sentence structure, and clear collocation errors.
7. If uncertain, leave it unflagged.
8. Use severity "major", "moderate", or "minor".
9. Allowed type labels: agreement, article, countability, tense, verb_form, verb_pattern, noun_phrase, preposition, word_form, sentence_structure, collocation, other.
10. Return at most 6 issues.

Examples:
Transcript: "There are too much information to read."
{"issues":[{"span":"There are too much information","replacement":"There is too much information","type":"agreement","severity":"major","explanation":"information is uncountable"}]}

Transcript: "I like animal but I never want animal pet because it's hard looking after them and care of them."
{"issues":[
{"span":"like animal","replacement":"like animals","type":"countability","severity":"moderate","explanation":"generic countable noun"},
{"span":"want animal pet","replacement":"want a pet","type":"noun_phrase","severity":"major","explanation":"malformed singular noun phrase"},
{"span":"it's hard looking","replacement":"it's hard to look","type":"verb_pattern","severity":"major","explanation":"hard + to-infinitive"},
{"span":"care of them","replacement":"take care of them","type":"verb_pattern","severity":"major","explanation":"take care of"}
]}

Transcript: "I like animals, but I don't want a pet because they're difficult to look after."
{"issues":[]}`;

function safeJSON(raw){
  const s=String(raw||"").trim();
  try{return JSON.parse(s)}catch{}
  const a=s.indexOf("{"),b=s.lastIndexOf("}");
  if(a>=0&&b>a){try{return JSON.parse(s.slice(a,b+1))}catch{}}
  return {issues:[]}
}

async function checkGrammar(text,question){
  const e=await getEngine();
  const user=`Student transcript: ${String(text||"").slice(0,700)}

Return JSON only in this shape:
{"issues":[{"span":"exact transcript substring","replacement":"minimal correction","type":"agreement","severity":"moderate","explanation":"short reason"}]}`;
  const reply=await e.chat.completions.create({
    messages:[{role:"system",content:SYSTEM},{role:"user",content:user}],
    temperature:0,
    max_tokens:420,
    seed:7,
    response_format:{type:"json_object"}
  });
  const raw=reply?.choices?.[0]?.message?.content||"";
  const obj=safeJSON(raw);
  return Array.isArray(obj?.issues)?obj.issues:[]
}

self.onmessage=async e=>{
  const m=e.data||{};if(m.type!=="check")return;
  try{
    const issues=await checkGrammar(String(m.text||""),String(m.question||""));
    postMessage({type:"result",id:m.id,issues,model:MODEL_ID})
  }catch(err){
    postMessage({type:"unavailable",id:m.id,error:err?.message||String(err)})
  }
};