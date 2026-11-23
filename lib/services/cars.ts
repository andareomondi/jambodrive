import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Car, CarInsert, CarUpdate } from "@/types";

export async function getCars(): Promise<Car[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    // Public pages degrade to an empty list rather than failing the build or the page.
    console.error(`[cars] getCars failed: ${error.message}`);
    return [];
  }
  return data ?? [];
}

export async function getAvailableCars(): Promise<Car[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("available", true)
    .order("name", { ascending: true });

  if (error) {
    console.error(`[cars] getAvailableCars failed: ${error.message}`);
    return [];
  }
  return data ?? [];
}

export async function getCarById(id: string): Promise<Car> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`getCarById: ${error.message}`);
  return data;
}

export async function createCar(carData: CarInsert): Promise<Car> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .insert([carData])
    .select()
    .single();

  if (error) throw new Error(`createCar: ${error.message}`);
  return data;
}

export async function updateCar(id: string, updates: CarUpdate): Promise<Car> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateCar: ${error.message}`);
  return data;
}

export async function deleteCar(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("cars").delete().eq("id", id);

  if (error) throw new Error(`deleteCar: ${error.message}`);
}
