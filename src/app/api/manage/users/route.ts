import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.can_manage_access) {
      return NextResponse.json(
        { error: "Unauthorized. Only authorized administrators with access control rights can view user lists." },
        { status: 403 }
      );
    }

    const users = await query<{
      id: string | number;
      name: string;
      email: string;
      role: string;
      is_authorized: boolean;
      can_manage_access: boolean;
      created_at: string;
      last_login_at: string | null;
    }>(
      `SELECT id, name, email, role, is_authorized, can_manage_access, created_at, last_login_at 
       FROM cms_users 
       ORDER BY id ASC`
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/manage/users error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.can_manage_access) {
      return NextResponse.json(
        { error: "Unauthorized. Only authorized administrators can register new CMS users." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role = "admin", is_authorized = true, can_manage_access = false } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and security password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await query("SELECT id FROM cms_users WHERE LOWER(email) = $1 LIMIT 1", [cleanEmail]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email address is already registered." },
        { status: 409 }
      );
    }

    const password_hash = hashPassword(password);

    const inserted = await query<{ id: string | number }>(
      `INSERT INTO cms_users (name, email, password_hash, role, is_authorized, can_manage_access, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, role, is_authorized, can_manage_access, created_at`,
      [name.trim(), cleanEmail, password_hash, role, Boolean(is_authorized), Boolean(can_manage_access)]
    );

    return NextResponse.json({ success: true, user: inserted[0] });
  } catch (error) {
    console.error("POST /api/manage/users error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
