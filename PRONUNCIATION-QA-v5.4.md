# Pronunciation QA v5.4 — strict gate + 10-attempt safety

## Policy checks

- Attempts 1–9: uncertain core words block progress.
- Attempts 1–9: clear core-phone substitutions block progress.
- Attempts 1–9: per-word floor is 78; sentence Pronunciation >=80; Overall >=82.
- First-pass critical-sound suspicion requires a new valid recording.
- Weak/function words remain evidence-only and reduction-tolerant.
- Safety Pass activates only at analyzed attempt 10 when normal gate still fails.
- Safety Pass is flagged for teacher review and preserves unresolved gate reasons.
- Same-audio re-analysis does not increment analyzed-attempt count.

## Regression results

- Unit regression: 14/14 groups PASS.
- Corpus exact-target sweep: 1,046/1,046 natural PASS.
- Corpus accepted weak-form sweep: 1,046/1,046 natural PASS.
- Synthetic deliberate one-phone substitution sweep: 238/240 blocked before attempt 10 = 99.2%.
- Forced/Safety Pass before attempt 10: 0.
- Unresolved synthetic errors can Safety Pass at attempt 10: PASS.
- Distinct analyzed-recording counter QA: PASS.

## Interpretation

v5.4 intentionally accepts more false retries than v5.3 in exchange for a stronger pronunciation-learning loop. It avoids permanent lock-in through the 10-attempt Safety Pass rather than by treating uncertain core-word evidence as neutral.

The CTC model remains evidence, not a certified phonetic assessor. Real-device microphone/accent calibration remains necessary.
