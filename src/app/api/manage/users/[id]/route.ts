import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.can_manage_access) {
      return NextResponse.json(
        { error: "Unauthorized. Access control management required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, role, is_authorized, can_manage_access, new_password } = body;

    // Check user exists
    const users = await query<{ id: string; email: string; role: string }>(
      "SELECT id, email, role FROM cms_users WHERE id = $1 LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = users[0];

    // Prevent revoking access from the primary owner
    if (
      targetUser.email === "simonipara428@gmail.com" &&
      is_authorized === false
    ) {
      return NextResponse.json(
        { error: "Cannot revoke authorization from the primary portfolio owner." },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (is_authorized !== undefined) {
      fields.push(`is_authorized = $${paramIndex++}`);
      values.push(Boolean(is_authorized));
    }
    if (can_manage_access !== undefined) {
      fields.push(`can_manage_access = $${paramIndex++}`);
      values.push(Boolean(can_manage_access));
    }
    if (new_password) {
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(hashPassword(new_password));
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const updated = await query(
      `UPDATE cms_users SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING id, name, email, role, is_authorized, can_manage_access, updated_at`,
      values
    );

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (error) {
    console.error("PATCH /api/manage/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.can_manage_access) {
      return NextResponse.json(
        { error: "Unauthorized. Access control management required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check user exists
    const users = await query<{ id: string; email: string }>(
      "SELECT id, email FROM cms_users WHERE id = $1 LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (users[0].email === "simonipara428@gmail.com") {
      return NextResponse.json(
        { error: "Cannot delete the primary portfolio owner account." },
        { status: 400 }
      );
    }

    if (String(users[0].id) === String(currentUser.id)) {
      return NextResponse.json(
        { error: "Cannot delete your own active session account." },
        { status: 400 }
      );
    }

    await query("DELETE FROM cms_users WHERE id = $1", [id]);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/manage/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
