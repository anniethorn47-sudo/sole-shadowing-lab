# IELTS SHADOWLAB v5.0 — QA Summary

## Content / IPA coverage
- Visible route variants: **546**
- Pronunciation manifest routes: **546**
- Model sentences: **1046**
- Tokens with context IPA: **12516**
- Core phoneme-scored tokens: **7836**
- Weak/function tokens aligned with accepted reductions: **4680**
- Context-locked homograph tokens: **107**
- Explicit focus checks: **1521**
- Missing manifests: **0**
- Sentence/model-answer mismatches: **0**
- Tokens without IPA: **0**
- Tokens without model phonemes: **0**
- Recall target chunks that cannot be mapped to stored IPA: **0**

## v5 architecture checks
- whisperDependencyRemoved: **PASS**
- visibilityAwareActiveTimer: **PASS**
- audioWorkletPCM: **PASS**
- scriptProcessorFallback: **PASS**
- validAndRejectedRecordingCounters: **PASS**
- oneSharedPhonemeWorker: **PASS**
- mobileChunkedInference: **PASS**
- realWebGPUCapabilityTest: **PASS**
- wasmFallback: **PASS**
- homeTwoColumn: **PASS**
- topicSearch: **PASS**
- achievementDashboardDefault: **PASS**
- teacherGroupedByStudent: **PASS**
- teacherMultiClassAndStudentFilters: **PASS**
- teacherYearMonthWeekFilters: **PASS**
- teacherIntegrityEvidence: **PASS**

## Specific context checks
- `live` as a verb is stored as `/lɪv/` while `live` as an adjective is stored as `/laɪv/`.
- `used to` and ordinary `used` retain separate context pronunciations.

Static JavaScript syntax and ZIP integrity are checked during packaging.