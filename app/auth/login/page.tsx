"use client";

import { useSupabase } from "@/components/auth/supabase-provider";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Car, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// 1. ISOLATED COMPONENT: Extracted to contain search param logic safely
function VerificationContent() {
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

// 2. WRAPPER COMPONENT: Safeguards the validation modal from breaking static generation
function VerificationHandler() {
  return (
    <Suspense fallback={null}>
      <VerificationContent />
    </Suspense>
  );
}

// 3. ISOLATED COMPONENT: Extracted login structural elements dependent on returnUrl params
function LoginFormContent() {
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

  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  useEffect(() => {
    const checkSession = async () => {
      // Adjusted property pathing to map your context state provider setup
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

      if (data.user && !data.user.email_confirmed_at) {
        setUnverifiedEmail(email);
        setShowUnverifiedWarning(true);
        await supabase.supabase.auth.signOut();
        return;
      }

      toast.success("Logged in successfully!");
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

          {/* Form Content Wrapper */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <FieldLabel>Email Address</FieldLabel>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </FieldGroup>
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {showUnverifiedWarning && (
            <Card className="mt-6 p-4 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
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
        </Card>
      </div>
      <Footer />
      <VerificationHandler />
    </div>
  );
}

// 4. MAIN EXPORT COMPONENT: Provides clean skeleton fallback state to NextJS layout engines
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
