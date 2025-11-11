# Story-Level Execution Order

## Epic 1: Foundation & Core Infrastructure

```
START
  ↓
1.1 (Monorepo setup)
  ↓
[1.2 (React scaffold) || 1.3 (Backend scaffold)] — both parallel
  ↓
1.4 (Database + Prisma)
  ↓
1.5 (AWS S3 + RDS)
  ↓
1.6 (User registration API)
  ↓
1.7 (Login + JWT)
  ↓
[1.8 (Frontend auth pages) || 1.12 (CI/CD)] — parallel
  ↓
1.9 (RBAC)
  ↓
[1.10 (Firm isolation) || 1.11 (Dashboard UI)] — parallel
```

**Sequential Stories**: 1.1 → 1.4 → 1.5 → 1.6 → 1.7 must be done in order
**Parallel Opportunities**:
- 1.2 + 1.3 together
- 1.8 + 1.12 together
- 1.10 + 1.11 together

---

## Epic 2: Document Management & AI (can start after Epic 1 complete)

```
[2.1 (Upload UI) || 2.2 (Upload API) || 2.6 (Claude API) || 2.9 (Draft storage)] — all 4 parallel
  ↓
[2.3 (PDF extraction) || 2.5 (Document viewer) || 2.7 (Prompt engineering)] — all 3 parallel
  ↓
2.4 (Word/OCR) — needs 2.3
  ↓
2.8 (AI generation workflow) — needs 2.1, 2.7 complete
  ↓
2.10 (Projects dashboard) — needs 2.9
```

**Key Insight**: Stories 2.1, 2.2, 2.6, 2.9 are completely independent and can all start simultaneously

---

## Epic 3: Template Management (can start after Epic 1 complete, fully parallel to Epic 2)

```
3.1 (Template data model)
  ↓
3.2 (CRUD APIs)
  ↓
3.3 (Gallery UI)
  ↓
[3.4 (Builder UI - sections) || 3.10 (Seed templates)] — parallel
  ↓
3.5 (Builder UI - variables)
  ↓
3.6 (Validation & publishing)
  ↓
[3.7 (Preview) || 3.8 (Versioning)] — parallel
  ↓
3.9 (Access control)
```

**Epic 2 + Epic 3 can run completely parallel** (different files, different modules)

---

## Epic 4: Collaborative Editing (needs Epic 1 + partial Epic 2)

**Prerequisites to start**: 1.* complete, 2.9 (draft storage) complete

```
4.1 (Rich text editor)
  ↓
4.2 (Yjs CRDT)
  ↓
[4.3 (WebSocket server) || 4.5 (Presence awareness)] — parallel
  ↓
[4.4 (WebSocket client) || 4.7 (Comments)] — parallel
  ↓
[4.6 (Presence UI) || 4.8 (Change tracking) || 4.9 (Offline editing)] — all 3 parallel
  ↓
4.10 (Editor layout)
  ↓
4.11 (Document permissions)
```

---

## Epic 5: AI Refinement & Export (needs Epic 1, 2, 3, 4 mostly complete)

**Prerequisites**: 2.6 (Claude API), 2.7 (Prompts), 3.2 (Templates), 4.1 (Editor) complete

**Split into 2 parallel tracks:**

### Track A: Refinement
```
5.1 (Refinement UI)
  ↓
[5.2 (Quick actions) || 5.3 (Refinement API)] — parallel
  ↓
5.4 (Preview & apply)
  ↓
[5.5 (Refinement history) || 5.6 (Context preservation)] — parallel
```

### Track B: Export (can run fully parallel to Track A)
```
5.7 (Word export)
  ↓
[5.8 (Export UI) || 5.9 (Letterhead formatting) || 5.10 (Version tagging)] — all 3 parallel
  ↓
5.11 (Email export)
```

**Track A and Track B are completely independent**

---

## Epic 6: Production Readiness (needs everything else complete)

**These can mostly run in parallel across different specialists:**

```
START all together:
├─ 6.1 (Unit + integration tests)
├─ 6.2 (E2E tests)
├─ 6.3 (Database optimization)
├─ 6.4 (Frontend optimization)
├─ 6.5 (Security audit)
├─ 6.6 (WCAG compliance)
├─ 6.7 (Monitoring setup)
├─ 6.8 (Audit logging)
├─ 6.9 (Error handling)
├─ 6.10 (Loading states)
├─ 6.11 (Responsive design)
├─ 6.12 (Documentation)
└─ 6.13 (Admin panel)
  ↓
6.14 (Production deployment) — MUST BE LAST
```

**Almost everything in Epic 6 can happen simultaneously** (13 stories parallel), then 6.14 final deployment

---

## Cross-Epic Parallelization Summary

### Maximum Parallel Execution:

**Phase 1**: Epic 1 only (with internal parallelization shown above)

**Phase 2**:
```
Epic 2 (all 10 stories) || Epic 3 (all 10 stories) || Epic 4 stories 4.1-4.2
```
All three can run at the same time

**Phase 3**:
```
Epic 4 (stories 4.3-4.11) || Epic 5 Track A (Refinement) || Epic 5 Track B (Export)
```
All three can run at the same time

**Phase 4**: Epic 6 (13 stories parallel, then 6.14)

---

## Quick Reference: Minimum Critical Path

If you only had 1 developer doing everything sequentially, the absolute minimum critical path is:

```
1.1→1.2→1.3→1.4→1.5→1.6→1.7→1.8→1.9→1.10→1.11→1.12
→ 3.1→3.2→3.3→3.4→3.5→3.6→3.10
→ 2.1→2.2→2.3→2.6→2.7→2.9→2.8→2.10
→ 4.1→4.2→4.3→4.4→4.10
→ 5.7→5.8
→ 6.1→6.14
```

This is the bare minimum to have a working product (skips refinement, comments, many polish features).
