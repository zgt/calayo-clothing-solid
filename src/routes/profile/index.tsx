import { createSignal, createEffect, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { toast, Toaster } from "solid-toast";
import { useNavigate } from "@solidjs/router";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  phone: string | null;
  preferences: string | null;
  created_at: string;
  updated_at: string;
  // Measurements
  chest: string | null;
  waist: string | null;
  hips: string | null;
  length: string | null;
  inseam: string | null;
  shoulders: string | null;
}

export default function Profile() {
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = createSignal<ProfileData | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [editMode, setEditMode] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  
  // Editable form data
  const [formData, setFormData] = createSignal({
    full_name: "",
    bio: "",
    website: "",
    location: "",
    phone: "",
    chest: "",
    waist: "",
    hips: "",
    length: "",
    inseam: "",
    shoulders: ""
  });
  
  // Fetch user profile data
  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      if (!auth.isAuthenticated()) {
        throw new Error("You must be logged in to view your profile");
      }
      
      const userId = auth.user()?.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Fetch profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      setProfileData(data as ProfileData);
      
      // Initialize form data with current values
      setFormData({
        full_name: data.full_name || "",
        bio: data.bio || "",
        website: data.website || "",
        location: data.location || "",
        phone: data.phone || "",
        chest: data.chest || "",
        waist: data.waist || "",
        hips: data.hips || "",
        length: data.length || "",
        inseam: data.inseam || "",
        shoulders: data.shoulders || ""
      });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update profile
  const updateProfile = async () => {
    setIsSubmitting(true);
    
    try {
      const userId = auth.user()?.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setProfileData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...formData(),
          updated_at: new Date().toISOString()
        };
      });
      
      toast.success("Profile updated successfully");
      setEditMode(false);
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle input change
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Generate avatar initials
  const getInitials = () => {
    const name = profileData()?.full_name || "";
    if (!name) return "U";
    
    const parts = name.split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Check if any measurements are provided
  const hasMeasurements = () => {
    const data = profileData();
    if (!data) return false;
    
    return !!(data.chest || data.waist || data.hips || data.length || data.inseam || data.shoulders);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode()) {
      // Reset form data when canceling edit
      const data = profileData();
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          bio: data.bio || "",
          website: data.website || "",
          location: data.location || "",
          phone: data.phone || "",
          chest: data.chest || "",
          waist: data.waist || "",
          hips: data.hips || "",
          length: data.length || "",
          inseam: data.inseam || "",
          shoulders: data.shoulders || ""
        });
      }
    }
    setEditMode(!editMode());
  };
  
  // Handle form submission
  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    updateProfile();
  };
  
  // Fetch profile when component mounts
  createEffect(() => {
    if (!auth.isLoading()) {
      if (auth.isAuthenticated()) {
        fetchProfileData();
      } else {
        navigate("/login", { replace: true });
      }
    }
  });

  return (
    <main class="min-h-screen bg-gradient-to-b from-emerald-950 to-gray-950 py-10 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, easing: "ease-out" }}
        >
          <h1 class="text-3xl font-bold text-white mb-8">My Profile</h1>
          
          {/* Loading State */}
          <Show when={isLoading()}>
            <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 p-10">
              <div class="flex flex-col items-center justify-center py-10">
                <div class="animate-spin h-10 w-10 border-4 border-emerald-500 rounded-full border-t-transparent"></div>
                <span class="mt-4 text-emerald-300">Loading profile data...</span>
              </div>
            </div>
          </Show>
          
          {/* Error State */}
          <Show when={!isLoading() && error()}>
            <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 p-10">
              <div class="flex flex-col items-center justify-center py-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl text-white font-medium mb-2">Error Loading Profile</h3>
                <p class="text-emerald-300/70 text-center mb-6">{error()}</p>
                <div class="flex space-x-4">
                  <button
                    onClick={() => fetchProfileData()}
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow transition-all"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </Show>
          
          {/* Profile Content */}
          <Show when={!isLoading() && !error() && profileData()}>
            {/* View Mode */}
            <Show when={!editMode()}>
              <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden">
                {/* Header section with profile summary */}
                <div class="relative bg-gradient-to-r from-emerald-800/50 to-emerald-700/30 p-6 sm:px-8 border-b border-emerald-700/30">
                  <div class="flex flex-col sm:flex-row sm:items-center">
                    <div class="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-900/30 mb-4 sm:mb-0 sm:mr-6">
                      {getInitials()}
                    </div>
                    
                    <div class="flex-1">
                      <h2 class="text-2xl font-bold text-white">{profileData()?.full_name}</h2>
                      <p class="text-emerald-200/80 mt-1">{profileData()?.email}</p>
                      
                      <Show when={profileData()?.bio}>
                        <p class="text-emerald-100 mt-4 max-w-2xl">{profileData()?.bio}</p>
                      </Show>
                      
                      <div class="mt-4 flex flex-wrap gap-4">
                        <button
                          onClick={toggleEditMode}
                          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition-all flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit Profile
                        </button>
                        
                        <a
                          href="/profile/orders"
                          class="px-4 py-2 bg-emerald-700/60 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-all flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                          </svg>
                          My Orders
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Profile details sections */}
                <div class="p-6 sm:p-8">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Information */}
                    <div>
                      <h3 class="text-xl font-semibold text-white mb-4">Contact Information</h3>
                      <div class="bg-emerald-950/50 border border-emerald-700/30 rounded-lg p-5">
                        <ul class="space-y-4">
                          <li class="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <div>
                              <span class="block text-xs text-emerald-400/80 mb-1">Phone</span>
                              <span class="text-emerald-100">{profileData()?.phone || "Not provided"}</span>
                            </div>
                          </li>
                          
                          <li class="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                            </svg>
                            <div>
                              <span class="block text-xs text-emerald-400/80 mb-1">Location</span>
                              <span class="text-emerald-100">{profileData()?.location || "Not provided"}</span>
                            </div>
                          </li>
                          
                          <li class="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                            </svg>
                            <div>
                              <span class="block text-xs text-emerald-400/80 mb-1">Website</span>
                              <Show
                                when={profileData()?.website}
                                fallback={<span class="text-emerald-100">Not provided</span>}
                              >
                                <a 
                                  href={profileData()?.website as string} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  class="text-emerald-400 hover:text-emerald-300 hover:underline"
                                >
                                  {profileData()?.website}
                                </a>
                              </Show>
                            </div>
                          </li>
                          
                          <li class="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                            </svg>
                            <div>
                              <span class="block text-xs text-emerald-400/80 mb-1">Member Since</span>
                              <span class="text-emerald-100">{formatDate(profileData()?.created_at || "")}</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* Measurements */}
                    <div>
                      <h3 class="text-xl font-semibold text-white mb-4">My Measurements</h3>
                      <div class="bg-emerald-950/50 border border-emerald-700/30 rounded-lg p-5">
                        <Show
                          when={hasMeasurements()}
                          fallback={
                            <div class="text-center py-6">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-emerald-500/50 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <p class="text-emerald-300/70">No measurements saved yet.</p>
                              <p class="text-emerald-400 mt-2">
                                <button 
                                  onClick={toggleEditMode}
                                  class="hover:underline focus:outline-none"
                                >
                                  Add your measurements
                                </button>
                              </p>
                            </div>
                          }
                        >
                          <div class="grid grid-cols-2 gap-4">
                            <Show when={profileData()?.chest}>
                              <div>
                                <span class="block text-xs text-emerald-400/80 mb-1">Chest</span>
                                <span class="text-emerald-100">{profileData()?.chest} inches</span>
                              </div>
                            </Show>
                            
                            <Show when={profileData()?.shoulders}>
                              <div>
                                <span class="block text-xs text-emerald-400/80 mb-1">Shoulders</span>
                                <span class="text-emerald-100">{profileData()?.shoulders} inches</span>
                              </div>
                            </Show>
                            
                            <Show when={profileData()?.waist}>
                              <div>
                                <span class="block text-xs text-emerald-400/80 mb-1">Waist</span>
                                <span class="text-emerald-100">{profileData()?.waist} inches</span>
                              </div>
                            </Show>
                            
                            <Show when={profileData()?.hips}>
                              <div>
                                <span class="block text-xs text-emerald-400/80 mb-1">Hips</span>
                                <span class="text-emerald-100">{profileData()?.hips} inches</span>
                              </div>
                            </Show>
                            
                            <Show when={profileData()?.length}>
                              <div>
                                <span class="block text-xs text-emerald-400/80 mb-1">Length</span>
                                <span class="text-emerald-100">{profileData()?.length} inches</span>
                              </div>
                            </Show>
                            
                            <Show when={profileData()?.inseam}>
                              <div>
                                <span class="block text-xs text-emerald-400/80 mb-1">Inseam</span>
                                <span class="text-emerald-100">{profileData()?.inseam} inches</span>
                              </div>
                            </Show>
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Show>
            
            {/* Edit Mode */}
            <Show when={editMode()}>
              <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden">
                <div class="border-b border-emerald-700/30 p-6">
                  <h2 class="text-2xl font-bold text-white">Edit Profile</h2>
                  <p class="text-emerald-200/70 mt-1">Update your personal information and measurements</p>
                </div>
                
                <form onSubmit={handleSubmit} class="p-6">
                  <div class="grid grid-cols-1 gap-6">
                    {/* Personal Information */}
                    <div>
                      <h3 class="text-lg font-semibold text-white mb-4">Personal Information</h3>
                      <div class="space-y-4">
                        <div>
                          <label for="full_name" class="block text-sm font-medium text-emerald-100 mb-1">
                            Full Name
                          </label>
                          <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            value={formData().full_name}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="Your full name"
                          />
                        </div>
                        
                        <div>
                          <label for="bio" class="block text-sm font-medium text-emerald-100 mb-1">
                            Bio
                          </label>
                          <textarea
                            id="bio"
                            name="bio"
                            value={formData().bio}
                            onInput={handleInputChange}
                            rows={3}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                            placeholder="Tell us about yourself"
                          ></textarea>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label for="location" class="block text-sm font-medium text-emerald-100 mb-1">
                              Location
                            </label>
                            <input
                              id="location"
                              name="location"
                              type="text"
                              value={formData().location}
                              onInput={handleInputChange}
                              class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                              placeholder="City, Country"
                            />
                          </div>
                          
                          <div>
                            <label for="phone" class="block text-sm font-medium text-emerald-100 mb-1">
                              Phone
                            </label>
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData().phone}
                              onInput={handleInputChange}
                              class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                              placeholder="Your phone number"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label for="website" class="block text-sm font-medium text-emerald-100 mb-1">
                            Website
                          </label>
                          <input
                            id="website"
                            name="website"
                            type="url"
                            value={formData().website}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Measurements */}
                    <div>
                      <h3 class="text-lg font-semibold text-white mb-4">Measurements (inches)</h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label for="chest" class="block text-sm font-medium text-emerald-100 mb-1">
                            Chest
                          </label>
                          <input
                            id="chest"
                            name="chest"
                            type="text"
                            value={formData().chest}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="0.0"
                          />
                        </div>
                        
                        <div>
                          <label for="shoulders" class="block text-sm font-medium text-emerald-100 mb-1">
                            Shoulders
                          </label>
                          <input
                            id="shoulders"
                            name="shoulders"
                            type="text"
                            value={formData().shoulders}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="0.0"
                          />
                        </div>
                        
                        <div>
                          <label for="waist" class="block text-sm font-medium text-emerald-100 mb-1">
                            Waist
                          </label>
                          <input
                            id="waist"
                            name="waist"
                            type="text"
                            value={formData().waist}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="0.0"
                          />
                        </div>
                        
                        <div>
                          <label for="hips" class="block text-sm font-medium text-emerald-100 mb-1">
                            Hips
                          </label>
                          <input
                            id="hips"
                            name="hips"
                            type="text"
                            value={formData().hips}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="0.0"
                          />
                        </div>
                        
                        <div>
                          <label for="length" class="block text-sm font-medium text-emerald-100 mb-1">
                            Length
                          </label>
                          <input
                            id="length"
                            name="length"
                            type="text"
                            value={formData().length}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="0.0"
                          />
                        </div>
                        
                        <div>
                          <label for="inseam" class="block text-sm font-medium text-emerald-100 mb-1">
                            Inseam
                          </label>
                          <input
                            id="inseam"
                            name="inseam"
                            type="text"
                            value={formData().inseam}
                            onInput={handleInputChange}
                            class="w-full px-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="0.0"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Form Actions */}
                    <div class="border-t border-emerald-700/30 pt-6 flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={toggleEditMode}
                        class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow transition-all"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting()}
                        class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center transition-all duration-200 hover:shadow-emerald-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <Show 
                          when={isSubmitting()}
                          fallback={
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                              </svg>
                              Save Changes
                            </>
                          }
                        >
                          <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </Show>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </Show>
          </Show>
        </Motion.div>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}