# IPA Coverage Audit v4.9.1

- Visible route variants: **546/546**
- Manifest route keys missing/extra: **0 / 0**
- Model-answer sentence mismatches: **0**
- Model sentences: **1046**
- Tokens with stored context IPA: **12516/12516**
- Core/content tokens (full phoneme scoring): **7836**
- Weak/function tokens (IPA compared, reduction-tolerant): **4680**

## Ending / sound target QA
- **-ed /d/**: 114 occurrences, 55 unique words
- **-ed /t/**: 67 occurrences, 21 unique words
- **-ed /ɪd/**: 63 occurrences, 28 unique words
- **-s /s/**: 218 occurrences, 66 unique words
- **-s /z/**: 532 occurrences, 164 unique words
- **-s/-es /ɪz/**: 58 occurrences, 25 unique words
- **ch /tʃ/**: 246 occurrences, 49 unique words
- **j /dʒ/**: 168 occurrences, 21 unique words
- **’s /s/**: 47 occurrences, 3 unique words
- **’s /z/**: 6 occurrences, 2 unique words
- **’s /ɪz/**: 2 occurrences, 1 unique words

## Regression exclusions
The following lexical endings are explicitly not treated as grammatical -ed/-s targets:
`need`, `speed`, `less`, `focus`, `class`, `famous`, `always`, `sometimes`, `news`, `series`, `maths`, `business`, etc.

## Scoring policy
Every token receives a stored IPA target and, when timing evidence exists, a detected-phoneme comparison. Only core/content tokens alter the pronunciation gate. Weak/function words are displayed and compared against strong/weak variants, but natural reduction cannot lower the gate.
