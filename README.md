# IELTS SHADOWLAB v4.9.1 — Full Context IPA

## Fix from v4.9
The v4.9 manifest already contained IPA for every token, but the acoustic checker skipped 4,680 weak/function-word tokens and the feedback UI only surfaced up to 8 interesting items. v4.9.1 fixes both issues.

- 546 visible route variants covered.
- 1,046 model sentences covered.
- 12,516 / 12,516 tokens have stored context IPA.
- 12,516 / 12,516 tokens are now mapped through the IPA feedback pipeline.
- 7,836 core/content tokens can affect the pronunciation gate.
- 4,680 weak/function tokens are compared with accepted strong/weak forms but do not lower the gate for natural reduction.
- The analysis screen shows the full IPA map for the current model sentence; there is no 8-item display cap.
- Context-locked homographs (e.g. live /lɪv/ vs live /laɪv/) remain explicit.
- Ending targets were rebuilt morphologically so lexical words such as need, speed, less, focus, class and famous are no longer mislabeled as -ed/-s grammar endings.

No Supabase SQL or Netlify environment-variable change is required.
