import {
  pgTable,
  serial,
  timestamp,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  company_name: varchar("company_name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 255 }),
  filesUploaded: integer("files_uploaded").default(0).notNull(),
  batch_analysis: integer("batch_analysis").default(0).notNull(),
  compare_resumes: integer("compare_resumes").default(0).notNull(),
  selected_candidate: integer("selected_candidate").default(0).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationExpires: timestamp("verification_expires"),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});
