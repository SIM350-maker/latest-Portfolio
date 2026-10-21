import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getJobAdvert, updateJobAdvert, deleteJobAdvert } from "@/lib/career/job-advert";
import { getJobRequirementsByAdvert } from "@/lib/career/job-requirement";
import { getJobApplicationByOwnerAndAdvert } from "@/lib/career/job-application";
import { analyzeJobAdvert } from "@/lib/career/services/vacancy-analysis";
import { extractPDFText } from "@/lib/career/services/pdf-extract";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const advertId = parseInt(id, 10);
    if (isNaN(advertId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const advert = await getJobAdvert(advertId);
    if (!advert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (advert.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const requirements = await getJobRequirementsByAdvert(advertId);
    const application = await getJobApplicationByOwnerAndAdvert(user.id, advertId);

    return NextResponse.json({
      advert,
      requirements,
      application,
      extracted_vacancy: advert.extracted_json,
      analysis: advert.analysis_json,
    });
  } catch (error) {
    console.error('GET /api/career/adverts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch advert' }, { status: 500 });
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
    const advertId = parseInt(id, 10);
    if (isNaN(advertId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const advert = await getJobAdvert(advertId);
    if (!advert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (advert.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { raw_text, action } = body;

    if (action === 'reanalyze' && raw_text) {
      const { vacancy, requirements, usedAI } = await analyzeJobAdvert(raw_text, user.id);

      // Update advert
      await updateJobAdvert(advertId, {
        raw_text,
        extracted_json: vacancy,
        analysis_json: { requirements: requirements.map(r => ({
          category: r.category,
          text: r.text,
          is_mandatory: r.is_mandatory,
          confidence: r.confidence,
        })), used_ai: usedAI },
        status: 'ANALYZED',
      });

      // Replace requirements
      await query(`DELETE FROM job_requirement WHERE advert_id = $1`, [advertId]);
      await query(
        `INSERT INTO job_requirement (advert_id, category, requirement_text, is_mandatory, source_span, confidence, created_at)
         SELECT $1, r.category, r.text, r.is_mandatory, r.source_span::jsonb, r.confidence, NOW()
         FROM jsonb_to_recordset($2::jsonb) AS r(category text, text text, is_mandatory boolean, source_span jsonb, confidence real)`,
        [advertId, JSON.stringify(requirements.map(r => ({
          category: r.category,
          text: r.text,
          is_mandatory: r.is_mandatory,
          source_span: r.source_span,
          confidence: r.confidence,
        })))]
      );

      const updatedAdvert = await getJobAdvert(advertId);
      const updatedReqs = await getJobRequirementsByAdvert(advertId);

      return NextResponse.json({ success: true, advert: updatedAdvert, requirements: updatedReqs, usedAI });
    }

    if (raw_text !== undefined) {
      const updated = await updateJobAdvert(advertId, { raw_text });
      return NextResponse.json({ success: true, advert: updated });
    }

    return NextResponse.json({ error: 'No valid action or text provided' }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/career/adverts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update advert' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const advertId = parseInt(id, 10);
    if (isNaN(advertId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const advert = await getJobAdvert(advertId);
    if (!advert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (advert.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await deleteJobAdvert(advertId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/career/adverts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete advert' }, { status: 500 });
  }
}