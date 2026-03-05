# Cloudflare Worker: `/go/patreon/*` redirect + click tracking

This Worker tracks clicks (UTMs + a few extra fields) and redirects to Patreon.

## What it handles

- `https://terinashi.com/go/patreon/yt` (defaults: `utm_source=youtube`, `utm_medium=social`)
- `https://terinashi.com/go/patreon/ig` (defaults: `utm_source=instagram`, `utm_medium=social`)
- `https://terinashi.com/go/patreon/site` (defaults: `utm_source=website`, `utm_medium=site`)
- You can override/extend with standard UTM query params: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`

## Deploy (Wrangler)

1. Install Wrangler (once): `npm i -g wrangler`
2. Login: `wrangler login`
3. Deploy from this folder:
   - `cd cloudflare/go-redirect-worker`
   - `wrangler deploy`

The Analytics Engine dataset (`patreon_clicks`) is created automatically on first write.

## Quick smoke test

Open `https://terinashi.com/go/patreon/yt?utm_campaign=test` and confirm:

- it redirects to Patreon
- events appear in Analytics Engine under dataset `patreon_clicks`

## Notes

- Destination URL is controlled by `PATREON_URL` in `wrangler.toml`.
- If you want the redirect to also *append* UTMs to the Patreon URL, set `FORWARD_UTM = "1"`.

