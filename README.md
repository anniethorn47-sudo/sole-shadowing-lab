IELTS SHADOWLAB v4.3 — Recall / Grammar / Work-Study / Deep Sound Update

Main changes
- Work / Study now asks students to choose Working, High-school student, or University student.
- Shadow and Recall are separate screens. Recall cannot see the model-answer side panel.
- Floating Record / Stop works in both Shadow and Recall.
- Recall Again is available after every recall attempt; best overall recall is saved.
- Recall scores Meaning 35% + Target language 30% + Grammar 20% + Natural wording 15%. Meaning uses local sentence embeddings so reasonable paraphrases are not judged only by exact word overlap.
- Grammar correction runs locally in-browser with Xenova/grammar-synthesis-small via Transformers.js.
- Targeted sound checks for -ed, -es /ɪz/ and j/ch use an optional local IPA recognizer on aligned word segments. First deep-sound use is a larger download (~230 MB); results are treated as confidence checks, not perfect phonetic certification.
- Existing Supabase / Netlify setup is unchanged. No new SQL is required.

Deploy
Replace the existing GitHub project files with this package and commit. Netlify will redeploy automatically.
