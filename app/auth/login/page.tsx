"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, Car, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { safeRedirectTarget } from "@/lib/auth/safe-redirect";
import { ROOT_HOST } from "@/lib/routing/surfaces";

// Absolute targets (a subdomain) need a full navigation; relative ones use the router.
function navigateTo(router: ReturnType<typeof useRouter>, target: string) {
  if (/^https?:\/\//.test(target)) {
    window.location.assign(target);
    return;
  }
  router.replace(target);
  router.refresh();
}

function UnverifiedWarning({
  onResend,
  isLoading,
}: {
  onResend: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="mt-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Email Not Verified
          </p>
          <p className="text-xs text-muted-foreground">
            Please verify your email address before signing in. Check your inbox
            for the verification link.
          </p>
          <Button
            onClick={onResend}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeRedirectTarget(
    searchParams.get("returnUrl"),
    "/dashboard",
    ROOT_HOST,
  );

  const turnstileRef = useRef<TurnstileInstance>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showUnverified, setShowUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const resetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigateTo(router, returnUrl);
      } else {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, [router, returnUrl]);

  const handleResendVerification = async () => {
    if (!captchaToken) {
      toast.error("Please complete the security check first");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: unverifiedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
          captchaToken,
        },
      });
      resetCaptcha();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Verification email sent! Check your inbox.");
      setShowUnverified(false);
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
    if (!captchaToken) {
      toast.error("Please complete the security check");
      return;
    }

    setIsLoading(true);
    setShowUnverified(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });

      resetCaptcha();

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("email not confirmed")) {
          setUnverifiedEmail(email);
          setShowUnverified(true);
          return;
        }
        toast.error(error.message);
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        setUnverifiedEmail(email);
        setShowUnverified(true);
        await supabase.auth.signOut();
        return;
      }

      toast.success("Logged in successfully!");
      // Refresh so the server-rendered Navbar picks up the new session cookie
      navigateTo(router, returnUrl);
    } catch {
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Car className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Sign In</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your Cosmara account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
              options={{ theme: "auto" }}
            />

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-2"
              disabled={isLoading || !captchaToken}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {showUnverified && (
            <UnverifiedWarning
              onResend={handleResendVerification}
              isLoading={isLoading}
            />
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

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
