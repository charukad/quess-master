import mongoose, { type ConnectOptions } from 'mongoose'
import dns from 'node:dns'
import type { LookupFunction } from 'node:net'

const dnsServers = (process.env.MONGODB_DNS_SERVERS ?? '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean)

const fallbackResolver = dnsServers.length > 0 ? new dns.Resolver() : null
fallbackResolver?.setServers(dnsServers)

function resolveSrv(hostname: string): Promise<dns.SrvRecord[]> {
  return new Promise((resolve, reject) => {
    if (!fallbackResolver) {
      reject(new Error('A fallback DNS resolver is not configured'))
      return
    }
    fallbackResolver.resolveSrv(hostname, (error, records) => {
      if (error) reject(error)
      else resolve(records)
    })
  })
}

function resolveTxt(hostname: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    if (!fallbackResolver) {
      reject(new Error('A fallback DNS resolver is not configured'))
      return
    }
    fallbackResolver.resolveTxt(hostname, (error, records) => {
      if (error) reject(error)
      else resolve(records)
    })
  })
}

export async function resolveMongoConnectionUri(uri: string): Promise<string> {
  if (!fallbackResolver || !uri.startsWith('mongodb+srv://')) return uri

  const parsed = new URL(uri)
  const srvRecords = await resolveSrv(`_mongodb._tcp.${parsed.hostname}`)
  if (srvRecords.length === 0) throw new Error('MongoDB SRV record has no hosts')

  const searchParams = new URLSearchParams(parsed.search)
  try {
    const txtRecords = await resolveTxt(parsed.hostname)
    for (const record of txtRecords) {
      const txtParams = new URLSearchParams(record.join(''))
      txtParams.forEach((value, key) => {
        if (!searchParams.has(key)) searchParams.set(key, value)
      })
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ENODATA' && code !== 'ENOTFOUND') throw error
  }

  if (!searchParams.has('tls') && !searchParams.has('ssl')) {
    searchParams.set('tls', 'true')
  }

  const credentials = parsed.username
    ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ''}@`
    : ''
  const hosts = srvRecords
    .map((record) => `${record.name.replace(/\.$/, '')}:${record.port}`)
    .join(',')
  const query = searchParams.toString()
  return `mongodb://${credentials}${hosts}${parsed.pathname}${query ? `?${query}` : ''}`
}

const fallbackLookup: LookupFunction = (hostname, options, callback) => {
  if (!fallbackResolver) {
    dns.lookup(hostname, options, callback)
    return
  }

  const family = options.family === 6 || options.family === 'IPv6' ? 6 : 4
  const resolve = family === 6
    ? fallbackResolver.resolve6.bind(fallbackResolver)
    : fallbackResolver.resolve4.bind(fallbackResolver)

  resolve(hostname, (error, addresses) => {
    if (error) {
      callback(error, '', family)
      return
    }

    const results = addresses.map((address) => ({ address, family }))
    if (options.all) {
      callback(null, results)
      return
    }

    const firstResult = results[0]
    if (!firstResult) {
      callback(Object.assign(new Error(`No DNS records found for ${hostname}`), { code: 'ENOTFOUND' }), '', family)
      return
    }
    callback(null, firstResult.address, firstResult.family)
  })
}

export function getMongoConnectionOptions(): ConnectOptions {
  if (dnsServers.length > 0) {
    dns.setServers(dnsServers)
  }

  return {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    ...(dnsServers.length > 0 ? { lookup: fallbackLookup } : {}),
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  const mongodbUri = process.env.MONGODB_URI
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = resolveMongoConnectionUri(mongodbUri)
      .then((connectionUri) => mongoose.connect(connectionUri, getMongoConnectionOptions()))
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
