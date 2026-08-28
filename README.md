# IELTS SHADOWLAB v6.2 — Hybrid Pronunciation + Recall Fusion

## What changed in v6.2

v6.2 keeps the v6.1 Shadow pronunciation system and updates the **Recall** stage so students are not trapped by a single recognizer miss.

### Shadow
- Full-sentence Shadow still measures delivery: fluency, rhythm and connectedness.
- Validated pronunciation contrasts still use browser target-vs-trap carrier checks.
- Per-word local phoneme scores remain diagnostic only and do not fail a Shadow sentence by themselves.

### Recall
The old Recall scorer used one local phoneme sequence and a binary chunk rule:
- chunk score >= 70 -> counted
- chunk score < 70 -> zero
- pass required >=80% of chunks

This was especially harsh for routes with only three target chunks, because one recognition miss turned 3/3 into 2/3 = 67%.

v6.2 replaces that with **Recall evidence fusion**:

1. While the student records the full Recall answer, Chrome/Edge Web Speech captures transcript evidence in parallel when available.
2. The saved audio is still checked by the local phoneme model.
3. Each hand-curated target chunk receives:
   - a fuzzy lexical/transcript score,
   - a local phoneme score,
   - a fused chunk score.
4. Partial evidence contributes instead of becoming zero.
5. Overall Recall score is the mean of the target-chunk evidence scores.
6. A natural pass requires:
   - blended Recall score >=80,
   - at least 60% of target chunks with strong evidence.
7. Two distinct valid Recall recordings can produce a repeated-evidence pass when the recognizers miss different chunks on different attempts.
8. Re-analyzing the same recording does not count as a new attempt.
9. After 6 distinct valid Recall recordings, a Recall Safety Pass opens and is teacher-flagged.
10. If both recognition engines fail technically on a valid recording, the system bypasses the gate rather than forcing the student to repeat because of an engine failure.

## Browser behavior

Current Chrome / Edge are recommended.

If Web Speech Recognition is unavailable, Recall falls back to the local phoneme model. If the local worker is also unavailable, the valid recording receives an engine-bypass flag instead of a false failure.

## Teacher evidence

Teacher Area now stores and displays:
- Recall attempt number,
- blended Recall score,
- natural / repeated-evidence / safety / engine-bypass status,
- browser transcript when available,
- per-target lexical score,
- per-target phoneme score,
- evidence source.

## Existing pronunciation policy retained

Automatic Shadow pronunciation checks remain limited to validated target/trap contrasts. Unvalidated IPA contrasts do not decide PASS/FAIL.

Same-spelling context-sensitive words and browser-unreliable contrasts remain teaching/diagnostic targets rather than automatic gates.

## Corpus

The content bank is unchanged:
- 546 visible route variants
- 1,046 model sentences
- hand-curated Recall target chunks preserved

No SQL migration is required.

## Deployment check

After deployment, open `/test-launch.html`.

It checks:
1. Web Speech availability for Shadow carrier checks and Recall transcript evidence.
2. Local WASM phoneme fallback / per-word diagnostic inference.

