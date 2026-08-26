# IELTS SHADOWLAB v5.4 — Strict Pronunciation Gate + 10-Attempt Safety Pass

This release keeps the stable local WASM q4 phoneme engine and v5.3 context-aware alignment, but changes the **training policy**. v5.3 was intentionally conservative about acoustic uncertainty and could let an obviously poor core word become merely `uncertain`. v5.4 makes uncertain or mismatched core-word evidence **actionable**: it blocks progress and asks for another valid recording during attempts 1–9.

## Why v5.4 exists

The goal is pronunciation practice, not merely avoiding false negatives. Therefore:

- a core word marked `uncertain` is **not declared definitely wrong**, but it **does not pass**;
- a clear core-phone substitution (for example /ɪ/→/i/, /s/→/z/, /tʃ/→/dʒ/) requires a new valid recording;
- a core word below the per-word practice floor requires repair;
- a first critical-sound suspicion now blocks until a new recording clears or confirms it;
- weak/function words remain reduction-tolerant and cannot hard-fail the sentence;
- after 10 **distinct analyzed valid recordings** for the same sentence, a Safety Pass opens so a learner cannot become permanently trapped by recognizer/microphone limitations.

Safety Pass is visibly flagged and is **not treated as mastery** in Teacher Dashboard.

## Strict gate for attempts 1–9

A sentence naturally passes only when all relevant checks are clear:

- Overall >= 82
- Pronunciation >= 80
- no unresolved `uncertain` core word
- no clear core-phone substitution
- no core word below the 78 per-word practice floor
- reliable low-word allowance stays within 20% (no automatic one-word exemption for short sentences)
- no unresolved critical-sound recheck
- no critical pronunciation issue confirmed across repeated valid recordings

Overall weighting remains pronunciation-dominant:

- Pronunciation 55%
- Fluency 15%
- Rhythm 15%
- Connected speech 15%

## What counts as an attempt

The 10-attempt rule uses **distinct valid recordings that were actually analyzed**.

- Re-analyzing the same audio does **not** increase the attempt count.
- Recording multiple clips without analyzing them does **not** increase the analyzed-attempt count.
- Rejected/silent/background-invalid recordings do **not** count.
- A new valid recording that is analyzed adds one attempt.

At analyzed attempt 10, if the normal gate is still not met, ShadowLab returns:

**SAFETY PASS — teacher review recommended**

The unresolved gate reasons and pronunciation evidence remain stored.

## Student feedback states

- `good`: no repair requested.
- `review`: pronunciation is usable but below the strict practice target; may block if it contains a clear substitution or falls below the per-word floor.
- `uncertain`: the acoustic model is not reliable enough to say exactly what happened, but the word **must be retried** before attempt 10.
- `confirmed`: a critical target issue repeated across separate valid recordings.
- `weak`: function-word evidence only; natural reduction is accepted.

## Teacher calibration / debug

Teacher Calibration mode continues to show:

- target IPA and selected accepted variant;
- detected phone segment;
- word score/state;
- evidence quality and coverage;
- match / substitution / deletion / insertion alignment;
- suspected vs confirmed critical sound;
- sentence attempt number;
- Safety Pass flag and the gate reasons that were still unresolved.

This lets the teacher distinguish a normal pass from a system safety release.

## QA completed for v5.4

- Unit regression groups: 14 / 14 PASS.
- Full corpus: 1,046 / 1,046 exact target pronunciations naturally pass.
- Full corpus: 1,046 / 1,046 stored accepted weak-form variants naturally pass.
- Synthetic clear one-phone deliberate-error sweep: 238 / 240 blocked before attempt 10 (99.2%).
- Safety Pass before attempt 10: 0 cases.
- Safety Pass at attempt 10 for unresolved deliberate-error cases: verified.
- Distinct-recording attempt logic: static QA PASS.
- Re-analyzing the same recording cannot increase the attempt count: static QA PASS.
- Practice/Teacher inline JavaScript syntax: PASS.

Run the local QA suite after future scoring changes:

```bash
node pronunciation-scoring-v5.4.test.cjs
node pronunciation-corpus-regression-v5.4.cjs
node pronunciation-deliberate-error-regression-v5.4.cjs
node practice-gate-qa-v5.4.cjs
```

## Deployment

No SQL migration and no new Netlify environment variable are required. Deploy the ZIP root as before, then run `/test-launch.html` on representative devices.

Important: these QA tests validate scoring/alignment/gating logic. They do **not** prove acoustic accuracy for every real human voice, microphone, browser, or accent. Teacher Calibration mode should still be used for real-device spot checks before broad rollout.
