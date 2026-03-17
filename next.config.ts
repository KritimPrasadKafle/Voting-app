// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  watchOptions: {
    ignored: ['**/test-ledger/**', '**/node_modules/**'],
  },
}

export default nextConfig