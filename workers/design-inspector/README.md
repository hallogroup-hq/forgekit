# ForgeKit Design Inspector Worker (Cloudflare Browser Run)

A dedicated, isolated, and zero-cost headless browser worker powering ForgeKit's Design.md inspection pipeline.

## 1. Zero-Cost Free Tier Verification

Cloudflare Browser Run (formerly Cloudflare Browser Rendering) includes a **100% free tier**:
- **Included Browser Hours:** 10 minutes per day ($0.00).
- **Concurrency:** Up to 3 concurrent browser instances.
- **Overage Cost:** N/A on Workers Free plan (hard capped — cannot incur accidental charges or surprise credit card billing).
- **Execution Cost:** Workers Free plan includes 100,000 requests per day at $0.00.

## 2. Architecture & Isolation Security

```
ForgeKit Frontend (Vercel)
        ↓
Vercel API Route (`/api/extract-design`)
  - SSRF URL and protocol validation
  - Injects `x-worker-auth` shared secret
        ↓ (HTTPS with Bearer Token)
Cloudflare Browser Run Worker (`workers/design-inspector/`)
  - Subresource request interception (SSRF blocking against private IPs & metadata)
  - Isolated Chromium execution
  - Base64 compressed JPEG screenshots
        ↓ (JSON Response with Base64 Images)
ForgeKit Frontend
  - Browser memory / IndexedDB persistence
  - Zero serverless filesystem storage
```

## 3. Deployment & Setup Instructions

### Prerequisites
- Free Cloudflare Account (No paid plan required).
- Node.js >= 18 and `wrangler` CLI.

### Step 1: Enable Browser Rendering in Cloudflare Dashboard
1. Log in to your Cloudflare Dashboard.
2. In the left navigation, go to **Compute (Workers) > Browser Rendering**.
3. Click **Enable Browser Rendering** (selects the Free Tier: 10 mins/day, 0 cost).

### Step 2: Configure Authentication Secret
In your terminal from `workers/design-inspector/`:
```bash
npx wrangler secret put INSPECTION_AUTH_SECRET
# Enter a secure random string (e.g. openssl rand -hex 24)
```

### Step 3: Deploy Worker
```bash
npx wrangler deploy
```
Wrangler will output the Worker URL (e.g. `https://forgekit-design-inspector.<your-subdomain>.workers.dev`).

### Step 4: Configure Vercel Environment Variables
In your Vercel Project Settings (or local `.env.local`):
```env
DESIGN_INSPECTION_WORKER_URL=https://forgekit-design-inspector.<your-subdomain>.workers.dev
DESIGN_INSPECTION_WORKER_SECRET=<same-secret-as-above>
```

### Fallback Behavior
If `DESIGN_INSPECTION_WORKER_URL` is not configured, ForgeKit automatically and gracefully falls back to:
1. Local Chromium (if running in local development with Chrome installed).
2. SSRF-safe HTML stream metadata extraction with explicit notification: `canFallbackToScreenshot: true`.
3. HTML5 Canvas screenshot pixel clustering and manual 14-section studio editing.
