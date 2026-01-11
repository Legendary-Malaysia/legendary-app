'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const authSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function login(formData: FormData): Promise<{ error?: string; message?: string } | void> {
  const supabase = await createClient()

  const result = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    console.error('Login error:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}

export async function signup(formData: FormData): Promise<{ error?: string; message?: string } | void> {
  const supabase = await createClient()

  const result = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { data, error } = await supabase.auth.signUp({
    ...result.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/confirm`,
    },
  })

  if (error) {
    console.error('Signup error:', error)
    return { error: error.message }
  }

  // Log the signup result for debugging
  console.log('Signup result:', { 
    user: data.user?.id, 
    session: !!data.session,
    identities: data.user?.identities?.length 
  })

  // Check if email confirmation is required
  // If identities is empty, the user already exists
  if (data.user?.identities?.length === 0) {
    console.log('User already exists')
    return { error: 'An account with this email already exists. Please sign in instead.' }
  }

  // If no session, email confirmation is required
  if (!data.session) {
    console.log('Email confirmation is required')
    return { message: 'Check your email to confirm your account before signing in.' }
  }

  // User is signed up and logged in directly (no email confirmation required)
  console.log('User is signed up and logged in directly')
  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}