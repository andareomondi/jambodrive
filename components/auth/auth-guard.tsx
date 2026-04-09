"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, LogIn } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

const publicRoutes = ["/", "/about", "/contact", "/auth/login", "/auth/register", "/auth/callback", "/forgot-password", "/reset-password", "/cars", "/cars/[id]"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient() 

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isPublicRoute = publicRoutes.includes(pathname)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!isPublicRoute && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access this page. Please sign in to continue.
            </p>
            <div className="space-y-3">
              <Button
                asChild
                variant="primary"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
