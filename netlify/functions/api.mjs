import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual } from "node:crypto";

const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const response = (status, body) => new Response(JSON.stringify(body), { status, headers });
const secret = () => process.env.PICHE_TOKEN_SECRET || process.env.PICHE_ADMIN_PASSWORD || "";
function sign(value) { return createHmac("sha256", secret()).update(value).digest("hex"); }
function makeToken(email) { const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 12 * 60 * 60 * 1000 })).toString("base64url"); return payload + "." + sign(payload); }
function validToken(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !secret()) return false;
  const expected = sign(payload);
  try { if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false; } catch { return false; }
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()); return !!data.email && data.exp > Date.now(); } catch { return false; }
}
async function readBody(req) { try { return await req.json(); } catch { return null; } }
export default async (req) => {
  const pathname = new URL(req.url).pathname;
  const path = pathname.includes("/.netlify/functions/api/") ? pathname.split("/.netlify/functions/api/")[1] : pathname.replace(/^\/api\/?/, "");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
  if (path === "login" && req.method === "POST") {
    const body = await readBody(req);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const adminEmail = String(process.env.PICHE_ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = String(process.env.PICHE_ADMIN_PASSWORD || "");
    if (!adminEmail || !adminPassword || !process.env.PICHE_TOKEN_SECRET) return response(503, { error: "Falta configurar PICHE_ADMIN_EMAIL, PICHE_ADMIN_PASSWORD y PICHE_TOKEN_SECRET en Netlify." });
    if (email !== adminEmail || password !== adminPassword) return response(401, { error: "Correo o contraseña incorrectos." });
    return response(200, { token: makeToken(email) });
  }
  if (path === "state" && (req.method === "GET" || req.method === "PUT")) {
    if (!validToken(req)) return response(401, { error: "Sesión no válida o vencida. Inicia sesión nuevamente." });
    const store = getStore("piche-maintenance-data");
    if (req.method === "GET") {
      const state = await store.get("state", { type: "json" });
      return response(200, { state: state || null });
    }
    const body = await readBody(req);
    const state = body?.state || body;
    if (!state || !Array.isArray(state.vehicles) || !Array.isArray(state.types) || !Array.isArray(state.maintenance) || !Array.isArray(state.odometer)) return response(400, { error: "El formato de los datos no es válido." });
    await store.setJSON("state", { ...state, _updatedAt: new Date().toISOString() });
    return response(200, { ok: true, updatedAt: new Date().toISOString() });
  }
  return response(404, { error: "Ruta no encontrada." });
};
