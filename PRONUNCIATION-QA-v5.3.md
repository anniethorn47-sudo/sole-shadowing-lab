# Pronunciation QA v5.3 — evidence-calibrated scorer

## Core behavior

- Phoneme CTC output is treated as acoustic evidence, not ground truth.
- Best stored pronunciation variant is selected per word.
- Weak/function words never hard-fail.
- Short sentences have a minimum tolerance of one reliable low word so one CTC misread cannot fail a two- or three-core-word sentence by ratio alone.
- First critical discrepancy is unconfirmed and does not hard-block by itself.
- Same critical discrepancy repeated on the next valid attempt becomes confirmed.
- Uncertain alignment is excluded from the reliable-below-70 ratio and receives a neutral floor for pronunciation aggregation.
- >45% uncertain core evidence returns an inconclusive retry state.

## Automated checks

- 13/13 focused regression groups passed.
- Full manifest exact-target sweep: 1,046/1,046 passed.
- Full manifest accepted weak-variant sweep: 1,046/1,046 passed.
- 220 evenly distributed sentences retained for noise-oriented regression sampling.
- 120 simulated one-phone CTC deletion trials: 0 false hard failures.

## Tested contrasts / safeguards

- context-locked `live` /lɪv/ vs /laɪv/
- arbitrary repeated CTC noise on a context-locked word does not become a heteronym verdict
- repeated critical confirmation and correction on retry
- `-ed /ɪd/` focus confirmation
- weak-form omission
- alternate weak-form selection
- American /t/ -> [ɾ] tolerance
- near-vowel recognizer confusion tolerance
- broad bad-segment evidence still fails
- high uncertainty becomes inconclusive, not wrong

## Human/device QA still required

Static and synthetic tests cannot prove acoustic accuracy for every speaker, microphone, browser, or accent. Use Teacher Calibration mode on representative real recordings before rollout. The Debug trace is designed specifically to distinguish learner evidence from recognizer uncertainty.
