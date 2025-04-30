"use server"

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  length?: number;
  inseam?: number;
  shoulders?: number;
}

export async function fetchProfileMeasurements(userId: string) {
  try {
    // Fetch profile measurements from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('chest, waist, hips, length, inseam, shoulders')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Return the measurements directly from the columns
    return {
      chest: data?.chest,
      waist: data?.waist,
      hips: data?.hips,
      length: data?.length,
      inseam: data?.inseam,
      shoulders: data?.shoulders
    } as UserMeasurements;
  } catch (error) {
    console.error("Error fetching profile measurements:", error);
    throw error;
  }
}