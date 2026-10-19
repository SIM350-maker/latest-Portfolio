import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password credential are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Look up user in cms_users table
    const users = await query<{
      id: string | number;
      name: string;
      email: string;
      password: string;
      role: string;
      is_authorized: boolean;
      can_manage_access: boolean;
    }>(
      "SELECT id, name, email, password, role, is_authorized, can_manage_access FROM cms_users WHERE LOWER(email) = $1 LIMIT 1",
      [cleanEmail]
    );

    // If email is not registered in the database table
    if (users.length === 0) {
      return NextResponse.json(
        {
          error:
            "Access Denied: This email address is not registered in the CMS access registry. Only pre-authorized registered emails may access this console.",
        },
        { status: 403 }
      );
    }

    const user = users[0];

    // Check if user is authorized
    if (!user.is_authorized) {
      return NextResponse.json(
        {
          error:
            "Access Revoked: Your registered email account is currently deactivated or pending administrative authorization.",
        },
        { status: 403 }
      );
    }

    // 2. Verify password (plain text comparison)
    if (password !== user.password) {
      return NextResponse.json(
        { error: "Invalid security passkey. Please check your credentials." },
        { status: 401 }
      );
    }

    // 3. Update last login timestamp
    await query("UPDATE cms_users SET last_login_at = NOW() WHERE id = $1", [user.id]).catch(() => {});

    // Try to record in audit_log if table exists
    await query(
      "INSERT INTO audit_log (actor, action, target_type, target_id, details, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [user.email, "LOGIN_SUCCESS", "cms_auth", String(user.id), JSON.stringify({ ip: req.headers.get("x-forwarded-for") || "local" })]
    ).catch(() => {});

    // 4. Generate signed session token
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_authorized: user.is_authorized,
      can_manage_access: user.can_manage_access,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        can_manage_access: user.can_manage_access,
      },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: "cms_session_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal authentication service error occurred." },
      { status: 500 }
    );
  }
}
