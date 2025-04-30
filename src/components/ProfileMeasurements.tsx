import { createSignal, createEffect, Show } from "solid-js";
import { useSupabase } from "solid-supabase";
import { toast } from "solid-toast";
import { fetchProfileMeasurements, UserMeasurements } from "~/api/user/fetchProfileMeasurements";
import { useAuth } from "~/context/auth";

export default function ProfileMeasurements() {
  const auth = useAuth();
  const supabase = useSupabase();

  
  const [measurements, setMeasurements] = createSignal<UserMeasurements>({
    chest: 0,
    waist: 0,
    hips: 0,
    length: 0,
    inseam: 0,
    shoulders: 0
  });
  
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
  
  // Function to load user's saved measurements
  const loadMeasurements = async () => {
    if (!auth.isAuthenticated()) {
      setError("You must be logged in to view your measurements");
      return;
    }
    
    const userId = auth.user()?.id;
    
    if (!userId) {
      setError("User ID not found");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userMeasurements = await fetchProfileMeasurements(userId);
      
      // Update measurements state with values from profile
      setMeasurements({
        chest: userMeasurements.chest || 0,
        waist: userMeasurements.waist || 0,
        hips: userMeasurements.hips || 0,
        length: userMeasurements.length || 0,
        inseam: userMeasurements.inseam || 0,
        shoulders: userMeasurements.shoulders || 0
      });
    } catch (err) {
      console.error("Error loading measurements:", err);
      setError("Failed to load your measurements");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to save measurements to profile
  const saveMeasurements = async (e: SubmitEvent) => {
    e.preventDefault();
    
    if (!auth.isAuthenticated()) {
      setError("You must be logged in to save measurements");
      return;
    }
    
    const userId = auth.user()?.id;
    
    if (!userId) {
      setError("User ID not found");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Send measurements to server
const { error: profileError } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString(),
          chest: measurements().chest || null,
          waist: measurements().waist || null,
          hips: measurements().hips || null,
          length: measurements().length || null,
          inseam: measurements().inseam || null,
          shoulders: measurements().shoulders || null,
        })
        .eq('id', userId);      
      setSuccessMessage("Your measurements have been saved successfully");
      toast.success("Measurements saved successfully");
    } catch (err) {
      console.error("Error saving measurements:", err);
      setError("Failed to save your measurements");
      toast.error("Failed to save measurements");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    
    // Update the measurements state
    setMeasurements({
      ...measurements(),
      [name]: parseFloat(value) || 0
    });
  };
  
  const handleNumberInput = (e: KeyboardEvent) => {
    // Allow only numbers, backspace, delete, tab, arrows, home, end, and decimal point
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', '.'];
    const key = e.key;
    
    // Check if the key is not a number or one of the allowed control keys
    if (!/^[0-9]$/.test(key) && !allowedKeys.includes(key)) {
      e.preventDefault();
    }
  };
  
  // Load measurements when component mounts
  createEffect(() => {
    if (!auth.isLoading() && auth.isAuthenticated()) {
      loadMeasurements();
    }
  });

  return (
    <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden">
      <div class="border-b border-emerald-700/30 px-6 py-4">
        <h2 class="text-xl font-bold text-white">Body Measurements</h2>
        <p class="text-emerald-300/70 text-sm mt-1">
          Store your measurements for faster commission requests
        </p>
      </div>
      
      <div class="p-6">
        {/* Loading State */}
        <Show when={isLoading()}>
          <div class="flex items-center justify-center py-10">
            <div class="animate-spin h-8 w-8 border-4 border-emerald-500 rounded-full border-t-transparent"></div>
            <span class="ml-3 text-emerald-300">Loading your measurements...</span>
          </div>
        </Show>
        
        {/* Error Message */}
        <Show when={!isLoading() && error()}>
          <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-200 flex items-start mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{error()}</span>
          </div>
        </Show>
        
        {/* Success Message */}
        <Show when={!isLoading() && successMessage()}>
          <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm text-green-200 flex items-start mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>{successMessage()}</span>
          </div>
        </Show>
        
        {/* Measurements Form */}
        <Show when={!isLoading()}>
          <form onSubmit={saveMeasurements} class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chest */}
              <div>
                <label for="chest" class="block text-emerald-100 font-medium mb-1 text-sm">Chest (inches)</label>
                <input
                  id="chest"
                  name="chest"
                  type="number"
                  step="0.1"
                  min="0"
                  value={measurements().chest}
                  onInput={handleInputChange}
                  onKeyDown={handleNumberInput}
                  class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="0.0"
                />
              </div>
              
              {/* Shoulders */}
              <div>
                <label for="shoulders" class="block text-emerald-100 font-medium mb-1 text-sm">Shoulders (inches)</label>
                <input
                  id="shoulders"
                  name="shoulders"
                  type="number"
                  step="0.1"
                  min="0"
                  value={measurements().shoulders}
                  onInput={handleInputChange}
                  onKeyDown={handleNumberInput}
                  class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="0.0"
                />
              </div>
              
              {/* Waist */}
              <div>
                <label for="waist" class="block text-emerald-100 font-medium mb-1 text-sm">Waist (inches)</label>
                <input
                  id="waist"
                  name="waist"
                  type="number"
                  step="0.1"
                  min="0"
                  value={measurements().waist}
                  onInput={handleInputChange}
                  onKeyDown={handleNumberInput}
                  class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="0.0"
                />
              </div>
              
              {/* Hips */}
              <div>
                <label for="hips" class="block text-emerald-100 font-medium mb-1 text-sm">Hips (inches)</label>
                <input
                  id="hips"
                  name="hips"
                  type="number"
                  step="0.1"
                  min="0"
                  value={measurements().hips}
                  onInput={handleInputChange}
                  onKeyDown={handleNumberInput}
                  class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="0.0"
                />
              </div>
              
              {/* Length */}
              <div>
                <label for="length" class="block text-emerald-100 font-medium mb-1 text-sm">Length (inches)</label>
                <input
                  id="length"
                  name="length"
                  type="number"
                  step="0.1"
                  min="0"
                  value={measurements().length}
                  onInput={handleInputChange}
                  onKeyDown={handleNumberInput}
                  class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="0.0"
                />
              </div>
              
              {/* Inseam */}
              <div>
                <label for="inseam" class="block text-emerald-100 font-medium mb-1 text-sm">Inseam (inches)</label>
                <input
                  id="inseam"
                  name="inseam"
                  type="number"
                  step="0.1"
                  min="0"
                  value={measurements().inseam}
                  onInput={handleInputChange}
                  onKeyDown={handleNumberInput}
                  class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="0.0"
                />
              </div>
            </div>
            
            <div class="flex justify-end mt-6">
              <button 
                type="submit" 
                disabled={isSaving()}
                class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center transition-all duration-200 hover:shadow-emerald-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Show 
                  when={isSaving()}
                  fallback={
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      Save Measurements
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
          </form>
        </Show>
      </div>
    </div>
  );
}