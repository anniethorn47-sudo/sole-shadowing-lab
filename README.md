# IELTS SHADOWLAB v6 — Hybrid Pronunciation Gate

## What changed

Shadow pronunciation no longer uses the local CTC phoneme recognizer as the PASS/FAIL judge.

The v6 Shadow flow is:

1. Listen to the model twice.
2. Record the full Shadow sentence.
3. Analyze **delivery only** from the local recording: fluency, rhythm and connectedness.
4. If the sentence contains a pronunciation contrast that browser testing has shown can be usefully distinguished, complete 1–2 short **carrier-phrase pronunciation checks**.
5. Each pronunciation check compares evidence for the target word against known competing forms across up to five Web Speech alternatives.
6. IPA remains visible as a teaching reference, but unvalidated IPA contrasts do not automatically fail a student.

The old local phoneme CTC worker remains in the package only for **Recall target-chunk detection**.

## Hybrid target policy

Automatic Shadow pronunciation checks are generated only from:

- target/base contrasts for `-ed`, `-s`, and `-es` endings where a real lexical base is available;
- one-phone contrast families supported by the carrier-phrase benchmark, including `/f-v/`, `/θ-s/t/f/`, `/tʃ-dʒ/`, `/s-z/`, and `/ɪ-iː/`;
- a small manual contrast list for words such as `think`, `cheap`, `few`, `free`, `thing`, `thought`, `least`, and similar pairs.

Not auto-gated:

- same-spelling/context-sensitive pronunciations such as `live`, `use/used`, `read`, `close`, etc.;
- final-/k/ style checks such as `back`, because the browser benchmark showed that Chrome could still output the target word even when the sound was deliberately altered;
- any sentence without a validated target/trap rule.

## Corpus coverage

The content and IPA manifest are unchanged:

- 546 routes
- 1,046 model sentences

v6 generated:

- 500 / 1,046 sentences with at least one automatic pronunciation focus check
- 648 automatic focus checks total
- maximum 2 checks per sentence
- 546 sentences intentionally left without an automatic pronunciation verdict

This is deliberate. v6 prefers **no verdict** over a false pronunciation verdict.

## Confidence competition

For each micro-check, Chrome/Edge may return up to five recognition alternatives.

v6 uses the strongest confidence containing the target word and the strongest confidence containing a known trap.

Default policy:

- minimum usable confidence: 0.55
- target/trap decision margin: 0.07
- target clearly stronger -> PASS
- trap clearly stronger -> RETRY
- evidence too close / neither form clear -> UNCLEAR and retry

A random top-1 transcript does not automatically beat a higher-confidence target alternative.

## 10-attempt safety valve

- Delivery: if a student still cannot clear the delivery threshold after 10 distinct valid Shadow recordings, Safety Pass opens.
- Pronunciation focus: if one micro-check still cannot clear after 10 scored pronunciation attempts, that check receives Safety Pass.
- Safety Pass is stored and visible in Teacher Area; it is not reported as a natural pronunciation pass.

## Browser requirement

Automatic pronunciation focus uses the Web Speech Recognition API. Current Chrome / Edge are the intended browsers.

If the browser does not provide Web Speech Recognition, the automatic pronunciation focus is bypassed rather than replaced with the old phoneme judge. Teacher Area receives a browser-bypass flag.

## Recall

Recall behavior is intentionally unchanged in v6. The local WASM q4 phoneme worker is still used to detect the hand-curated target chunks for Recall >=80%.

Run `/test-launch.html` after deployment. It checks:

1. whether Web Speech Recognition is available for Shadow pronunciation checks;
2. whether the Recall-only WASM phoneme model can load and run real inference.
