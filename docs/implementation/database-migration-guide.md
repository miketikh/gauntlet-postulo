# Database Migration Guide - Story 6.3 Indexes

## Quick Start

### Apply Migration to Development Database

```bash
# Option 1: Push directly (for development)
npm run db:push

# Option 2: Run migrations (for production)
npm run db:migrate
```

### Verify Migration Applied

```sql
-- Connect to PostgreSQL
psql -d steno

-- Check indexes created
\di *_idx

-- Should see 32+ indexes including:
-- users_firm_id_idx, users_email_idx, users_role_idx
-- projects_firm_id_idx, projects_created_by_idx, projects_status_idx
-- etc.
```

---

## Migration Details

**File**: `drizzle/0006_brainy_vivisector.sql`
**Indexes Created**: 27
**Tables Affected**: 8 (users, projects, source_documents, drafts, draft_snapshots, comments, template_versions, draft_exports)

### Index Strategy

All indexes use PostgreSQL B-tree (default), optimal for:
- Equality queries (`WHERE firmId = ?`)
- Range queries (`WHERE createdAt > ?`)
- Sorting (`ORDER BY createdAt DESC`)
- Join operations

### Performance Testing

After applying migration, test query performance:

```sql
-- Test 1: List projects by firm (most common query)
EXPLAIN ANALYZE
SELECT * FROM projects
WHERE firm_id = 'your-firm-uuid'
ORDER BY created_at DESC
LIMIT 20;

-- Expected: Index Scan using projects_firm_id_idx
-- Cost: <5ms for 1000s of projects

-- Test 2: Get draft with version history
EXPLAIN ANALYZE
SELECT * FROM draft_snapshots
WHERE draft_id = 'your-draft-uuid'
ORDER BY version DESC;

-- Expected: Index Scan using draft_snapshots_draft_id_idx
-- Cost: <10ms for 100s of versions

-- Test 3: Comments for a draft (unresolved only)
EXPLAIN ANALYZE
SELECT * FROM comments
WHERE draft_id = 'your-draft-uuid'
  AND resolved = false
ORDER BY created_at DESC;

-- Expected: Index Scan using comments_draft_id_idx + Filter on resolved
-- Cost: <8ms for 100s of comments
```

### Rollback Plan

If issues occur (unlikely for index-only migration):

```sql
-- Drop all indexes created in this migration
DROP INDEX IF EXISTS comments_draft_id_idx;
DROP INDEX IF EXISTS comments_thread_id_idx;
DROP INDEX IF EXISTS comments_author_id_idx;
DROP INDEX IF EXISTS comments_resolved_idx;
DROP INDEX IF EXISTS comments_created_at_idx;
DROP INDEX IF EXISTS draft_exports_format_idx;
DROP INDEX IF EXISTS draft_exports_created_at_idx;
DROP INDEX IF EXISTS draft_snapshots_draft_id_idx;
DROP INDEX IF EXISTS draft_snapshots_version_idx;
DROP INDEX IF EXISTS draft_snapshots_created_by_idx;
DROP INDEX IF EXISTS draft_snapshots_created_at_idx;
DROP INDEX IF EXISTS drafts_project_id_idx;
DROP INDEX IF EXISTS drafts_updated_at_idx;
DROP INDEX IF EXISTS projects_firm_id_idx;
DROP INDEX IF EXISTS projects_created_by_idx;
DROP INDEX IF EXISTS projects_status_idx;
DROP INDEX IF EXISTS projects_created_at_idx;
DROP INDEX IF EXISTS projects_template_id_idx;
DROP INDEX IF EXISTS source_documents_project_id_idx;
DROP INDEX IF EXISTS source_documents_uploaded_by_idx;
DROP INDEX IF EXISTS source_documents_extraction_status_idx;
DROP INDEX IF EXISTS source_documents_created_at_idx;
DROP INDEX IF EXISTS template_versions_version_number_idx;
DROP INDEX IF EXISTS template_versions_created_at_idx;
DROP INDEX IF EXISTS users_firm_id_idx;
DROP INDEX IF EXISTS users_email_idx;
DROP INDEX IF EXISTS users_role_idx;
```

---

## Index Maintenance

### Monitor Index Usage

```sql
-- Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Indexes with idx_scan = 0 are unused (should investigate)
```

### Monitor Index Size

```sql
-- Check index sizes
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Rebuild Indexes (if needed after bulk operations)

```sql
-- Rebuild specific index
REINDEX INDEX users_firm_id_idx;

-- Rebuild all indexes on a table
REINDEX TABLE projects;

-- Rebuild all indexes in database (maintenance window)
REINDEX DATABASE steno;
```

---

## Production Deployment Checklist

- [ ] Test migration on staging database
- [ ] Run EXPLAIN ANALYZE on key queries (before/after)
- [ ] Verify index creation time (<1 minute for POC data volume)
- [ ] Check disk space (indexes use ~10-20% of table size)
- [ ] Apply during low-traffic window (if possible)
- [ ] Monitor query performance after deployment
- [ ] Verify application performance improvements
- [ ] Update CloudWatch dashboards with new query metrics

---

## Expected Results

### Before Indexes
- Projects list query: 50-200ms
- Draft versions query: 100-300ms
- Comments query: 80-150ms

### After Indexes
- Projects list query: **5-15ms** (10-40x faster)
- Draft versions query: **10-30ms** (10x faster)
- Comments query: **8-15ms** (10x faster)

### Database Size Impact
- Current: ~500MB (with test data)
- After indexes: ~550MB (indexes add ~10% overhead)
- Production estimate: Indexes scale linearly with data

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Cause**: Migration was partially applied or run twice.

**Solution**:
```sql
-- Check which indexes already exist
\di *_idx

-- Skip existing indexes in migration file, or:
DROP INDEX IF EXISTS <index_name>;
-- Then re-run migration
```

### Issue: Queries still slow after migration

**Cause**: Query planner may not be using new indexes.

**Solution**:
```sql
-- Update table statistics
ANALYZE projects;
ANALYZE drafts;
ANALYZE comments;

-- Force planner to re-evaluate
VACUUM ANALYZE;
```

### Issue: Index creation takes too long

**Cause**: Large dataset or concurrent activity.

**Solution**:
```sql
-- Create indexes concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY users_firm_id_idx ON users (firm_id);

-- Note: Drizzle's migration uses standard CREATE INDEX
-- For production with large data, consider manual concurrent creation
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-11
**Related**: Story 6.3, drizzle/0006_brainy_vivisector.sql
