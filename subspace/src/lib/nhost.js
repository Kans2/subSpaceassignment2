import { NhostClient } from '@nhost/react'

const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN
const region = import.meta.env.VITE_NHOST_REGION

if (!subdomain || !region) {
  // Surfaced in the console so a missing .env is easy to spot during the demo.
  console.warn(
    'Nhost is not configured. Set VITE_NHOST_SUBDOMAIN and VITE_NHOST_REGION in subspace/.env',
  )
}

export const nhost = new NhostClient({
  subdomain,
  region,
  // Session persistence: keep the refresh token in localStorage and silently
  // restore + refresh the session on reload, so users "stay logged in".
  clientStorageType: 'web',
  autoSignIn: true,
  autoRefreshToken: true,
})
