# Publication & Visibility Rules

## Three Independent Dimensions

Every academic and certification record has three independent visibility dimensions:

### 1. Publication Status
- **Draft**: Work in progress, not ready for public view
- **Published**: Approved for public display
- **Archived**: Historical record, hidden from main listings but accessible via direct link

### 2. Visibility
- **Public**: Visible to everyone on the public site
- **Private**: Only visible to authenticated CMS users
- **Restricted**: Visible only to specific roles (future use)

### 3. Evidence Access (Documents)
- **Available**: Document can be viewed/downloaded publicly
- **Unavailable**: Document exists but is not publicly accessible
- **Restricted**: Document requires special permission

## Hierarchy & Inheritance

### Academics Hierarchy
```
Qualification
  └── Period(s)
        └── Semester(s)
              └── Unit(s)
```

**Rule**: A child record cannot be more visible than its parent.

| Parent State | Child Effective State |
|--------------|----------------------|
| Draft / Private | Hidden (regardless of child settings) |
| Published / Public | Child settings respected |
| Published / Private | Child hidden even if Published/Public |
| Archived / Public | Child hidden (archived = not in listings) |

### Certifications
Flat structure (no hierarchy), but same dimensions apply.

## Implementation

### Database Constraints
No database-level enforcement (flexible for edge cases). Enforcement is in application layer.

### Server-Side Query Filters

**Public Academics Queries** (`src/lib/academics-public.ts`):
```sql
-- Qualification
WHERE publication_status = 'Published' AND visibility = 'Public'

-- Semester (must also check parent qualification)
WHERE s.publication_status = 'Published' 
  AND s.visibility = 'Public'
  AND q.publication_status = 'Published' 
  AND q.visibility = 'Public'

-- Unit (must check semester and qualification)
WHERE u.publication_status = 'Published'
  AND u.visibility = 'Public'
  AND s.publication_status = 'Published'
  AND s.visibility = 'Public'
  AND q.publication_status = 'Published'
  AND q.visibility = 'Public'
```

**Public Certifications Queries** (existing `/api/certifications`):
```sql
WHERE is_posted = TRUE AND is_visible = TRUE
```

### CMS Mutation Rules
When updating publication/visibility:
1. If setting parent to `Draft` or `Private`, optionally cascade to children (currently manual)
2. If setting parent to `Published`/`Public`, children remain at their current state
3. UI shows effective visibility (computed from parent chain)

## Preview Mode

Authenticated CMS users can preview draft content via:
- `/academics?preview=true` with signed JWT token
- Token validates user session and grants temporary access to `Draft`/`Private` records
- Preview tokens expire in 15 minutes

## API Endpoints

| Endpoint | Auth | Filters Applied |
|----------|------|-----------------|
| `GET /api/academics` | None | Published + Public only |
| `GET /api/academics?all=true` | CMS | All records |
| `GET /api/certifications` | None | `is_posted=true` + `is_visible=true` |
| `GET /api/certifications?all=true` | CMS | All records |
| `GET /api/manage/academics` | CMS | All records |

## Document Access Control

Documents (PDFs) served from `/certificates/` path:
- Public transcripts: Direct link works
- Private/restricted: Requires auth check (future: signed URLs)

## Migration Notes

- Existing `education` table: Uses `is_visible` + `is_posted` (boolean)
- New `academic_*` tables: Use three-value enum for publication_status
- Backward compatibility: Public pages read from new tables; legacy `/education` redirect removed