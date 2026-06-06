import { createClient } from "@/lib/supabase/server";
import type { SupportRequest, SupportRequestInsert } from "@/types";

export async function getSupportRequests(): Promise<SupportRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getSupportRequests: ${error.message}`);
  return data;
}

export async function createSupportRequest(
  requestData: SupportRequestInsert,
): Promise<SupportRequest> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_requests")
    .insert([requestData])
    .select()
    .single();

  if (error) throw new Error(`createSupportRequest: ${error.message}`);
  return data;
}
