import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types";

export { ADMIN_ROLES, STAFF_ROLES } from "@/lib/auth/roles";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Verifies the signed-in user and their role on the server. Every server
 * action that reads or writes privileged data must call this first; RLS is
 * a second line of defence, not the only one.
 */
export async function requireRole(roles: ProfileRole[]) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthorizationError("Please sign in to continue.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as ProfileRole | null | undefined;
  if (error || !role || !roles.includes(role)) {
    throw new AuthorizationError("You are not authorized to do this.");
  }

  return { supabase, user, role };
}
