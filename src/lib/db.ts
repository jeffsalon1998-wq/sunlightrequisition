import { createClient } from "@libsql/client";
import { DB_URL, DB_TOKEN } from "../config/dbConfig";

export const db = createClient({
  url: DB_URL,
  authToken: DB_TOKEN,
});
