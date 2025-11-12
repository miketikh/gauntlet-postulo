import { pgTable, uuid, varchar, timestamp, text, integer, jsonb, boolean, pgEnum, index as pgIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'attorney', 'paralegal']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'in_review', 'completed', 'sent']);
export const extractionStatusEnum = pgEnum('extraction_status', ['pending', 'processing', 'completed', 'failed']);
export const permissionLevelEnum = pgEnum('permission_level', ['view', 'comment', 'edit']);
export const exportFormatEnum = pgEnum('export_format', ['docx', 'pdf']);

// Firm Table
export const firms = pgTable('firms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // Story 5.9: Letterhead fields for export formatting
  letterheadLogoS3Key: varchar('letterhead_logo_s3_key', { length: 500 }),
  letterheadCompanyName: varchar('letterhead_company_name', { length: 255 }),
  letterheadAddress: text('letterhead_address'),
  letterheadPhone: varchar('letterhead_phone', { length: 50 }),
  letterheadEmail: varchar('letterhead_email', { length: 255 }),
  letterheadWebsite: varchar('letterhead_website', { length: 255 }),
  exportMargins: jsonb('export_margins').$type<{top: number, bottom: number, left: number, right: number}>(),
  exportFontFamily: varchar('export_font_family', { length: 100 }).default('Times New Roman'),
  exportFontSize: integer('export_font_size').default(12),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('attorney'),
  firmId: uuid('firm_id').notNull().references(() => firms.id, { onDelete: 'cascade' }),
  active: boolean('active').notNull().default(true), // Story 6.13: User deactivation
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  firmIdIdx: pgIndex('users_firm_id_idx').on(table.firmId),
  emailIdx: pgIndex('users_email_idx').on(table.email),
  roleIdx: pgIndex('users_role_idx').on(table.role),
  activeIdx: pgIndex('users_active_idx').on(table.active),
}));

// Template Table
export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sections: jsonb('sections').notNull().default([]),
  variables: jsonb('variables').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  isSystemTemplate: boolean('is_system_template').notNull().default(false),
  firmId: uuid('firm_id').notNull().references(() => firms.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  firmIdIdx: pgIndex('templates_firm_id_idx').on(table.firmId),
  isActiveIdx: pgIndex('templates_is_active_idx').on(table.isActive),
  isSystemTemplateIdx: pgIndex('templates_is_system_template_idx').on(table.isSystemTemplate),
}));

// Project Table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  status: projectStatusEnum('status').notNull().default('draft'),
  caseDetails: jsonb('case_details').notNull().default({}),
  templateId: uuid('template_id').references(() => templates.id),
  firmId: uuid('firm_id').notNull().references(() => firms.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  firmIdIdx: pgIndex('projects_firm_id_idx').on(table.firmId),
  createdByIdx: pgIndex('projects_created_by_idx').on(table.createdBy),
  statusIdx: pgIndex('projects_status_idx').on(table.status),
  createdAtIdx: pgIndex('projects_created_at_idx').on(table.createdAt),
  templateIdIdx: pgIndex('projects_template_id_idx').on(table.templateId),
}));

// Source Document Table
export const sourceDocuments = pgTable('source_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  extractedText: text('extracted_text'),
  extractionStatus: extractionStatusEnum('extraction_status').notNull().default('pending'),
  metadata: jsonb('metadata'), // For OCR confidence, errors, etc.
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: pgIndex('source_documents_project_id_idx').on(table.projectId),
  uploadedByIdx: pgIndex('source_documents_uploaded_by_idx').on(table.uploadedBy),
  extractionStatusIdx: pgIndex('source_documents_extraction_status_idx').on(table.extractionStatus),
  createdAtIdx: pgIndex('source_documents_created_at_idx').on(table.createdAt),
}));

// Draft Table
export const drafts = pgTable('drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }).unique(),
  content: jsonb('content'), // Legacy: Lexical editor state (JSON)
  yjsDocument: text('yjs_document'), // Yjs Y.Doc encoded state (base64-encoded binary)
  plainText: text('plain_text'),
  currentVersion: integer('current_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: pgIndex('drafts_project_id_idx').on(table.projectId),
  updatedAtIdx: pgIndex('drafts_updated_at_idx').on(table.updatedAt),
}));

