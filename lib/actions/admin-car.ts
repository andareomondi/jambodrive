"use server";

import { createClient } from "@/lib/supabase/server";
import type { Car, CarInsert, CarUpdate } from "@/types";

export async function adminUpsertCar(
  payload: CarInsert | (CarUpdate & { id: string }),
): Promise<Car> {
  const supabase = await createClient();

  if ("id" in payload && payload.id) {
    const { id, ...updates } = payload as CarUpdate & { id: string };
    const { data, error } = await supabase
      .from("cars")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "42501")
        throw new Error("Permission denied. Only admins can manage listings.");
      throw new Error(error.message);
    }
    return data;
  }

  const { data, error } = await supabase
    .from("cars")
    .insert([payload as CarInsert])
    .select()
    .single();
  if (error) {
    if (error.code === "42501")
      throw new Error("Permission denied. Only admins can manage listings.");
    throw new Error(error.message);
  }
  return data;
}
