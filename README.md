# ProofDrop

Cryptographic proof of authenticity for everyday files. Capture or upload a photo/document, fingerprint it with SHA-256 in the browser, anchor a signed timestamp, and share a public trust report.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 (design tokens in `app/globals.css`)
- Framer Motion for page transitions and micro-interactions
- Web Crypto API for client-side SHA-256
- `exifr` for local EXIF extraction
- HMAC-SHA256 anchor signing on the server (`node:crypto`)

## Run locally

```bash
npm install
npm run dev
```

App runs at http://localhost:3000.

```bash
npm run build
npm run typecheck
```

## Environment

Optional anchor secret (otherwise one is generated into `.data/anchor-secret` on first use):

```bash
cp .env.example .env.local
```

```bash
# 32+ random characters
PROOFDROP_ANCHOR_SECRET=replace-with-a-long-random-secret
```

Owner dashboard password and session secret are optional too:

```bash
# 8+ characters. Auto-generated into .data/admin-password if unset.
PROOFDROP_ADMIN_PASSWORD=replace-with-a-strong-password

# 16+ characters. Auto-generated into .data/admin-secret if unset.
PROOFDROP_ADMIN_SECRET=replace-with-a-long-random-secret
```

If `PROOFDROP_ADMIN_PASSWORD` is not provided, read the generated password from
`.data/admin-password` (file mode `0600`). Login is rate limited to 8 attempts
per 10 minutes per client.

### Serverless / Vercel deployment

The app never fails a proof because of a read-only filesystem. Persistence is
resolved in this order:

1. **Redis REST** (recommended for production) — set `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` (Vercel KV / Upstash), or the equivalent
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
2. **Local filesystem** — `.data/` when the runtime is writable.
3. **In-process memory** — always used as a cache so the creating instance can
   serve the proof immediately.

On a read-only serverless host, proofs are also cached in the visitor's browser
(`localStorage`) so `/verify/<hashId>` still renders for the creator. For durable
multi-instance storage, configure Redis REST. Always set
`PROOFDROP_ANCHOR_SECRET`, `PROOFDROP_ADMIN_PASSWORD`, and
`PROOFDROP_ADMIN_SECRET` in production so anchors and owner sessions stay stable
across instances.


## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page with live dropzone and community reviews |
| `/verify` | Live camera capture + file upload workspace |
| `/verify/[hashId]` | Public trust report card |
| `/demo` | Seeded sample report |
| `/trust` | Protocol, privacy model, scoring, API |
| `/reviews` | Public reviews list + submission form |
| `/admin` | Owner-only review and feature-request dashboard |

## API

- `POST /api/proof` — anchor a digest. Body: `{ sha256, clientCapturedAt, captureMode, metadata }`. Idempotent by digest.
- `GET /api/proof/:hashId` — fetch a stored proof record.
- `POST /api/anchor/verify` — recompute the HMAC anchor; optionally pass `sha256` to compare a re-hashed copy.
- `GET /api/reviews` — published reviews + aggregate stats.
- `POST /api/reviews` — submit a review (`name`, `rating`, `title`, `body`, optional `role`, `useCase`, `email`).
- `PATCH /api/reviews` — increment a review's helpful count (`{ id, action: "helpful" }`).
- `GET /api/admin/session` — whether the caller holds a valid owner session.
- `POST /api/admin/session` — owner login (`{ password }`), sets signed HttpOnly cookie.
- `DELETE /api/admin/session` — owner logout.
- `GET/PATCH/DELETE /api/admin/reviews` — owner-guarded review management (list, publish/hide, delete).
- `GET /api/admin/reviews/export?format=csv|json` — owner-guarded report export.

## Reviews

Reviews are stored in `.data/reviews.json` behind a serialized write queue, with
Redis REST and in-memory fallbacks for read-only serverless hosts (no database
required). Only published reviews appear publicly; the owner dashboard shows
hidden ones too. Feature requests are derived from review text by matching known
feature keywords in `lib/reviews-store.ts`, so the dashboard always reflects what
users actually asked for.


## Data model

Only the SHA-256 digest, derived metadata (type, size, dimensions, EXIF presence, boolean GPS), device telemetry, and the signed anchor record are persisted under `.data/proofs`. Original files are never uploaded.

## Verification logic

`lib/forensics.ts` produces the check list and status:

- Any critical failure (editing-suite signature, stripped EXIF on an uploaded image) forces `flagged`.
- Warnings alone keep `verified` but are surfaced on the card.
- Live camera captures are re-encoded in-memory with a ProofDrop capture stamp before hashing.
