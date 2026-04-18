'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Car, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { useMemo } from 'react'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const toggleMenu = () => setIsOpen(!isOpen)
  const profile = null

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error logging out. Please try again.')
      return
    } else {
    toast.success('Logged out successfully!')
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

      

        if (error) {
          toast.error('Error fetching user role:', error)
          return
        }

        setIsAdmin(profile.role === 'admin')
      }
    }

    getSession()
    
    // listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch user role from your database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (error) {
          toast.error('Error fetching user role:', error)
          return
        }

        setIsAdmin(profile.role === 'admin')
      } else {
        setIsAdmin(false)
      }
    })

    return () => {
      return
    }
  }, [supabase])
  
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Car className="w-8 h-8 text-accent" />
            <span className="font-bold text-xl hidden sm:inline text-foreground">Cozy Mobility</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="/cars"
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                Browse Cars
              </Link>
              { isAdmin && user && (
                <Link
                href="/dashboard/admin"
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                Super Admin
              </Link>)
              }


          </div>
          

          {/* Desktop Help & Auth Buttons */}
           { user ? (
          <div className="hidden md:flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Profile</Link>
            </Button>
            <Button onClick={handleLogout} asChild className="bg-accent hover:bg-accent/90">
              <a href="#">LogOut</a>
            </Button>
          </div>

          ) : (
          <div className="hidden md:flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link href="/auth/register">Sign Up</Link>
            </Button>
          </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-secondary rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            <div className="flex flex-col gap-3 pt-4 text-center">
            <Link href="/" onClick={() => setIsOpen(false)} className="px-3 py-2 text-foreground hover:bg-secondary rounded-md transition-colors">
                Home
              </Link>
              <Link href="/cars" onClick={() => setIsOpen(false)} className="px-3 py-2 text-foreground hover:bg-secondary rounded-md transition-colors">
                Browse Cars
              </Link>
              { isAdmin && (
                <Link href="/dashboard/admin" onClick={() => setIsOpen(false)} className="px-3 py-2 text-foreground hover:bg-secondary rounded-md transition-colors">
                  Super Admin
                </Link>)
              }
            </div>

            <div className="mt-4">
              { user ? (
                <div className="pt-2 border-t border-border flex gap-2">
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/dashboard">Profile</Link>
                  </Button>
                  <Button asChild className="flex-1 bg-accent hover:bg-accent/90" onClick={handleLogout}>
                    <a href="#"> LogOut </a>
                  </Button>
                </div>

              ) : (
              <div className="pt-2 border-t border-border flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild className="flex-1 bg-accent hover:bg-accent/90">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </div>
              )}
            </div>
          </div>
        )}
      </div>


    </nav>
  )
}
