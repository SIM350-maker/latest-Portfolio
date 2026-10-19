import crypto from "crypto";
import { cookies } from "next/headers";
import { query } from "./db";

export interface SessionUser {
  id: string | number;
  email: string;
  name: string;
  role: string;
  is_authorized: boolean;
  can_manage_access: boolean;
}

const SESSION_COOKIE_NAME = "cms_session_token";
const SECRET = process.env.AUTH_SECRET || "cms-secure-engineering-secret-key-simon-ipara-2026-portfolio";

export function createSessionToken(user: SessionUser): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiration
  const body = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_authorized: user.is_authorized,
      can_manage_access: user.can_manage_access,
      exp,
    })
  ).toString("base64url");

  const signature = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");

    if (signature.length !== expectedSignature.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      is_authorized: payload.is_authorized,
      can_manage_access: Boolean(payload.can_manage_access),
    };
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (e) {
      // During static prerendering, cookies() is not available
      return null;
    }
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session || !session.email) return null;

    // Verify against database to ensure user is still registered and active
    const rows = await query<{
      id: string | number;
      email: string;
      name: string;
      role: string;
      is_authorized: boolean;
      can_manage_access: boolean;
    }>(
      "SELECT id, email, name, role, is_authorized, can_manage_access FROM cms_users WHERE email = $1 LIMIT 1",
      [session.email.toLowerCase().trim()]
    );

    if (rows.length === 0 || !rows[0].is_authorized) {
      return null;
    }

    return {
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
      role: rows[0].role,
      is_authorized: Boolean(rows[0].is_authorized),
      can_manage_access: Boolean(rows[0].can_manage_access),
    };
  } catch (err) {
    console.error("Auth check error:", err);
    return null;
  }
}
