'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldGroup, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { Car } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock authentication - redirect to dashboard
      toast.success(`Welcome back! Logging in as ${email}`)
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error) {
      toast.error('Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    toast.info('Google login is coming soon')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex items-center">
        <Card className="w-full p-8 shadow-medium">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Car className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your JamboDrive account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <div>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Link href="#" className="text-sm text-accent hover:text-accent/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </FieldGroup>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-accent hover:text-accent/80 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
