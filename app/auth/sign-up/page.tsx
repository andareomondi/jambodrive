"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName:        "",
    email:           "",
    password:        "",
    confirmPassword: "",
    agreeTerms:      false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!formData.agreeTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
        },
      });

      if (signUpError) {
        // Supabase returns this when the email is already registered
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("An account with this email already exists. Please sign in.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // identities being empty means the email is already taken
      // (Supabase doesn't return an error in this case by default)
      if (data?.user && !data.user.identities?.length) {
        setError("An account with this email already exists. Please sign in.");
        return;
      }

      // Pass email to success page via query param so it can display it
      router.push(`/auth/sign-up-success?email=${encodeURIComponent(formData.email)}`);
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Car className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Join Cosmara
            </h1>
            <p className="text-sm text-muted-foreground">
              Create your account to start booking premium cars
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="agreeTerms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, agreeTerms: checked as boolean }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="agreeTerms" className="text-sm leading-snug cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="text-accent hover:text-accent/80 transition-colors">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-accent hover:text-accent/80 transition-colors">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Inline error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