// Draft Snapshot Table (Version History)
export const draftSnapshots = pgTable('draft_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: jsonb('content').notNull(),
  plainText: text('plain_text'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  changeDescription: text('change_description'),
  contributors: jsonb('contributors').notNull().default([]), // Array of {userId, name, changesCount}
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  draftIdIdx: pgIndex('draft_snapshots_draft_id_idx').on(table.draftId),
  versionIdx: pgIndex('draft_snapshots_version_idx').on(table.version),
  createdByIdx: pgIndex('draft_snapshots_created_by_idx').on(table.createdBy),
  createdAtIdx: pgIndex('draft_snapshots_created_at_idx').on(table.createdAt),
  contributorsIdx: pgIndex('draft_snapshots_contributors_idx').on(table.contributors),
}));

// Comment Table
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  threadId: uuid('thread_id').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  selectionStart: integer('selection_start').notNull(),
  selectionEnd: integer('selection_end').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  draftIdIdx: pgIndex('comments_draft_id_idx').on(table.draftId),
  threadIdIdx: pgIndex('comments_thread_id_idx').on(table.threadId),
  authorIdIdx: pgIndex('comments_author_id_idx').on(table.authorId),
  resolvedIdx: pgIndex('comments_resolved_idx').on(table.resolved),
  createdAtIdx: pgIndex('comments_created_at_idx').on(table.createdAt),
}));

// Draft Collaborators Table (Permissions)
export const draftCollaborators = pgTable('draft_collaborators', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: permissionLevelEnum('permission').notNull(),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  draftIdIdx: pgIndex('draft_collaborators_draft_id_idx').on(table.draftId),
  userIdIdx: pgIndex('draft_collaborators_user_id_idx').on(table.userId),
}));

// Template Versions Table (for version history)
export const templateVersions = pgTable('template_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  structure: jsonb('structure').notNull(), // Stores sections and variables snapshot
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  templateIdIdx: pgIndex('template_versions_template_id_idx').on(table.templateId),
  versionNumberIdx: pgIndex('template_versions_version_number_idx').on(table.versionNumber),
  createdAtIdx: pgIndex('template_versions_created_at_idx').on(table.createdAt),
}));

// Draft Exports Table (for export history and tracking)
export const draftExports = pgTable('draft_exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(), // Draft version at time of export
  format: exportFormatEnum('format').notNull().default('docx'),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  s3Key: varchar('s3_key', { length: 500 }),
  fileSize: integer('file_size'),
  metadata: jsonb('metadata'), // Document properties, generation settings, etc.
  exportedBy: uuid('exported_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  draftIdIdx: pgIndex('draft_exports_draft_id_idx').on(table.draftId),
  exportedByIdx: pgIndex('draft_exports_exported_by_idx').on(table.exportedBy),
  formatIdx: pgIndex('draft_exports_format_idx').on(table.format),
  createdAtIdx: pgIndex('draft_exports_created_at_idx').on(table.createdAt),
}));

