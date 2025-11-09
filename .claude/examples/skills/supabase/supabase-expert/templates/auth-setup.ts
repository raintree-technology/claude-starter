// Complete Supabase Auth Setup Template
// Use this as a reference for implementing auth in your application

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// ============================================================================
// CLIENT SETUP
// ============================================================================

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
}

export interface SignUpData {
  email: string
  password: string
  metadata?: Record<string, any>
}

export interface SignInData {
  email: string
  password: string
}

// ============================================================================
// EMAIL/PASSWORD AUTH
// ============================================================================

export async function signUp({ email, password, metadata }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ============================================================================
// MAGIC LINK AUTH
// ============================================================================

export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

// ============================================================================
// SOCIAL AUTH
// ============================================================================

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) throw error
  return data
}

export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data.session
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function resetPasswordForEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
  return data
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}

// ============================================================================
// USER PROFILE
// ============================================================================

export async function updateUserProfile(updates: Record<string, any>) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  })

  if (error) throw error
  return data
}

// ============================================================================
// AUTH LISTENER
// ============================================================================

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}

// ============================================================================
// REACT HOOK EXAMPLE
// ============================================================================

import { useEffect, useState } from 'react'

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Get initial session
    getSession()
      .then(session => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }))
      })
      .catch(error => {
        setState(prev => ({ ...prev, error, loading: false }))
      })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithGithub,
    signInWithMagicLink,
    resetPasswordForEmail,
    updatePassword,
    updateUserProfile,
  }
}
