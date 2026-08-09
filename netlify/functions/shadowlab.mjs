import crypto from 'node:crypto';

const JSON_HEADERS = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
function json(status, body){return new Response(JSON.stringify(body),{status,headers:JSON_HEADERS})}
function normalizeSupabaseUrl(value){
  let url=String(value||'').trim().replace(/\/+$/,'');
  url=url.replace(/\/rest\/v1$/i,'');
  return url;
}
function env(){
  return {
    url:normalizeSupabaseUrl(process.env.SUPABASE_URL),
    secret:String(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim(),
    teacher:String(process.env.SHADOWLAB_TEACHER_PASSWORD||process.env.TEACHER_PASSWORD||'')
  }
}
function sha(v){return crypto.createHash('sha256').update(String(v)).digest('hex')}
function safeEq(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function text(v,max=180){return String(v??'').trim().slice(0,max)}
async function sb(path,{method='GET',body,prefer}={}){
  const {url,secret}=env();
  if(!url)throw new Error('Supabase is not configured: missing SUPABASE_URL.');
  if(!secret)throw new Error('Supabase is not configured: missing SUPABASE_SECRET_KEY.');
  const h={apikey:secret,'content-type':'application/json'};
  // New Supabase sb_secret_* keys are API keys, not JWTs. Do NOT send them as Bearer tokens.
  // Legacy service_role JWT keys still use Authorization: Bearer <JWT>.
  if(!secret.startsWith('sb_secret_')) h.authorization=`Bearer ${secret}`;
  if(prefer)h.Prefer=prefer;
  const endpoint=`${url}/rest/v1/${path}`;
  const r=await fetch(endpoint,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await r.text();
  let data=null;
  try{data=raw?JSON.parse(raw):null}catch{data=raw}
  if(!r.ok){
    const msg=data?.message||data?.hint||data?.details||raw||`Supabase ${r.status}`;
    if(r.status===401 && /invalid.*api.*key|api.*key.*invalid/i.test(String(msg))){
      const ref=(url.match(/^https:\/\/([^.]+)\.supabase\.co/i)||[])[1]||'unknown';
      const keyType=secret.startsWith('sb_secret_')?'sb_secret':'legacy';
      throw new Error(`Invalid Supabase API key for project ${ref}. Key type: ${keyType}. Check that SUPABASE_URL and SUPABASE_SECRET_KEY come from the same Supabase project.`);
    }
    throw new Error(msg)
  }
  return data
}
async function authStudent(id,key){if(!id||!key)return null;const rows=await sb(`shadowlab_students?id=eq.${encodeURIComponent(id)}&student_key_hash=eq.${sha(key)}&select=id,full_name,class_name&limit=1`);return rows?.[0]||null}
function teacherOK(password){const expected=env().teacher;if(!expected)return false;return safeEq(password,expected)}
export default async (req)=>{if(req.method!=='POST')return json(405,{ok:false,error:'POST only'});let b={};try{b=await req.json()}catch{return json(400,{ok:false,error:'Invalid JSON'})}const action=b.action;try{
 if(action==='health'){
   const {url,secret}=env();
   await sb('shadowlab_students?select=id&limit=1');
   const ref=(url.match(/^https:\/\/([^.]+)\.supabase\.co/i)||[])[1]||null;
   return json(200,{ok:true,projectRef:ref,keyType:secret.startsWith('sb_secret_')?'sb_secret':'legacy'})
 }
 if(action==='register_student'){
   const fullName=text(b.fullName,120),className=text(b.className,80);if(fullName.length<2||!className)return json(400,{ok:false,error:'Full name and class are required.'});const studentKey=crypto.randomBytes(24).toString('hex');const rows=await sb('shadowlab_students?select=id,full_name,class_name,created_at',{method:'POST',prefer:'return=representation',body:{full_name:fullName,class_name:className,student_key_hash:sha(studentKey)}});return json(200,{ok:true,student:rows[0],studentKey})
 }
 if(action==='update_student'){
   const s=await authStudent(b.studentId,b.studentKey);if(!s)return json(401,{ok:false,error:'Student profile could not be verified.'});const fullName=text(b.fullName,120),className=text(b.className,80);if(fullName.length<2||!className)return json(400,{ok:false,error:'Full name and class are required.'});const rows=await sb(`shadowlab_students?id=eq.${encodeURIComponent(s.id)}&select=id,full_name,class_name`,{method:'PATCH',prefer:'return=representation',body:{full_name:fullName,class_name:className,updated_at:new Date().toISOString()}});return json(200,{ok:true,student:rows[0]})
 }
 if(action==='student_progress'){
   const s=await authStudent(b.studentId,b.studentKey);if(!s)return json(401,{ok:false,error:'Student profile could not be verified.'});const rows=await sb(`shadowlab_submissions?student_id=eq.${encodeURIComponent(s.id)}&select=id,question_id,question_text,topic,route_id,route_label,shadow_first,shadow_latest,recall_score,attempts,status,teacher_note,completed_at,reviewed_at&order=question_id.asc`);return json(200,{ok:true,student:s,submissions:rows||[]})
 }
 if(action==='submit_result'){
   const s=await authStudent(b.studentId,b.studentKey);if(!s)return json(401,{ok:false,error:'Student profile could not be verified.'});const x=b.submission||{},qid=Number(x.questionId);if(!Number.isInteger(qid)||qid<1||qid>168)return json(400,{ok:false,error:'Invalid question.'});const row={student_id:s.id,question_id:qid,question_text:text(x.questionText,500),topic:text(x.topic,120),route_id:text(x.routeId,2),route_label:text(x.routeLabel,120),shadow_first:Number.isFinite(+x.shadowFirst)?+x.shadowFirst:null,shadow_latest:Number.isFinite(+x.shadowLatest)?+x.shadowLatest:null,clarity:Number.isFinite(+x.clarity)?+x.clarity:null,fluency:Number.isFinite(+x.fluency)?+x.fluency:null,rhythm:Number.isFinite(+x.rhythm)?+x.rhythm:null,connected_speech:Number.isFinite(+x.connectedSpeech)?+x.connectedSpeech:null,under70_pct:Number.isFinite(+x.under70Pct)?+x.under70Pct:null,recall_score:Number.isFinite(+x.recallScore)?+x.recallScore:null,attempts:Number.isFinite(+x.attempts)?Math.max(1,Math.round(+x.attempts)):1,transcript:text(x.transcript,10000),recall_transcript:text(x.recallTranscript,10000),detail_json:x.detail&&typeof x.detail==='object'?x.detail:{},status:'pending',teacher_note:null,reviewed_at:null,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()};const rows=await sb('shadowlab_submissions?on_conflict=student_id,question_id&select=id,status,completed_at',{method:'POST',prefer:'resolution=merge-duplicates,return=representation',body:row});return json(200,{ok:true,submission:rows[0]})
 }
 if(action==='teacher_list'){
   if(!teacherOK(b.password))return json(401,{ok:false,error:'Teacher password is incorrect.'});const rows=await sb('shadowlab_submissions?select=id,student_id,question_id,question_text,topic,route_id,route_label,shadow_first,shadow_latest,clarity,fluency,rhythm,connected_speech,under70_pct,recall_score,attempts,transcript,recall_transcript,detail_json,status,teacher_note,completed_at,reviewed_at,shadowlab_students!inner(full_name,class_name)&order=completed_at.desc&limit=2000');return json(200,{ok:true,submissions:rows||[]})
 }
 if(action==='teacher_review'){
   if(!teacherOK(b.password))return json(401,{ok:false,error:'Teacher password is incorrect.'});const id=text(b.submissionId,80),status=['pending','accepted','retry'].includes(b.status)?b.status:null;if(!id||!status)return json(400,{ok:false,error:'Invalid review request.'});const rows=await sb(`shadowlab_submissions?id=eq.${encodeURIComponent(id)}&select=id,status,teacher_note,reviewed_at`,{method:'PATCH',prefer:'return=representation',body:{status,teacher_note:text(b.teacherNote,2000)||null,reviewed_at:status==='pending'?null:new Date().toISOString(),updated_at:new Date().toISOString()}});return json(200,{ok:true,submission:rows?.[0]||null})
 }
 return json(400,{ok:false,error:'Unknown action.'})
 }catch(e){console.error(e);const msg=String(e?.message||e);const status=/not configured|relation .* does not exist|schema cache/i.test(msg)?503:500;return json(status,{ok:false,error:msg})}}