// Relations
export const firmsRelations = relations(firms, ({ many }) => ({
  users: many(users),
  projects: many(projects),
  templates: many(templates),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  firm: one(firms, {
    fields: [users.firmId],
    references: [firms.id],
  }),
  createdProjects: many(projects),
  createdTemplates: many(templates),
  uploadedDocuments: many(sourceDocuments),
  comments: many(comments),
  draftSnapshots: many(draftSnapshots),
  draftCollaborations: many(draftCollaborators),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  firm: one(firms, {
    fields: [templates.firmId],
    references: [firms.id],
  }),
  creator: one(users, {
    fields: [templates.createdBy],
    references: [users.id],
  }),
  projects: many(projects),
  versions: many(templateVersions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  firm: one(firms, {
    fields: [projects.firmId],
    references: [firms.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [projects.templateId],
    references: [templates.id],
  }),
  sourceDocuments: many(sourceDocuments),
  draft: one(drafts),
}));

export const sourceDocumentsRelations = relations(sourceDocuments, ({ one }) => ({
  project: one(projects, {
    fields: [sourceDocuments.projectId],
    references: [projects.id],
  }),
  uploader: one(users, {
    fields: [sourceDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const draftsRelations = relations(drafts, ({ one, many }) => ({
  project: one(projects, {
    fields: [drafts.projectId],
    references: [projects.id],
  }),
  snapshots: many(draftSnapshots),
  comments: many(comments),
  collaborators: many(draftCollaborators),
  exports: many(draftExports),
  refinements: many(aiRefinements),
}));

export const draftSnapshotsRelations = relations(draftSnapshots, ({ one }) => ({
  draft: one(drafts, {
    fields: [draftSnapshots.draftId],
    references: [drafts.id],
  }),
  creator: one(users, {
    fields: [draftSnapshots.createdBy],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  draft: one(drafts, {
    fields: [comments.draftId],
    references: [drafts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const templateVersionsRelations = relations(templateVersions, ({ one }) => ({
  template: one(templates, {
    fields: [templateVersions.templateId],
    references: [templates.id],
  }),
  creator: one(users, {
    fields: [templateVersions.createdBy],
    references: [users.id],
  }),
}));

export const draftCollaboratorsRelations = relations(draftCollaborators, ({ one }) => ({
  draft: one(drafts, {
    fields: [draftCollaborators.draftId],
    references: [drafts.id],
  }),
  user: one(users, {
    fields: [draftCollaborators.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [draftCollaborators.invitedBy],
    references: [users.id],
  }),
}));

export const draftExportsRelations = relations(draftExports, ({ one }) => ({
  draft: one(drafts, {
    fields: [draftExports.draftId],
    references: [drafts.id],
  }),
  exporter: one(users, {
    fields: [draftExports.exportedBy],
    references: [users.id],
  }),
}));

// AI Refinements Table (Story 5.3 - AI Refinement with Streaming)
export const aiRefinements = pgTable('ai_refinements', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  originalText: text('original_text').notNull(),
  instruction: text('instruction').notNull(),
  refinedText: text('refined_text'),
  quickActionId: varchar('quick_action_id', { length: 100 }),
  tokenUsage: jsonb('token_usage').$type<{ inputTokens: number; outputTokens: number }>(),
  model: varchar('model', { length: 100 }),
  durationMs: integer('duration_ms'),
  applied: boolean('applied').notNull().default(false),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  draftIdIdx: pgIndex('ai_refinements_draft_id_idx').on(table.draftId),
  createdByIdx: pgIndex('ai_refinements_created_by_idx').on(table.createdBy),
  createdAtIdx: pgIndex('ai_refinements_created_at_idx').on(table.createdAt),
}));

export const aiRefinementsRelations = relations(aiRefinements, ({ one }) => ({
  draft: one(drafts, {
    fields: [aiRefinements.draftId],
    references: [drafts.id],
  }),
  creator: one(users, {
    fields: [aiRefinements.createdBy],
    references: [users.id],
  }),
}));

// Export types
export type Firm = typeof firms.$inferSelect;
export type NewFirm = typeof firms.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type SourceDocument = typeof sourceDocuments.$inferSelect;
export type NewSourceDocument = typeof sourceDocuments.$inferInsert;

export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;

export type DraftSnapshot = typeof draftSnapshots.$inferSelect;
export type NewDraftSnapshot = typeof draftSnapshots.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type TemplateVersion = typeof templateVersions.$inferSelect;
export type NewTemplateVersion = typeof templateVersions.$inferInsert;

export type DraftCollaborator = typeof draftCollaborators.$inferSelect;
export type NewDraftCollaborator = typeof draftCollaborators.$inferInsert;

export type DraftExport = typeof draftExports.$inferSelect;
export type NewDraftExport = typeof draftExports.$inferInsert;

export type AIRefinement = typeof aiRefinements.$inferSelect;
export type NewAIRefinement = typeof aiRefinements.$inferInsert;

// Audit Logs Table (Story 6.8 - Audit Logging for Compliance)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  firmId: uuid('firm_id').notNull().references(() => firms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(), // 'auth.login', 'draft.view', 'export.download', etc.
  resourceType: varchar('resource_type', { length: 50 }), // 'draft', 'project', 'template', 'user'
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').$type<{
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    changes?: Record<string, any>;
    error?: string;
    duration?: number;
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  firmIdIdx: pgIndex('audit_logs_firm_id_idx').on(table.firmId),
  userIdIdx: pgIndex('audit_logs_user_id_idx').on(table.userId),
  actionIdx: pgIndex('audit_logs_action_idx').on(table.action),
  resourceTypeIdx: pgIndex('audit_logs_resource_type_idx').on(table.resourceType),
  createdAtIdx: pgIndex('audit_logs_created_at_idx').on(table.createdAt),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  firm: one(firms, {
    fields: [auditLogs.firmId],
    references: [firms.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
