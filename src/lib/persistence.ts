import { AsyncLocalStorage } from "node:async_hooks";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import type { InterviewRecord } from "./types";
import type { MarketingLead, TerritoryAssignment } from "./territories";

export type State = {
  interviews: InterviewRecord[];
  leads: MarketingLead[];
  territories: TerritoryAssignment[];
};
const blank = (): State => ({ interviews: [], leads: [], territories: [] });
const context = new AsyncLocalStorage<State>();
let queue: Promise<unknown> = Promise.resolve();
let pool: Pool | undefined;
function database() {
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 8000,
    query_timeout: 20000,
  }));
}
function file() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production")
    throw new Error(
      "Private DATABASE_URL storage must be configured before accepting applications.",
    );
  return (
    process.env.INTERVIEW_DATA_FILE ||
    path.join(process.cwd(), "data", "development-state.json")
  );
}
function decode(raw: unknown): State {
  const value = raw as State;
  if (
    !value ||
    !Array.isArray(value.interviews) ||
    !Array.isArray(value.leads) ||
    !Array.isArray(value.territories)
  )
    throw new Error("Invalid stored state; restore from a verified backup.");
  return value;
}
async function localRead() {
  try {
    return decode(
      JSON.parse(await fs.readFile(/* turbopackIgnore: true */ file(), "utf8")),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return blank();
    throw error;
  }
}
export async function readState(): Promise<State> {
  const active = context.getStore();
  if (active) return structuredClone(active);
  if (!process.env.DATABASE_URL) {
    await queue;
    return localRead();
  }
  const result = await database().query(
    "SELECT data FROM interviewer_private.state WHERE id=1",
  );
  if (!result.rows[0]) throw new Error("Database schema is not initialized.");
  return decode(result.rows[0].data);
}
export async function mutateState<T>(
  operation: (data: State) => T | Promise<T>,
): Promise<T> {
  const active = context.getStore();
  if (active) return operation(active);
  if (process.env.DATABASE_URL) {
    const client = await database().connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "SELECT data FROM interviewer_private.state WHERE id=1 FOR UPDATE",
      );
      if (!result.rows[0])
        throw new Error("Database schema is not initialized.");
      const data = decode(result.rows[0].data);
      const output = await context.run(data, () => operation(data));
      await client.query(
        "UPDATE interviewer_private.state SET data=$1, updated_at=now() WHERE id=1",
        [JSON.stringify(data)],
      );
      await client.query("COMMIT");
      return output;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  const work = queue.then(async () => {
    const target = file();
    const data = await localRead();
    const output = await context.run(data, () => operation(data));
    await fs.mkdir(path.dirname(target), { recursive: true });
    const temporary = target + "." + process.pid + ".tmp";
    await fs.writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
    await fs.rename(temporary, target);
    return output;
  });
  queue = work.catch(() => undefined);
  return work;
}
