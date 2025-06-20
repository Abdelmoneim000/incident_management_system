import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'operator' | 'client'
  clientId: uuid('client_id').references(() => clients.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clients table
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  config: jsonb('config').default({}), // Custom client configuration
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Incident types table
export const incidentTypes = pgTable('incident_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  priority: integer('priority').default(1).notNull(), // 1-5 scale
  fields: jsonb('fields').default([]), // Dynamic form fields
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Incidents table
export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  incidentTypeId: uuid('incident_type_id').references(() => incidentTypes.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('open').notNull(), // 'open' | 'in_progress' | 'completed' | 'escalated'
  priority: integer('priority').default(1).notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  reportedBy: uuid('reported_by').references(() => users.id),
  data: jsonb('data').default({}), // Dynamic incident data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// Activity logs table
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').references(() => incidents.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(), // 'created' | 'updated' | 'assigned' | 'commented' | 'status_changed'
  description: text('description').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Comments table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').references(() => incidents.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').default(false).notNull(), // Internal comments only visible to operators
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  client: one(clients, {
    fields: [users.clientId],
    references: [clients.id],
  }),
  assignedIncidents: many(incidents, { relationName: 'assignedTo' }),
  reportedIncidents: many(incidents, { relationName: 'reportedBy' }),
  activityLogs: many(activityLogs),
  comments: many(comments),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  users: many(users),
  incidentTypes: many(incidentTypes),
  incidents: many(incidents),
}));

export const incidentTypesRelations = relations(incidentTypes, ({ one, many }) => ({
  client: one(clients, {
    fields: [incidentTypes.clientId],
    references: [clients.id],
  }),
  incidents: many(incidents),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  client: one(clients, {
    fields: [incidents.clientId],
    references: [clients.id],
  }),
  incidentType: one(incidentTypes, {
    fields: [incidents.incidentTypeId],
    references: [incidentTypes.id],
  }),
  assignedTo: one(users, {
    fields: [incidents.assignedTo],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  reportedBy: one(users, {
    fields: [incidents.reportedBy],
    references: [users.id],
    relationName: 'reportedBy',
  }),
  activityLogs: many(activityLogs),
  comments: many(comments),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  incident: one(incidents, {
    fields: [activityLogs.incidentId],
    references: [incidents.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  incident: one(incidents, {
    fields: [comments.incidentId],
    references: [incidents.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);

export const insertIncidentTypeSchema = createInsertSchema(incidentTypes);
export const selectIncidentTypeSchema = createSelectSchema(incidentTypes);

export const insertIncidentSchema = createInsertSchema(incidents);
export const selectIncidentSchema = createSelectSchema(incidents);

export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const selectActivityLogSchema = createSelectSchema(activityLogs);

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);
