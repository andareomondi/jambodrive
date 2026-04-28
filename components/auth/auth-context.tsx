"use client"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase-client"

type UserRole = "admin" | "user" | null

interface AuthContextValue {
  user: User | null
  session: Session | null
  role: UserRole
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}


const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  // Fetch role from profiles table once we have a user
  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (!error && data) {
      setRole(data.role as UserRole)
    } else {
      setRole("user") // safe fallback
    }
  }

  useEffect(() => {
    // 1. Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchRole(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // 2. Listen to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchRole(session.user.id)
        } else {
          setRole(null)
        }

        setLoading(false)
      }
    )

    // 3. Cleanup — this was missing in your navbar!
    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    // onAuthStateChange handles clearing user/session/role
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin: role === "admin",
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
