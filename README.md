IELTS SHADOWLAB v4.1 CLOUD — SUPABASE KEY FIX

Use this package instead of v4.

Main fix:
- Supports Supabase new sb_secret_* keys correctly.
- SUPABASE_URL can be base URL or accidentally include /rest/v1/.
- No hard-coded fallback Supabase project remains.

Deploy from GitHub to Netlify.
Required Netlify environment variables:
SUPABASE_URL
SUPABASE_SECRET_KEY
SHADOWLAB_TEACHER_PASSWORD

See SETUP-SUPABASE.md.
