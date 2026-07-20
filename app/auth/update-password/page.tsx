"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Loader2, CheckCircle2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [done, setDone]                   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) { setError(updateError.message); return; }

      setDone(true);
      // Give the user a moment to read the confirmation then redirect
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {done ? (
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-accent" />
                </div>
              ) : (
                <Car className="w-10 h-10 text-accent" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {done ? "Password Updated" : "Set New Password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {done
                ? "Redirecting you to sign in..."
                : "Choose a strong password for your account"}
            </p>
          </div>

          {!done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  At least 6 characters
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
