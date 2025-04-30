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
      .select('measurements')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // If the user has measurements stored in their profile, parse and return them
    if (data && data.measurements) {
      try {
        // Parse the JSON string back into an object
        const parsedMeasurements = typeof data.measurements === 'string' 
          ? JSON.parse(data.measurements) 
          : data.measurements;
        
        return parsedMeasurements as UserMeasurements;
      } catch (parseError) {
        console.error("Error parsing measurements:", parseError);
        return {} as UserMeasurements;
      }
    }
    
    // Return empty measurements object if none found
    return {} as UserMeasurements;
  } catch (error) {
    console.error("Error fetching profile measurements:", error);
    throw error;
  }
}