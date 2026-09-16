import { pool } from "../lib/db";

async function main() {
  try {
    const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public';");
    console.log("Database connection OK. Tables:", res.rows.map(r => r.tablename));
    if (res.rows.some(r => r.tablename === 'users')) {
      const usersRes = await pool.query("SELECT * FROM users LIMIT 5;");
      console.log("Users count/samples:", usersRes.rows);
    }
  } catch (err) {
    console.error("Database connection failed:", err);
  } finally {
    await pool.end();
  }
}

main();
