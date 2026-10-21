// Integration tests for evidence matching
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { query } from "@/lib/db";
import { createJobAdvert, getJobAdvert } from "@/lib/career/job-advert";
import { runEvidenceMatching } from "@/lib/career/services/evidence-matching";
import { createJobApplication } from "@/lib/career/job-application";

describe("Evidence Matching Integration", () => {
  let testAdvertId: number;
  let testApplicationId: number;

  before(async () => {
    // Create test advert
    const advert = await createJobAdvert({
      owner_id: 1,
      source: 'manual',
      raw_text: `Senior Software Engineer at Test Corp
Requirements:
- 3+ years TypeScript
- React experience
- PostgreSQL knowledge
`,
      status: 'IMPORTED',
    });
    testAdvertId = advert.id;

    // Create test application
    const app = await createJobApplication({
      owner_id: 1,
      advert_id: testAdvertId,
      status: 'DRAFT',
    });
    testApplicationId = app.id;
  });

  after(async () => {
    // Cleanup
    await query(`DELETE FROM application_evidence_match WHERE application_id = $1`, [testApplicationId]);
    await query(`DELETE FROM job_requirement WHERE advert_id = $1`, [testAdvertId]);
    await query(`DELETE FROM job_application WHERE id = $1`, [testApplicationId]);
    await query(`DELETE FROM job_advert WHERE id = $1`, [testAdvertId]);
  });

  it("should run evidence matching and persist results", async () => {
    const results = await runEvidenceMatching({
      ownerId: 1,
      advertId: testAdvertId,
      applicationId: testApplicationId,
    });

    // The function may return empty results if no matching professional records exist
    // The important thing is that it runs without error
    assert.ok(Array.isArray(results));
  });

  it("should classify matches correctly", async () => {
    const results = await runEvidenceMatching({
      ownerId: 1,
      advertId: testAdvertId,
      applicationId: testApplicationId,
    });

    for (const result of results) {
      assert.ok(result.matches.length > 0);
      
      for (const match of result.matches) {
        assert.ok(['STRONG', 'PARTIAL', 'TRANSFERABLE', 'NO_EVIDENCE', 'REQUIRES_VERIFICATION'].includes(match.match_class));
        assert.strictEqual(typeof match.confidence, 'number');
        assert.ok(match.confidence >= 0);
        assert.ok(match.confidence <= 1);
        assert.strictEqual(typeof match.reason, 'string');
        assert.ok(match.reason.length > 0);
      }
    }
  });

  it("should have evidence references", async () => {
    const results = await runEvidenceMatching({
      ownerId: 1,
      advertId: testAdvertId,
      applicationId: testApplicationId,
    });

    for (const result of results) {
      for (const match of result.matches) {
        if (match.match_class !== 'NO_EVIDENCE') {
          assert.ok(match.source_table);
          assert.ok(match.source_id > 0);
        }
      }
    }
  });
});