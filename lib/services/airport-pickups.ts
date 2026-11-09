import { createClient } from "@/lib/supabase/server";
import type { AirportPickupRate } from "@/types";

export async function getActiveAirportPickupRates(): Promise<
  AirportPickupRate[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("airport_pickup_rates")
    .select(
      "id, airport_code, airport_name, destination, fare_amount, currency, is_active, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("airport_name")
    .order("destination");

  if (error) throw new Error(`getActiveAirportPickupRates: ${error.message}`);
  return data as AirportPickupRate[];
}
