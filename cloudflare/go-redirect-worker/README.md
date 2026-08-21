# Cloudflare Worker: `/go/patreon/*` redirect + click tracking

This Worker tracks clicks (UTMs + a few extra fields) and redirects to Patreon.

## What it handles

- `https://terinashi.com/go/patreon/yt` (defaults: `utm_source=youtube`, `utm_medium=description`)
- `https://terinashi.com/go/patreon/ig` (defaults: `utm_source=instagram`, `utm_medium=bio`)
- `https://terinashi.com/go/patreon/site` (defaults: `utm_source=website`, `utm_medium=landing`)
- You can override/extend with standard UTM query params: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`

## UTM convention

- `utm_source`: the origin surface (`youtube`, `instagram`, `website`)
- `utm_medium`: the placement inside that surface (`description`, `comment_pinned`, `bio`, `official_links`)
- `utm_content`: the specific CTA or creative variant (`layers_long`, `nogravity_long`, `patreon_card`)
- `utm_term`: the asset id or variant key when useful

Website CTA example:

- `https://terinashi.com/go/patreon/site?utm_medium=official_links&utm_content=patreon_card`

## Short aliases (optional)

To avoid long URLs in social posts, you can use a short alias and have the Worker expand it into UTMs:

- `https://terinashi.com/go/patreon/yt/thanks` (or `...?thanks`) → `layers_launch_2026q1` + `description`
- `https://terinashi.com/go/patreon/yt/love` (or `...?love`) → `layers_launch_2026q1` + `comment_pinned`
- `https://terinashi.com/go/patreon/yt/hope` (or `...?hope`) → `layers_launch_2026q1` + `comment_pinned` (`nogravity_long`)
- `https://terinashi.com/go/patreon/yt/smile` (or `...?smile`) → `layers_launch_2026q1` + `description` (`nogravity_long`)

Edit `ALIAS_UTM_OVERRIDES` in `src/index.js` to add more.

## Deploy (Wrangler)

1. Install Wrangler (once): `npm i -g wrangler`
2. Login: `wrangler login`
3. Deploy from this folder:
   - `cd cloudflare/go-redirect-worker`
   - `wrangler deploy`

The Analytics Engine dataset (`patreon_clicks`) is created automatically on first write.

## Quick smoke test

Open `https://terinashi.com/go/patreon/yt?utm_campaign=test&utm_content=smoke` and confirm:

- it redirects to Patreon
- events appear in Analytics Engine under dataset `patreon_clicks`

## Notes

- Destination URL is controlled by `PATREON_URL` in `wrangler.toml`.
- By default, the redirect appends UTMs to the Patreon URL (`FORWARD_UTM = "1"`). Set it to `"0"` if you want a clean destination URL.
- Only `GET` requests are counted as clicks (we still redirect `HEAD`, but we do not log it).
