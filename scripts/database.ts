import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
    await pool.query(sql);
    console.log("Interviewer database schema verified.");
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
