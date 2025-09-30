import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Mock database for testing
const mockPool = new Pool({
  connectionString: "postgresql://test:test@localhost:5432/test_db",
});

export const mockDb = drizzle(mockPool);

// Mock database functions
export const createMockUser = () => ({
  id: 1,
  name: "Test User",
  email: "test@example.com",
  company_name: "Test Company",
  password: "$2b$12$test.hashed.password",
  refreshToken: null,
  filesUploaded: 0,
  created_at: new Date(),
  updated_at: new Date(),
});

export const createMockFile = () => ({
  id: 1,
  user_id: 1,
  filename: "test-file.txt",
  original_name: "test-file.txt",
  mime_type: "text/plain",
  size: 1024,
  word_count: 100,
  line_count: 10,
  char_count: 500,
  uploaded_at: new Date(),
});
