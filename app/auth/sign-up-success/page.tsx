import { Suspense } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Car, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Your Email",
  robots: { index: false, follow: false },
};

// Reads email from query param — must be in Suspense
async function SuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card className="p-8 w-full">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Check Your Email
          </h1>
          <p className="text-muted-foreground text-sm">
            We&apos;ve sent a confirmation link to
          </p>
          {email && (
            <p className="font-semibold text-foreground mt-1 break-all">
              {decodeURIComponent(email)}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted/40 border border-border rounded-xl p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Click the verification link in the email to activate your account
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Car className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Once verified you&apos;ll be able to browse and book our full fleet
            </p>
          </div>
          <p className="text-xs text-muted-foreground pl-8">
            Can&apos;t find it? Check your spam folder
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/auth/login">Go to Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/sign-up">Back to Registration</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <Card className="p-8 w-full text-center">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </Card>
          }
        >
          <SuccessContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
