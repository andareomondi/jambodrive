import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as EmailOtpType | null;
  const next       = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    redirect("/auth/error?error=No token hash or type");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  // Type-aware redirect:
  // - signup → dashboard (email now confirmed, session is live)
  // - recovery → update-password page to set new password
  if (type === "recovery") {
    redirect("/auth/update-password");
  }

  redirect(next);
}
