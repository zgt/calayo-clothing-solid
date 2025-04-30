"use server"

import { createClient } from '@supabase/supabase-js';
import { UserMeasurements } from './fetchProfileMeasurements';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveProfileMeasurements(userId: string, measurements: UserMeasurements) {
  try {
    // Convert measurements to JSON string for storage
    const measurementsJson = JSON.stringify(measurements);
    console.log("Saving measurements for user:", userId, measurementsJson);
    
    // Update profile with the new measurements and return the updated data
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        measurements: measurementsJson,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      
    console.log("Update response:", data);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error saving profile measurements:", error);
    throw error;
  }
}