export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "failed";
export type TransmissionType = "manual" | "automatic";
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";

export interface Car {
  id: string;
  name: string;
  model: string;
  year: number;
  price: number;
  rating: number | null;
  reviews: number | null;
  image: string | null;
  images: string[] | null;
  type: string | null;
  seats: number;
  transmission: TransmissionType;
  fuel: FuelType;
  fuel_consumption: string | null;
  features: string[] | null;
  description: string | null;
  available: boolean | null;
  chauffeured: boolean | null;
}

export type CarInsert = Omit<Car, "id" | "rating" | "reviews" | "available"> & {
  rating?: number;
  reviews?: number;
  available?: boolean;
};
export type CarUpdate = Partial<CarInsert>;

export interface Booking {
  id: string;
  car_id: string | null;
  profile_id: string | null;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_price: number;
  status: BookingStatus | null;
  insurance: boolean | null;
  additional_features: string[] | null;
  created_at: string | null;
  days: number | null;
  // M-Pesa / payment fields
  checkout_request_id: string | null;
  mpesa_receipt_number: string | null;
  mpesa_transaction_date: string | null;
  mpesa_phone: string | null;
  paid_amount: number | null;
  payment_failure_reason: string | null;
  // Facilitator flow
  facilitator_checkout_id: string | null;
  // Additional fee (damage, extras, etc.)
  additional_fee_status: string | null;
  additional_fee_receipt: string | null;
  additional_fee_amount: number | null;
  additional_fee_reason: string | null;
  // Misc
  notes: string | null;
  // Joined relations — present only when selected via Supabase joins
  cars?: Pick<Car, "name" | "image">;
  profiles?: Pick<Profile, "full_name" | "email" | "phone">;
}

export type BookingInsert = Omit<
  Booking,
  | "id"
  | "created_at"
  | "status"
  | "cars"
  | "profiles"
  | "mpesa_receipt_number"
  | "mpesa_transaction_date"
  | "paid_amount"
  | "payment_failure_reason"
  | "additional_fee_status"
  | "additional_fee_receipt"
  | "additional_fee_amount"
  | "additional_fee_reason"
> & {
  status?: BookingStatus;
};

export type BookingStatusUpdate = Pick<Booking, "status">;
export type BookingPaymentUpdate = Pick<
  Booking,
  | "mpesa_receipt_number"
  | "mpesa_transaction_date"
  | "paid_amount"
  | "payment_failure_reason"
  | "checkout_request_id"
>;

export type ProfileRole = "customer" | "super_admin" | "facilitator";

export interface Profile {
  id: string;
  updated_at: string | null;
  full_name: string | null;
  role: ProfileRole | null;
  total_bookings: number | null;
  email: string | null;
  phone: string | null;
  profile_image: string | null;
  join_date: string | null;
}

export type ProfileUpdate = Partial<
  Pick<Profile, "full_name" | "phone" | "profile_image" | "role">
>;

export interface SupportRequest {
  id: number;
  created_at: string;
  subject: string | null;
  category: string | null;
  message: string | null;
}

export type SupportRequestInsert = Omit<SupportRequest, "id" | "created_at">;
