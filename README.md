# Phy6-Master
A comprehensive Learning Management System for A/L Physics education, streamlining teaching, learning, tute management, and financial operations with role-based access for Teachers, Students, Accountants, and Tute Managers.

## Deployment

### Backend (Railway + Aiven MySQL)
1. Create an Aiven MySQL service and copy the JDBC URL (include SSL, e.g. `?ssl-mode=REQUIRED`).
2. In Railway, create a new project and deploy this repo with **Root Directory** set to `backend`.
3. Set these Railway environment variables:

| Variable | Example |
| --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://HOST:PORT/DB?ssl-mode=REQUIRED` |
| `SPRING_DATASOURCE_USERNAME` | `avnadmin` |
| `SPRING_DATASOURCE_PASSWORD` | `your-password` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://your-frontend-domain` |
| `STRIPE_API_KEY` | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_SUCCESS_URL` | `https://your-frontend-domain/student/payment-success` |
| `STRIPE_CANCEL_URL` | `https://your-frontend-domain/student/payment-cancel` |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` (optional) |
| `OPENAI_API_KEY` | `your-key` (optional) |

Railway provides `PORT` automatically; the backend now reads it.

### File storage (Supabase Storage – free tier)
1. Create a Supabase project → **Storage** → create a bucket (e.g. `phy6-files`) and make it **Public**.
2. In Supabase, open **Project Settings → API** and copy:
   - **Project URL**
   - **Service Role Key**
3. Add these Railway environment variables:

| Variable | Example |
| --- | --- |
| `STORAGE_PROVIDER` | `supabase` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `service-role-key` |
| `SUPABASE_STORAGE_BUCKET` | `phy6-files` |
| `SUPABASE_STORAGE_PUBLIC_URL` | `https://xxxx.supabase.co/storage/v1/object/public/phy6-files` |

Uploads for materials, receipts, and payment proofs will now go to Supabase and store public URLs.

### Frontend (Vercel – free tier)
1. Import the repo in Vercel and set **Root Directory** to `frontend`.
2. Build command: `npm run build` (output: `dist`).
3. Add the environment variable `VITE_API_BASE_URL` pointing to your Railway backend URL.

### Local development
1. Copy `local-application.properties.example` to `local-application.properties` and fill in local secrets.
2. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` as needed.
