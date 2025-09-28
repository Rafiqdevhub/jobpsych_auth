import {
  pgTable,
  serial,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users.model";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  original_name: varchar("original_name", { length: 255 }).notNull(),
  mime_type: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  word_count: integer("word_count"),
  line_count: integer("line_count"),
  char_count: integer("char_count"),
  uploaded_at: timestamp().defaultNow().notNull(),
});
