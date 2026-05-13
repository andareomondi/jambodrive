"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { Car, Mail, CheckCircle2 } from "lucide-react";
import { useSupabase } from "@/components/auth/supabase-provider";
export default function RegisterPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!formData.agreeTerms) {
      toast.error("You must agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase.supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email)
        .single();

      if (existingUser) {
        toast.error(
          "An account with this email already exists. Please sign in.",
        );
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Check for user already registered error from Supabase
        if (error.message.includes("already registered")) {
          toast.error(
            "An account with this email already exists. Please sign in.",
          );
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Check if user was created but email confirmation is disabled
      if (data?.user && !data.user.identities?.length) {
        toast.error(
          "An account with this email already exists. Please sign in.",
        );
        return;
      }

      setRegisteredEmail(formData.email);
      setShowSuccessCard(true);
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccessCard) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex items-center">
          <Card className="w-full p-8 shadow-medium border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-green-900 mb-2">
                  Check Your Email
                </h1>
                <p className="text-green-800">
                  We've sent a confirmation email to
                </p>
                <p className="text-green-900 font-semibold mt-1">
                  {registeredEmail}
                </p>
              </div>

              <div className="bg-white/50 rounded-lg p-4 text-left space-y-2">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    Click the verification link in the email to activate your
                    account
                  </p>
                </div>
                <p className="text-xs text-green-700 ml-8">
                  Can't find it? Check your spam folder
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Sign In
                </Button>
                <Button
                  onClick={() => setShowSuccessCard(false)}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                >
                  Back to Registration
                </Button>
              </div>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
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
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Join Cosmara
            </h1>
            <p className="text-muted-foreground">
              Create your account to start booking premium cars
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <div>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  At least 6 characters
                </p>
              </div>

              <div>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      agreeTerms: checked as boolean,
                    }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="agreeTerms" className="text-sm cursor-pointer">
                  I agree to the Terms & Conditions and Privacy Policy
                </Label>
              </div>
            </FieldGroup>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Sign In Link */}
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

      <Footer />
    </div>
  );
}
