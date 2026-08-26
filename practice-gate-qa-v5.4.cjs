const fs=require('fs'),assert=require('assert');
const s=fs.readFileSync('./practice.html','utf8');
const checks={
  v54StateKey:/shadowlab-v5-4-state/.test(s),
  tenAttemptConstant:/MAX_PRON_ATTEMPTS=10/.test(s),
  scorerGetsAnalyzedAttempt:/SCORER\.gate\(d\|\|\{\}, \{attemptNo:/.test(s),
  distinctRecordingHistory:/old\.validRecordingNo!==shadowIntegrity\(\)\.valid/.test(s),
  analyzedAttemptFromHistory:/const attemptNo=history\.length\+1/.test(s),
  sameRecordingReanalyzeNotPrevious:/scores\[idx\]&&scores\[idx\]\.validRecordingNo!==currentValidNo/.test(s),
  forcedPassStored:/forcedPass:!!g\.forcedPass/.test(s),
  forcedPassSubmitted:/forcedPass:!!scores\[i\]\?\.forcedPass/.test(s),
  analyzedAttemptSubmitted:/analyzedAttempts:scores\[i\]\?\.attemptNo\|\|0/.test(s),
  uncertainBlocksCopy:/“Uncertain” is not labelled definitely wrong, but it DOES block progress before attempt 10/.test(s),
  safetyPassCopy:/Safety Pass after/.test(s)
};
for(const [k,v] of Object.entries(checks))assert(v,k+' failed');
console.log(JSON.stringify(checks,null,2));
