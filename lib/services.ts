import { SupabaseClient } from '@supabase/supabase-js';
// Import your types from your types file
import { Car, Booking, User, Review } from './mock-data'; 

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // ==========================================
  // CARS
  // ==========================================

  async getCars() {
    const { data, error } = await this.supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }

  async getCarById(id: string) {
    const { data, error } = await this.supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }

  async createCar(carData: Partial<Car>) {
    const { data, error } = await this.supabase
      .from('cars')
      .insert([carData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async updateCar(id: string, updates: Partial<Car>) {
    const { data, error } = await this.supabase
      .from('cars')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async deleteCar(id: string) {
    const { error } = await this.supabase
      .from('cars')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }

  // ==========================================
  // BOOKINGS
  // ==========================================

  async getBookings() {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        cars ( name, image ),
        users ( name, email )
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }

  async getUserBookings(userId: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, cars(name, image)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }

  async createBooking(bookingData: Partial<Booking>) {
    const { data, error } = await this.supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async updateBookingStatus(id: string, status: Booking['status']) {
    const { data, error } = await this.supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  // ==========================================
  // USERS (Profiles)
  // ==========================================

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  // ==========================================
  // REVIEWS
  // ==========================================

  async getCarReviews(carId: string) {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*, users(name, profile_image)')
      .eq('car_id', carId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  }

  async createReview(reviewData: Partial<Review>) {
    const { data, error } = await this.supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}
