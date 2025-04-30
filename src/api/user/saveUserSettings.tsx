"use server"

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface NotificationSettings {
  emailUpdates: boolean;
  commissionUpdates: boolean;
  promotions: boolean;
}

export interface PrivacySettings {
  profileVisibility: string;
  dataUsage: boolean;
}

export async function saveNotificationSettings(userId: string, settings: NotificationSettings) {
  try {
    // Update notification settings
    const { error } = await supabase
      .from('notification_settings')
      .upsert({ 
        user_id: userId, 
        email_updates: settings.emailUpdates,
        commission_updates: settings.commissionUpdates,
        promotions: settings.promotions,
        last_updated: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving notification settings:", error);
    throw error;
  }
}

export async function savePrivacySettings(userId: string, settings: PrivacySettings) {
  try {
    // Update privacy settings
    const { error } = await supabase
      .from('privacy_settings')
      .upsert({ 
        user_id: userId, 
        profile_visibility: settings.profileVisibility,
        data_usage: settings.dataUsage,
        last_updated: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving privacy settings:", error);
    throw error;
  }
}

export async function fetchNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    // Fetch notification settings
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If no record exists, return default settings
      if (error.code === 'PGRST116') {
        return {
          emailUpdates: true,
          commissionUpdates: true,
          promotions: false
        };
      }
      throw new Error(error.message);
    }
    
    // Map database fields to the interface
    return {
      emailUpdates: data.email_updates,
      commissionUpdates: data.commission_updates,
      promotions: data.promotions
    };
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    // Return default settings on error
    return {
      emailUpdates: true,
      commissionUpdates: true,
      promotions: false
    };
  }
}

export async function fetchPrivacySettings(userId: string): Promise<PrivacySettings> {
  try {
    // Fetch privacy settings
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If no record exists, return default settings
      if (error.code === 'PGRST116') {
        return {
          profileVisibility: 'private',
          dataUsage: true
        };
      }
      throw new Error(error.message);
    }
    
    // Map database fields to the interface
    return {
      profileVisibility: data.profile_visibility,
      dataUsage: data.data_usage
    };
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    // Return default settings on error
    return {
      profileVisibility: 'private',
      dataUsage: true
    };
  }
}

// Function to enable two-factor authentication
export async function enableTwoFactorAuth(userId: string) {
  try {
    // Update privacy settings to enable 2FA
    const { error } = await supabase
      .from('privacy_settings')
      .update({ 
        two_factor_auth: true,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Log the security event
    await supabase
      .from('security_audit')
      .insert({
        user_id: userId,
        event_type: 'ENABLE_2FA',
        description: 'Two-factor authentication was enabled'
      });
    
    return { success: true };
  } catch (error) {
    console.error("Error enabling two-factor authentication:", error);
    throw error;
  }
}

// Function to sign out from all devices
export async function signOutAllDevices(userId: string) {
  try {
    // This would typically call an auth function to invalidate all sessions
    // For now, we'll just log the security event
    await supabase
      .from('security_audit')
      .insert({
        user_id: userId,
        event_type: 'LOGOUT_ALL_DEVICES',
        description: 'User signed out from all devices'
      });
    
    return { success: true };
  } catch (error) {
    console.error("Error signing out from all devices:", error);
    throw error;
  }
}

// Function to delete measurement data
export async function deleteMeasurementData(userId: string) {
  try {
    // Update profile to clear measurements
    const { error } = await supabase
      .from('profiles')
      .update({ 
        measurements: '{}',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    if (error) {
      throw new Error(error.message);
    }
    
    // Log the security event
    await supabase
      .from('security_audit')
      .insert({
        user_id: userId,
        event_type: 'DELETE_MEASUREMENTS',
        description: 'User measurement data was deleted'
      });
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting measurement data:", error);
    throw error;
  }
}

// Function to deactivate account
export async function deactivateAccount(userId: string) {
  try {
    // This would typically involve multiple steps in a transaction
    // For demonstration purposes, we'll just log the security event
    await supabase
      .from('security_audit')
      .insert({
        user_id: userId,
        event_type: 'ACCOUNT_DEACTIVATED',
        description: 'User account was deactivated'
      });
    
    return { success: true, message: 'Account deactivation initiated' };
  } catch (error) {
    console.error("Error deactivating account:", error);
    throw error;
  }
}

// Function to permanently delete account
export async function deleteAccount(userId: string) {
  try {
    // This would typically involve a cascade delete or archive process
    // For demonstration purposes, we'll just log the security event
    await supabase
      .from('security_audit')
      .insert({
        user_id: userId,
        event_type: 'ACCOUNT_DELETED',
        description: 'User account was permanently deleted'
      });
    
    return { success: true, message: 'Account deletion initiated' };
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}