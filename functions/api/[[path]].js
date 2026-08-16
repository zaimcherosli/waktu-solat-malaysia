/**
 * Cloudflare Pages Functions - API Edge Proxy Router
 * Same-origin proxy for /api/* requests directly to Cloudflare Worker backend & JAKIM API.
 * Solves Mobile Carrier DNS blocking, CORS, and cross-origin fetch issues on mobile networks.
 */

const WORKER_BACKEND_URL = "https://waktu-solat-push.huzaimrosli.workers.dev";

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Handle OPTIONS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  // Edge Proxy for JAKIM e-solat API if requested via /api/esolat
  if (url.pathname === "/api/esolat") {
    const zone = url.searchParams.get("zone") || "SGR01";
    try {
      const jakimUrl = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zone}`;
      const res = await fetch(jakimUrl, {
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Target URL on Cloudflare Worker Backend
  const targetUrl = `${WORKER_BACKEND_URL}${url.pathname}${url.search}`;

  // Clone headers
  const headers = new Headers(request.headers);
  headers.set("Host", new URL(WORKER_BACKEND_URL).host);

  const init = {
    method: request.method,
    headers: headers
  };

  if (["POST", "PUT", "PATCH"].includes(request.method.toUpperCase())) {
    init.body = await request.clone().arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: "Edge Proxy Error: " + err.message }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
