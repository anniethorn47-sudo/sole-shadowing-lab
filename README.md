IELTS SHADOWLAB v4.4 — RECALL RELIABILITY FIX

Main fixes from v4.3:
- Fixes [object Promise]% / NaN in Meaning and Recall Overall.
- Each Recall attempt has an independent analysis token, transcript, score and history entry. Old async results cannot overwrite a newer attempt.
- Recall again now prepares a fresh attempt; it does not silently reuse attempt 1.
- Floating Record in Recall starts a fresh attempt when a previous result is visible.
- Removes hallucinated full-sentence grammar rewrites. The app never displays a generated “suggested version”.
- Grammar uses high-confidence local rules and lists specific detected issues only.
- Natural wording uses common collocation/wording rules.
- Meaning still uses local sentence embeddings so valid paraphrases can score well.
- Recall result cards now show Strong / OK / Needs work plus plain-language notes.
- Work/Study tracks, Supabase, pronunciation sound checks and Shadow/Recall split screens from v4.3 are retained.

Deployment:
Replace the repository contents with this package and commit. Netlify will redeploy. No SQL or environment-variable changes are required.
