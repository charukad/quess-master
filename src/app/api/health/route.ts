import { connectDB } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const mongoose = await connectDB()
    const database = mongoose.connection.db
    if (!database) throw new Error('Database connection is unavailable')
    await database.admin().ping()

    return Response.json(
      { status: 'ok', database: 'connected' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error(
      'Database health check failed:',
      error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error',
    )
    return Response.json(
      { status: 'error', database: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
