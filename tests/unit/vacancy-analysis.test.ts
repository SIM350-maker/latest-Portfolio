// Unit tests for vacancy analysis
import { describe, it } from "node:test";
import assert from "node:assert";
import { extractVacancyDeterministic, vacancyToRequirements } from "@/lib/career/services/vacancy-analysis";

describe("Vacancy Analysis", () => {
  const sampleAdvert = `
Senior Software Engineer at Acme Corp

About Acme Corp:
We are a leading technology company.

Requirements:
- 5+ years experience with TypeScript and React
- Strong knowledge of PostgreSQL
- Experience with AWS or GCP
- Bachelor's degree in Computer Science or equivalent

Preferred:
- GraphQL experience
- Kubernetes experience

Responsibilities:
- Design and implement scalable systems
- Mentor junior developers
- Code reviews

Location: Remote
Employment Type: Full-time
Reference: REF-2026-001
Apply to: jobs@acme.example
Deadline: 2026-12-31
`;

  it("should extract employer from advert", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    // The deterministic parser extracts the first line of "About Acme Corp:" section
    assert.ok(result.employer?.includes("Acme Corp") || result.employer?.includes("leading technology"));
  });

  it("should extract title from advert", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    assert.ok(result.title?.includes("Senior Software Engineer"));
  });

  it("should extract location as remote", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    assert.strictEqual(result.work_arrangement, "remote");
  });

  it("should extract email", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    assert.strictEqual(result.recruitment_email, "jobs@acme.example");
  });

  it("should extract reference number", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    assert.strictEqual(result.reference_number, "REF-2026-001");
  });

  it("should extract required skills", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    assert.ok(result.required_technical_skills.includes("TypeScript"));
    assert.ok(result.required_technical_skills.includes("React"));
    assert.ok(result.required_technical_skills.includes("PostgreSQL"));
  });

  it("should extract preferred skills", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    assert.ok(result.preferred_technical_skills.includes("GraphQL"));
    assert.ok(result.preferred_technical_skills.includes("Kubernetes"));
  });

  it("should extract responsibilities", () => {
    const result = extractVacancyDeterministic(sampleAdvert);
    assert.ok(result.responsibilities.length > 0);
  });

  it("should convert vacancy to requirements", () => {
    const vacancy = extractVacancyDeterministic(sampleAdvert);
    const requirements = vacancyToRequirements(vacancy);
    
    assert.ok(requirements.length > 0);
    
    // Check mandatory requirements
    const mandatory = requirements.filter(r => r.is_mandatory);
    assert.ok(mandatory.length > 0);
    
    // Check categories
    const techSkills = requirements.filter(r => r.category === 'technical_skill');
    assert.ok(techSkills.length > 0);
  });
});

describe("Vacancy edge cases", () => {
  it("should handle empty advert", () => {
    const result = extractVacancyDeterministic("");
    assert.strictEqual(result.employer, null);
    assert.strictEqual(result.title, null);
  });

  it("should handle advert with no email", () => {
    const text = "Job at Company. Requirements: Python, JavaScript.";
    const result = extractVacancyDeterministic(text);
    assert.strictEqual(result.recruitment_email, null);
  });

  it("should handle advert with hybrid work", () => {
    const text = "Hybrid role in London. Requirements: React.";
    const result = extractVacancyDeterministic(text);
    assert.strictEqual(result.work_arrangement, "hybrid");
  });

  it("should handle advert with onsite work", () => {
    const text = "Onsite position in New York. Requirements: Java.";
    const result = extractVacancyDeterministic(text);
    assert.strictEqual(result.work_arrangement, "onsite");
  });
});