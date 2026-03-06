const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

const DEFAULTS_BY_TAG = {
  yt: { utm_source: "youtube", utm_medium: "social" },
  ig: { utm_source: "instagram", utm_medium: "social" },
  site: { utm_source: "website", utm_medium: "site" },
};

function normalizeTag(value) {
  return (value || "").trim().toLowerCase();
}

function getRouteInfo(pathname) {
  const prefix = "/go/patreon";
  if (pathname === prefix) return { ok: true, tag: "direct", detail: "" };
  if (pathname === `${prefix}/`) return { ok: true, tag: "direct", detail: "" };
  if (!pathname.startsWith(`${prefix}/`)) return { ok: false };

  const parts = pathname.slice(prefix.length + 1).split("/").filter(Boolean);
  const tag = normalizeTag(parts[0] || "direct");
  const detail = parts.slice(1).join("/");
  return { ok: true, tag, detail };
}

function getUtm(url, tag) {
  const defaults = DEFAULTS_BY_TAG[tag] || { utm_source: "direct", utm_medium: "redirect" };
  const result = {};

  for (const key of UTM_KEYS) {
    result[key] = url.searchParams.get(key) || defaults[key] || "";
  }

  return result;
}

function getRefererHost(request) {
  const value = request.headers.get("Referer");
  if (!value) return "";
  try {
    return new URL(value).hostname || "";
  } catch {
    return "";
  }
}

function getCountry(request) {
  return request.headers.get("cf-connecting-country") || request.headers.get("cf-ipcountry") || "";
}

function classifyUserAgent(userAgent) {
  const ua = (userAgent || "").toLowerCase();
  if (!ua) return "";

  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (
    ua.includes("mobi") ||
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("android") ||
    ua.includes("windows phone")
  ) {
    return "mobile";
  }

  return "desktop";
}

function buildDestinationUrl(base, utm, shouldForwardUtm) {
  const destination = new URL(base);
  if (!shouldForwardUtm) return destination;

  for (const key of UTM_KEYS) {
    if (utm[key]) destination.searchParams.set(key, utm[key]);
  }

  return destination;
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const route = getRouteInfo(url.pathname);
    if (!route.ok) {
      return new Response("Not Found", { status: 404 });
    }

    const utm = getUtm(url, route.tag);
    const refererHost = getRefererHost(request);
    const country = getCountry(request);
    const uaClass = classifyUserAgent(request.headers.get("User-Agent") || "");

    if (request.method === "GET") {
      try {
        env.PATREON_CLICKS.writeDataPoint({
          indexes: [route.tag],
          doubles: [1],
          blobs: [
            url.pathname,
            route.tag,
            route.detail,
            utm.utm_source,
            utm.utm_medium,
            utm.utm_campaign,
            utm.utm_content,
            utm.utm_term,
            refererHost,
            country,
            uaClass,
          ],
        });
      } catch {
        // Intentionally ignore analytics failures; redirect should still work.
      }
    }

    const patreonUrl = env.PATREON_URL || "https://patreon.com/terinashi";
    const shouldForwardUtm = String(env.FORWARD_UTM || "0") === "1";
    const destination = buildDestinationUrl(patreonUrl, utm, shouldForwardUtm);

    return new Response(null, {
      status: 302,
      headers: {
        Location: destination.toString(),
        "Cache-Control": "no-store",
      },
    });
  },
};
