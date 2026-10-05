/** Match the browser Origin against the actual Host, including reverse-proxy protocol. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return origin === `${protocol}://${host}`;
}
