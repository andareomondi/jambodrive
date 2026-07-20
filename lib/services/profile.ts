import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileUpdate } from "@/types";

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("join_date", { ascending: false });

  if (error) throw new Error(`getProfiles: ${error.message}`);
  return data;
}

export async function getProfileById(profileId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) throw new Error(`getProfileById: ${error.message}`);
  return data;
}

export async function updateProfile(
  profileId: string,
  updates: ProfileUpdate,
): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .select()
    .single();

  if (error) throw new Error(`updateProfile: ${error.message}`);
  return data;
}
