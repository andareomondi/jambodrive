"use client";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/auth/supabase-provider";
import { ArrowRight, Car, Loader2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function VerificationHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const verified = searchParams.get("verified");
  const error = searchParams.get("error");

  if (!verified && !error) return null;

  const isSuccess = verified === "true";
  const errorMessage =
    error === "link_expired"
      ? "This verification link has expired. Please request a new one."
      : "Email verification failed. Please try again.";

  const closeModal = () => {
    router.replace(pathname);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md">
        {isSuccess ? (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 space-y-6 shadow-lg">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Car className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-900">
                Email Verified!
              </h1>
              <p className="text-green-800">
                Your email is verified. Please sign in to continue.
              </p>
            </div>
            <Link href="/auth/login">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Sign In Now
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-8 space-y-6 shadow-lg">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-900">
                Verification Failed
              </h1>
              <p className="text-red-800">{errorMessage}</p>
            </div>
            <Link href="/auth/register">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Back to Sign In
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [showUnverifiedWarning, setShowUnverifiedWarning] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  // Get returnUrl from query params, default to /dashboard
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.supabase.auth.getSession();
      setHasSession(!!session);
      setIsCheckingSession(false);
    };
    checkSession();
  }, [supabase]);

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.supabase.auth.resend({
        type: "signup",
        email: unverifiedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Verification email sent! Please check your inbox.");
      setShowUnverifiedWarning(false);
    } catch {
      toast.error("Failed to resend verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setShowUnverifiedWarning(false);

    try {
      const { data, error } = await supabase.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check for unverified email error
        if (
          error.message.includes("Email not confirmed") ||
          error.message.includes("verify")
        ) {
          setUnverifiedEmail(email);
          setShowUnverifiedWarning(true);
          return;
        }

        toast.error(error.message);
        return;
      }

      // Double-check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        setUnverifiedEmail(email);
        setShowUnverifiedWarning(true);
        await supabase.supabase.auth.signOut();
        return;
      }

      toast.success("Logged in successfully!");

      // Decode and redirect to returnUrl
      const decodedUrl = decodeURIComponent(returnUrl);
      router.push(decodedUrl);
    } catch {
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex items-center">
        <Card className="w-full p-8 shadow-medium">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Car className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {hasSession ? "Welcome Back" : "Sign In"}
            </h1>
            <p className="text-muted-foreground">
              {hasSession
                ? "You are already logged in."
                : "Sign in to your Cosmara account"}
            </p>
          </div>

          {/* Unverified Email Warning */}
          {showUnverifiedWarning && (
            <Card className="mb-6 p-4 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-yellow-900 text-sm">
                      Email Not Verified
                    </h3>
                    <p className="text-xs text-yellow-800 mt-1">
                      Please verify your email address before signing in. Check
                      your inbox for the verification link.
                    </p>
                  </div>
                  <Button
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    {isLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {hasSession ? (
            <div className="space-y-4">
              <Button
                onClick={() => router.push(decodeURIComponent(returnUrl))}
                className="w-full bg-accent hover:bg-accent/90 py-6 text-lg"
              >
                Continue Browsing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.supabase.auth.signOut();
                  setHasSession(false);
                }}
                className="w-full"
              >
                Sign out of this account
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <FieldGroup>
                <div>
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </FieldGroup>
              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-accent hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
      <Footer />
      <Suspense fallback={null}>
        <VerificationHandler />
      </Suspense>
    </div>
  );
}
