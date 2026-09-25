import type { NextConfig } from "next";

// NextAuth treats an empty NEXTAUTH_URL as a real URL and fails while the login
// page is prerendered. On Vercel, leaving it unset lets NextAuth use VERCEL_URL.
if (!process.env.NEXTAUTH_URL?.trim()) {
  delete process.env.NEXTAUTH_URL;
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
