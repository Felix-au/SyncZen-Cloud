'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Root route fallback client-side redirect */
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return null
}

