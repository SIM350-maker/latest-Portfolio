import { NextResponse } from "next/server";
import { sql } from "@/lib/db";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required fields." },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO contact_messages (
        name, email, subject, message, handled, created_at
      ) VALUES (
        ${name}, ${email}, ${subject || "Portfolio Inquiry"}, ${message}, false, NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been securely recorded and dispatched to Simon Ipara.",
        ticketId: rows[0].id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, email, subject, message, handled, created_at
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET /api/contact error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
