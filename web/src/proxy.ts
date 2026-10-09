import { NextResponse, type NextRequest } from "next/server";

/**
 * Resolve o mercado na raiz: 1) escolha salva (cookie), 2) país do IP informado pela Vercel, 3) seletor.
 * Nunca pede GPS. Sem detecção confiável, "/" mostra o seletor sem afirmar que detectou algo.
 */
export function proxy(req: NextRequest) {
  const saved = req.cookies.get("market")?.value;
  const country = req.headers.get("x-vercel-ip-country");
  const market = saved === "br" || saved === "us" ? saved : country === "BR" ? "br" : country === "US" ? "us" : null;
  if (!market) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${market}`;
  return NextResponse.redirect(url, 307);
}

export const config = { matcher: "/" };
