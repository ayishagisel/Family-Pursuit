import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("member"),
  avatarUrl: text("avatar_url"),
  status: text("status").notNull().default("active"),
  is_active: boolean("is_active").notNull().default(true),
  last_login_date: timestamp("last_login_date"),
  invitation_status: text("invitation_status").default("claimed"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  status: true,
  is_active: true,
  invitation_status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Family Member schema
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  relationship: text("relationship").notNull(), // "biological", "adoptive", "step"
  avatarUrl: text("avatar_url"),
  birth_date: timestamp("birth_date"),
  metadata: jsonb("metadata").default("{}"),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).pick({
  user_id: true,
  name: true,
  role: true,
  relationship: true,
  avatarUrl: true,
  birth_date: true,
  metadata: true,
});

export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;

// Relationship schema
export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  source_id: integer("source_id").notNull(),
  target_id: integer("target_id").notNull(),
  relationship_type: text("relationship_type").notNull(), // "biological", "adoptive", "step"
});

export const insertRelationshipSchema = createInsertSchema(relationships).pick({
  source_id: true,
  target_id: true,
  relationship_type: true,
});

export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

// Event schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location"),
  user_id: integer("user_id").notNull(),
  attendees: jsonb("attendees").notNull().default("[]"),
  eventType: text("event_type").notNull(), // "birthday", "reunion", "graduation", etc.
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  date: true,
  location: true,
  user_id: true,
  eventType: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  user_id: integer("user_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  permissions: jsonb("permissions").default("{}"),
  documentType: text("document_type").notNull().default("generic"), // "pdf", "image", "contract", etc.
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  content: true,
  user_id: true,
  permissions: true,
  documentType: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Help Request schema
export const helpRequests = pgTable("help_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requestedBy: integer("requested_by").notNull(),
  dateNeeded: timestamp("date_needed").notNull(),
  status: text("status").notNull().default("needs_volunteer"), // "needs_volunteer", "has_volunteers", "completed"
  volunteers: jsonb("volunteers").notNull().default("[]"),
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).pick({
  title: true,
  description: true,
  requestedBy: true,
  dateNeeded: true,
});

export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;
export type HelpRequest = typeof helpRequests.$inferSelect;

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id"),
  isGroupMessage: boolean("is_group_message").notNull().default(false),
  groupId: integer("group_id"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  senderId: true,
  receiverId: true,
  isGroupMessage: true,
  groupId: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
