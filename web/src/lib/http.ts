/** Resposta JSON com cache de CDN (s-maxage) para não repassar cada requisição à Microsoft. */
export function json(body: unknown, status = 200, sMaxAge = 0) {
  const headers: Record<string, string> = {};
  if (status === 200 && sMaxAge > 0) {
    headers["Cache-Control"] = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 4}`;
  }
  return Response.json(body, { status, headers });
}
