import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGeneratedDocument, updateGeneratedDocument, createNewVersion } from "@/lib/career/generated-document";
import { cvContentToPDFContent, generatePDFFromContent, generateWordHTML, generateText } from "@/lib/career/services/document-render";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const document = await getGeneratedDocument(docId);
    if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // TODO: Verify ownership through application -> owner

    // Check for export format
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    
    if (format === 'pdf') {
      const pdfContent = cvContentToPDFContent(document.content_json as any);
      const pdfBytes = generatePDFFromContent(pdfContent);
      return new NextResponse(pdfBytes as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        },
      });
    }
    if (format === 'doc') {
      const pdfContent = cvContentToPDFContent(document.content_json as any);
      const html = generateWordHTML(pdfContent);
      return new NextResponse(html as BodyInit, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.doc"`,
        },
      });
    }
    if (format === 'txt') {
      const pdfContent = cvContentToPDFContent(document.content_json as any);
      const text = generateText(pdfContent);
      return new NextResponse(text as BodyInit, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.txt"`,
        },
      });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('GET /api/career/documents/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const { content, title, status, action } = body;

    if (action === 'new_version') {
      const newDoc = await createNewVersion(docId, {
        content_json: content,
        title: title,
        provenance_json: { source: 'manual_edit', edited_by: user.id, edited_at: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, document: newDoc });
    }

    const updated = await updateGeneratedDocument(docId, {
      content_json: content,
      title,
      status,
      provenance_json: { last_edited_by: user.id, last_edited_at: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error('PUT /api/career/documents/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}