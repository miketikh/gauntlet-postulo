import { pgTable, uuid, varchar, timestamp, text, integer, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'attorney', 'paralegal']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'in_review', 'completed', 'sent']);
export const extractionStatusEnum = pgEnum('extraction_status', ['pending', 'processing', 'completed', 'failed']);

// Firm Table
export const firms = pgTable('firms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
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
  role: userRoleEnum('role').notNull().default('paralegal'),
  firmId: uuid('firm_id').notNull().references(() => firms.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Template Table
export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sections: jsonb('sections').notNull().default([]),
  variables: jsonb('variables').notNull().default([]),
  firmId: uuid('firm_id').notNull().references(() => firms.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Project Table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  status: projectStatusEnum('status').notNull().default('draft'),
  caseDetails: jsonb('case_details').notNull().default({}),
  templateId: uuid('template_id').notNull().references(() => templates.id),
  firmId: uuid('firm_id').notNull().references(() => firms.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Draft Table
export const drafts = pgTable('drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }).unique(),
  content: jsonb('content'), // Yjs Y.Doc encoded state
  plainText: text('plain_text'),
  currentVersion: integer('current_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Draft Snapshot Table (Version History)
export const draftSnapshots = pgTable('draft_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: jsonb('content').notNull(),
  plainText: text('plain_text'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  changeDescription: text('change_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

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
});

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
