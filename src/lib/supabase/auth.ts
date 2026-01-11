'use server'

import { redirect } from 'next/navigation'
import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

/**
 * Get the current authenticated user.
 * If no user is authenticated, redirects to login page.
 * Use this in server components and server actions that require auth.
 */
export async function requireAuth(redirectTo?: string): Promise<User> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginPath = redirectTo 
      ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : '/login'
    redirect(loginPath)
  }

  return user
}

/**
 * Get the current user without redirecting.
 * Returns null if no user is authenticated.
 * Use this when you want to optionally show user-specific content.
 */
export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
