IELTS SHADOWLAB v4.2 — SPEAKING UX + FLUENCY FIX

Changes from v4.1:
- Fluency ignores leading/trailing silence before/after actual speech.
- WPM is calculated on detected spoken duration, not time spent reaching the Stop button.
- Floating Record/Stop dock follows the screen while the student scrolls.
- More noticeable playback speeds: .65x / .8x / 1x plus Extra slow.
- Automatically prefers Natural/Neural/Premium English system voices when available.
- Voice selector lets the learner choose any English voice exposed by the browser/OS.
- Any word below 70 has a one-tap speaker button to hear that word only.
- Supabase/teacher dashboard behavior from v4.1 is unchanged.

Deploy by replacing the GitHub repository contents with this package, preserving netlify/functions/shadowlab.mjs, then let Netlify deploy the commit. Environment variables remain unchanged.
