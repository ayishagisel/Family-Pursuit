import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/*----------------------------------
  USERS
----------------------------------*/
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

/*----------------------------------
  FAMILY MEMBERS
----------------------------------*/
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  name: text("name").notNull(),
  role: text("role").notNull(), // Inclusive: parent, co-parent, guardian, step-parent, etc.
  relationship: text("relationship").notNull(), // "biological", "adoptive", "step", "chosen", "common-law", "polygamous", etc.
  avatarUrl: text("avatar_url"),
  birth_date: timestamp("birth_date"),
  location: text("location"),
  bio: text("bio"),
  personality_traits: text("personality_traits").array(),
  interests: text("interests").array(),
  occupation: text("occupation"),
  metadata: jsonb("metadata").default("{}"), // for storing dynamic tags, pronouns, etc.
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).pick({
  user_id: true,
  name: true,
  role: true,
  relationship: true,
  avatarUrl: true,
  birth_date: true,
  location: true,
  bio: true,
  personality_traits: true,
  interests: true,
  occupation: true,
  metadata: true,
});

export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;

/*----------------------------------
  RELATIONSHIPS
----------------------------------*/
export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  source_id: integer("source_id").notNull(),
  target_id: integer("target_id").notNull(),
  relationship_type: text("relationship_type").notNull(),
  // "parent", "spouse", "co-parent", "common-law", "guardian", "platonic-partner", etc.
  relation_category: text("relation_category").default("biological"),
  // "biological", "adoptive", "step", "chosen", "multi-parent", etc.
  notes: text("notes"),
});

export const insertRelationshipSchema = createInsertSchema(relationships)
  .pick({
    source_id: true,
    target_id: true,
    relationship_type: true,
    relation_category: true,
    notes: true,
  })
  .refine((data) => data.source_id !== data.target_id, {
    message: "A member cannot be related to themselves",
    path: ["target_id"],
  });

export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

/*----------------------------------
  EVENTS
----------------------------------*/
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location"),
  user_id: integer("user_id").notNull(),
  attendees: jsonb("attendees").notNull().default("[]"),
  eventType: text("event_type").notNull(), // birthday, reunion, celebration, etc.
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

/*----------------------------------
  DOCUMENTS
----------------------------------*/
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  user_id: integer("user_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  permissions: jsonb("permissions").default("{}"),
  documentType: text("document_type").notNull().default("generic"),
  isSecure: boolean("is_secure").default(false),
  accessLevel: text("access_level").default("member"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  content: true,
  user_id: true,
  permissions: true,
  documentType: true,
  isSecure: true,
  accessLevel: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

/*----------------------------------
  HELP REQUESTS
----------------------------------*/
export const helpRequests = pgTable("help_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requestedBy: integer("requested_by").notNull(),
  dateNeeded: timestamp("date_needed").notNull(),
  status: text("status").notNull().default("needs_volunteer"),
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

/*----------------------------------
  MESSAGES
----------------------------------*/
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

/*----------------------------------
  HOUSING ISSUES
----------------------------------*/
export const housingIssues = pgTable("housing_issues", {
  id: serial("id").primaryKey(),
  family_member_id: integer("family_member_id").references(
    () => familyMembers.id,
  ),
  address: text("address").notNull(),
  issue_type: text("issue_type").notNull(),
  description: text("description"),
  linked_document_id: integer("linked_document_id").references(
    () => documents.id,
  ),
  created_at: timestamp("created_at").defaultNow(),
  resolved: boolean("resolved").default(false),
  resolution_notes: text("resolution_notes"),
  hpd_violations: jsonb("hpd_violations").default("[]"),
});

export const insertHousingIssueSchema = createInsertSchema(housingIssues).pick({
  family_member_id: true,
  address: true,
  issue_type: true,
  description: true,
  linked_document_id: true,
  resolved: true,
  resolution_notes: true,
  hpd_violations: true,
});

export type InsertHousingIssue = z.infer<typeof insertHousingIssueSchema>;
export type HousingIssue = typeof housingIssues.$inferSelect;
