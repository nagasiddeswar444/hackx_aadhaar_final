import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  aadhaar_number: string;
  name: string;
  email: string;
  mobile: string;
  phone?: string;
  date_of_birth: string;
  password_hash: string;
  preferred_language: string;
  face_image_url?: string;
  face_descriptor?: any;
  role?: string;
  created_at: string;
};

export type Center = {
  id: string;
  center_name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type Slot = {
  id: string;
  center_id: string;
  date: string;
  time: string;
  capacity: number;
  booked_count: number;
  centers?: Center;
};

export type Booking = {
  id: string;
  user_id: string;
  slot_id: string;
  status: 'Booked' | 'Confirmed' | 'Completed' | 'Cancelled';
  booking_type: 'Normal' | 'Age Milestone';
  created_at: string;
  slots?: Slot;
};
