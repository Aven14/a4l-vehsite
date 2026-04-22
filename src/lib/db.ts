import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
const useSsl = connectionString?.includes('sslmode=require') || connectionString?.includes('neon.tech')

// Pool PostgreSQL compatible Neon/Supabase/instances managées
const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: 5, // Max 5 connexions par Lambda pour éviter l'épuisement du pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    return await client.query(text, params)
  } finally {
    client.release()
  }
}

export async function getClient() {
  return pool.connect()
}

export { pool }
