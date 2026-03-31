import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/vivah.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function initDB() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    db.exec(schema);
    console.log('✅ Database schema initialized (SQLite)');
  } catch (err: any) {
    console.error('❌ DB init error:', err.message);
  }
}

/**
 * Convert PostgreSQL $1,$2 parameterized queries to SQLite ? params.
 * PostgreSQL allows reusing $1 multiple times; SQLite needs each ? to have its own value.
 * This function replaces each $N with ? and builds a new params array with duplicates as needed.
 */
function pgToSqlite(sql: string, params: any[]): { sql: string; params: any[] } {
  // Collect all $N references in order
  const dollarRefs: number[] = [];
  const converted = sql.replace(/\$(\d+)/g, (_match, num) => {
    dollarRefs.push(parseInt(num, 10) - 1); // Convert to 0-indexed
    return '?';
  });

  // Build expanded params array — each ? gets its own value based on original $N index
  const expandedParams = dollarRefs.map(idx => params[idx] ?? null);

  // Apply other PostgreSQL → SQLite conversions
  let s = converted
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/\bILIKE\b/gi, 'LIKE')
    .replace(/\bTRUE\b/g, '1')
    .replace(/\bFALSE\b/g, '0')
    .replace(/::text/gi, '')
    .replace(/::integer/gi, '')
    .replace(/::int/gi, '')
    .replace(/::jsonb/gi, '');

  return { sql: s, params: expandedParams.length > 0 ? expandedParams : params };
}

const pool = {
  query(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    const hasReturning = /RETURNING\s+([\w\s,*]+)/i.test(sql);

    // Strip RETURNING clause before conversion
    let cleanSql = sql;
    if (hasReturning) {
      cleanSql = sql.replace(/\s+RETURNING\s+[\w\s,*]+/i, '');
    }

    const converted = pgToSqlite(cleanSql, params);
    const trimmed = converted.sql.trim();
    const finalParams = converted.params;

    try {
      if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('WITH')) {
        const rows = db.prepare(trimmed).all(...finalParams);
        return Promise.resolve({ rows, rowCount: rows.length });
      }

      const info = db.prepare(trimmed).run(...finalParams);

      if (hasReturning) {
        if (trimmed.toUpperCase().startsWith('INSERT')) {
          const table = sql.match(/INSERT\s+INTO\s+(\w+)/i)?.[1];
          if (table && info.lastInsertRowid) {
            const row = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(info.lastInsertRowid);
            return Promise.resolve({ rows: row ? [row] : [], rowCount: 1 });
          }
        }
      }

      return Promise.resolve({ rows: [], rowCount: info.changes });
    } catch (err: any) {
      console.error('SQL Error:', err.message, '\nConverted:', trimmed, '\nParams:', finalParams);
      return Promise.reject(err);
    }
  }
};

export default pool;
