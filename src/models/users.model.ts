import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  company_name: varchar("company_name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 255 }),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});
