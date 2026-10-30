// Applies supabase/*.sql migrations over the Direct connection string.
// The .env value is parsed by hand and the password percent-encoded, because
// Node's --env-file stops at "#" and connection-string passwords commonly
// contain URI-reserved characters.
const fs = require("fs");
const path = require("path");
const {Client} = require("pg");

const envLine = fs
  .readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="));
if (!envLine) {
  console.error("DATABASE_URL is missing from .env.local");
  process.exit(1);
}

const raw = envLine.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const m = raw.match(/^(\w+):\/\/([^:]*):(.*)@([^/]+)\/(.*)$/);
if (!m) {
  console.error("DATABASE_URL is not in protocol://user:password@host/db form");
  process.exit(1);
}
const [, protocol, user, password, hosts, rest] = m;
const [dbname, query] = rest.split("?");
const connectionString =
  `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(password)}` +
  `@${hosts}/${encodeURIComponent(dbname)}${query ? `?${query}` : ""}`;

const files = process.argv.slice(2).length ? process.argv.slice(2) : ["schema.sql"];

(async () => {
  // Supabase's Direct TCP endpoint presents a certificate chain Node does not
  // trust by default; the project's own CA is only published for pooled/IPv6.
  const client = new Client({connectionString, ssl: {rejectUnauthorized: false}});
  await client.connect();
  let failed = 0;
  for (const file of files) {
    const p = path.join(__dirname, "..", "supabase", file);
    try {
      await client.query(fs.readFileSync(p, "utf8"));
      console.log("applied  ", file);
    } catch (e) {
      failed++;
      console.error("FAILED   ", file, "->", e.message);
    }
  }
  await client.end();
  process.exit(failed ? 1 : 0);
})();
