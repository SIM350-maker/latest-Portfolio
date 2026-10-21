import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  createJobAdvert,
  getJobAdvertsByOwner,
  type JobAdvertCreateInput,
} from "@/lib/career/job-advert";
import { createJobRequirementsBulk } from "@/lib/career/job-requirement";
import { createJobApplication } from "@/lib/career/job-application";
import { analyzeJobAdvert, type ExtractedVacancy } from "@/lib/career/services/vacancy-analysis";
import { extractPDFText } from "@/lib/career/services/pdf-extract";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
  'text/plain',
];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }
  return { valid: true };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerId = Number(user.id);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || undefined;

    const adverts = await getJobAdvertsByOwner(ownerId, limit, offset);
    // Filter by status if provided
    const filtered = status ? adverts.filter(a => a.status === status) : adverts;

    return NextResponse.json({ adverts: filtered });
  } catch (error) {
    console.error('GET /api/career/adverts error:', error);
    return NextResponse.json({ error: 'Failed to fetch adverts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerId = Number(user.id);

    const contentType = req.headers.get('content-type') || '';
    let rawText = '';
    let source: JobAdvertCreateInput['source'] = 'manual';
    let originalFilename: string | null = null;
    let originalMime: string | null = null;
    let originalBytes: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const textInput = formData.get('text') as string | null;

      if (file) {
        const validation = validateFile(file);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        originalFilename = file.name;
        originalMime = file.type;
        const arrayBuffer = await file.arrayBuffer();
        originalBytes = Buffer.from(arrayBuffer);

        // Extract text based on file type
        if (file.type === 'application/pdf') {
          const extracted = await extractPDFText(originalBytes);
          rawText = extracted.text;
          source = 'pdf';
        } else if (file.type.startsWith('image/')) {
          // For images, we need OCR - but that requires AI provider
          // For now, return an error asking for text input or AI config
          return NextResponse.json({
            error: 'Image OCR requires AI provider configuration. Please paste text manually or configure AI in settings.',
            needsOCR: true,
            file: { name: file.name, type: file.type, size: file.size },
          }, { status: 400 });
        } else if (file.type === 'text/plain') {
          rawText = new TextDecoder().decode(originalBytes);
          source = 'manual';
        }
      } else if (textInput) {
        rawText = textInput;
        source = 'manual';
      } else {
        return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
      }
    } else if (contentType.includes('application/json')) {
      // JSON text input
      const body = await req.json();
      rawText = body.text || '';
      if (!rawText.trim()) {
        return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
      }
      source = 'manual';
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'No text content extracted' }, { status: 400 });
    }

    // Create advert
    const advert = await createJobAdvert({
      owner_id: ownerId,
      source,
      original_filename: originalFilename,
      original_mime: originalMime,
      original_bytes: originalBytes,
      raw_text: rawText,
      status: 'IMPORTED',
    });

    // Analyze vacancy (deterministic + optional AI)
    const { vacancy, requirements, usedAI } = await analyzeJobAdvert(rawText, ownerId);

    // Update advert with extracted/analysis data
    await createJobRequirementsBulk(
      requirements.map(r => ({
        advert_id: advert.id,
        category: r.category,
        requirement_text: r.text,
        is_mandatory: r.is_mandatory,
        source_span: r.source_span,
        confidence: r.confidence,
      }))
    );

    // Update advert with extracted JSON and analysis
    // Note: In a real implementation, we'd update the advert with extracted_json and analysis_json
    // For now, we store them in the advert row

    // Create application record (DRAFT)
    const application = await createJobApplication({
      owner_id: ownerId,
      advert_id: advert.id,
      status: 'DRAFT',
      mode: 'MANUAL', // default; can be changed to AUTOMATED later
    });

    return NextResponse.json({
      success: true,
      advert: {
        ...advert,
        extracted_preview: vacancy,
        requirements_count: requirements.length,
        used_ai: usedAI,
      },
      application: { id: application.id, status: application.status },
    });
  } catch (error) {
    console.error('POST /api/career/adverts error:', error);
    return NextResponse.json({ error: 'Failed to create advert' }, { status: 500 });
  }
}