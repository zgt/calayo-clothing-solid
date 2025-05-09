import { createSignal, createEffect, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { toast, Toaster } from "solid-toast";
import { useNavigate, useParams } from "@solidjs/router";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";

// Type for commission data
export interface CommissionFormData {
  _id: string;
  status: string;
  garmentType: string;
  measurements: {
    chest: number;
    waist: number;
    hips: number;
    length: number;
    inseam: number;
    shoulders: number;
  };
  budget: string;
  timeline: string;
  details: string;
  user_id: string;
}

export default function EditCommission() {
  const params = useParams();
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = createSignal<CommissionFormData>({
    _id: "",
    status: "",
    garmentType: "",
    measurements: {
      chest: 0,
      waist: 0,
      hips: 0,
      length: 0,
      inseam: 0,
      shoulders: 0
    },
    budget: "",
    timeline: "",
    details: "",
    user_id: ""
  });

  const [originalStatus, setOriginalStatus] = createSignal<string>("");
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [isLoading, setIsLoading] = createSignal(true);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  // Fetch the commission data
  const fetchCommission = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      if (!auth.isAuthenticated()) {
        throw new Error("You must be logged in to edit commissions");
      }
      
      const userId = auth.user()?.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Get the commission ID from URL params
      const commissionId = params.id;
      
      if (!commissionId) {
        throw new Error("Commission ID not specified");
      }
      
      // Fetch commission from Supabase
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('id', commissionId)
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Check if the commission belongs to the current user
      if (data.user_id !== userId) {
        throw new Error("You don't have permission to edit this commission");
      }
      
      // Check if the commission can be edited (only pending commissions)
      if (data.status.toLowerCase() !== 'pending') {
        throw new Error(`This commission cannot be edited because its status is "${data.status}"`);
      }
      
      // Store original status
      setOriginalStatus(data.status);
      
      // Map database fields to form fields
      setFormData({
        _id: data.id,
        status: data.status,
        garmentType: data.garment_type,
        measurements: data.measurements || {
          chest: 0,
          waist: 0,
          hips: 0,
          length: 0,
          inseam: 0,
          shoulders: 0
        },
        budget: data.budget,
        timeline: data.timeline,
        details: data.details,
        user_id: data.user_id
      });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData().garmentType) {
      newErrors.garmentType = "Please select a garment type";
    }
    
    if (!formData().budget) {
      newErrors.budget = "Please select a budget range";
    }
    
    if (!formData().timeline) {
      newErrors.timeline = "Please select a timeline";
    }
    
    if (!formData().details) {
      newErrors.details = "Please provide additional details";
    }

    // Validate measurements based on garment type
    const garmentType = formData().garmentType;
    const measurements = formData().measurements;

    if (garmentType === "shirt" || garmentType === "jacket") {
      if (!measurements.chest || measurements.chest <= 0) {
        newErrors["measurements.chest"] = "Required";
      }
      if (!measurements.shoulders || measurements.shoulders <= 0) {
        newErrors["measurements.shoulders"] = "Required";
      }
    } else if (garmentType === "pants") {
      if (!measurements.waist || measurements.waist <= 0) {
        newErrors["measurements.waist"] = "Required";
      }
      if (!measurements.hips || measurements.hips <= 0) {
        newErrors["measurements.hips"] = "Required";
      }
      if (!measurements.length || measurements.length <= 0) {
        newErrors["measurements.length"] = "Required";
      }
      if (!measurements.inseam || measurements.inseam <= 0) {
        newErrors["measurements.inseam"] = "Required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Update commission handler
  const updateCommission = async (e: SubmitEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if user is authenticated before submitting
    if (!auth.isAuthenticated()) {
      toast.error("You must be logged in to update a commission request");
      navigate("/login", { replace: true });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Format the data for PostgreSQL
      const submissionData = {
        garment_type: formData().garmentType,
        measurements: formData().measurements,
        budget: formData().budget,
        timeline: formData().timeline,
        details: formData().details,
        // Keep the original status (don't allow status editing from this form)
        status: originalStatus()
      };
      
      // Update the commission in Supabase
      const { error } = await supabase
        .from('commissions')
        .update(submissionData)
        .eq('id', formData()._id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Commission updated successfully");
      navigate(`/profile/orders/${formData()._id}`);
    } catch (err: any) {
      toast.error("Failed to update commission: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    
    if (name.startsWith("measurements.")) {
      const measurement = name.split(".")[1];
      setFormData({
        ...formData(),
        measurements: {
          ...formData().measurements,
          [measurement]: parseFloat(value) || 0
        }
      });
    } else {
      setFormData({
        ...formData(),
        [name]: value
      });
    }
  };

  const handleSelectChange = (value: string, field: keyof CommissionFormData) => {
    if (field === "garmentType") {
      // Reset measurements when garment type changes
      setFormData({
        ...formData(),
        garmentType: value,
        measurements: {
          chest: 0,
          waist: 0,
          hips: 0,
          length: 0,
          inseam: 0,
          shoulders: 0
        }
      });
    } else {
      setFormData({
        ...formData(),
        [field]: value
      });
    }
  };

  const handleNumberInput = (e: KeyboardEvent) => {
    // Allow only numbers, backspace, delete, tab, arrows, home, end
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', '.'];
    const key = e.key;
    
    // Check if the key is not a number or one of the allowed control keys
    if (!/^[0-9]$/.test(key) && !allowedKeys.includes(key)) {
      e.preventDefault();
    }
  };
  
  // Fetch commission when component mounts
  createEffect(() => {
    if (!auth.isLoading()) {
      if (auth.isAuthenticated()) {
        fetchCommission();
      } else {
        navigate("/login", { replace: true });
      }
    }
  });

  return (
    <main class="min-h-screen bg-gradient-to-b from-emerald-950 to-gray-950 py-10 px-4 sm:px-6">
      <div class="max-w-2xl mx-auto">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, easing: "ease-out" }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(`/profile/orders/${params.id}`)}
            class="mb-6 flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Commission Details
          </button>
          
          {/* Loading State */}
          <Show when={isLoading()}>
            <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 p-10">
              <div class="flex flex-col items-center justify-center py-10">
                <div class="animate-spin h-10 w-10 border-4 border-emerald-500 rounded-full border-t-transparent"></div>
                <span class="mt-4 text-emerald-300">Loading commission data...</span>
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
                <h3 class="text-xl text-white font-medium mb-2">Error Loading Commission</h3>
                <p class="text-emerald-300/70 text-center mb-6">{error()}</p>
                <div class="flex space-x-4">
                  <button
                    onClick={() => fetchCommission()}
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/profile/orders')}
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow transition-all"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </Show>
          
          {/* Edit Form */}
          <Show when={!isLoading() && !error()}>
            <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-emerald-700/20">
              <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">Edit Commission Request</h2>
                <p class="text-emerald-200/70">Update your garment details</p>
              </div>

              <form onSubmit={updateCommission} class="space-y-6">
                {/* Garment Type */}
                <div>
                  <label for="garmentType" class="block text-emerald-100 font-medium mb-2 text-sm">
                    Garment Type
                  </label>
                  <div class="relative">
                    <select
                      id="garmentType"
                      name="garmentType"
                      value={formData().garmentType}
                      onChange={(e) => handleSelectChange(e.target.value, "garmentType")}
                      class={`w-full pl-3 pr-10 py-3 bg-emerald-950/50 border ${errors().garmentType ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none`}
                    >
                      <option value="" disabled>Select garment type</option>
                      <option value="shirt">Shirt</option>
                      <option value="jacket">Jacket</option>
                      <option value="pants">Pants</option>
                      <option value="other">Other</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <Show when={errors().garmentType}>
                    <p class="text-red-400 text-xs mt-1.5 ml-1">{errors().garmentType}</p>
                  </Show>
                </div>

                {/* Measurements */}
                <div>
                  <label class="block text-emerald-100 font-medium mb-3 text-sm">Measurements (inches)</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chest */}
                    <div>
                      <label for="chest" class="block text-emerald-200/80 text-xs mb-1">Chest</label>
                      <input
                        id="chest"
                        name="measurements.chest"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData().measurements.chest}
                        onInput={handleInputChange}
                        onKeyDown={handleNumberInput}
                        disabled={formData().garmentType === "pants"}
                        class={`w-full pl-3 pr-3 py-2 bg-emerald-950/50 border ${errors()["measurements.chest"] ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="0.0"
                      />
                      <Show when={errors()["measurements.chest"]}>
                        <p class="text-red-400 text-xs mt-1">{errors()["measurements.chest"]}</p>
                      </Show>
                    </div>
                    
                    {/* Shoulders */}
                    <div>
                      <label for="shoulders" class="block text-emerald-200/80 text-xs mb-1">Shoulders</label>
                      <input
                        id="shoulders"
                        name="measurements.shoulders"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData().measurements.shoulders}
                        onInput={handleInputChange}
                        onKeyDown={handleNumberInput}
                        disabled={formData().garmentType === "pants"}
                        class={`w-full pl-3 pr-3 py-2 bg-emerald-950/50 border ${errors()["measurements.shoulders"] ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="0.0"
                      />
                      <Show when={errors()["measurements.shoulders"]}>
                        <p class="text-red-400 text-xs mt-1">{errors()["measurements.shoulders"]}</p>
                      </Show>
                    </div>
                    
                    {/* Waist */}
                    <div>
                      <label for="waist" class="block text-emerald-200/80 text-xs mb-1">Waist</label>
                      <input
                        id="waist"
                        name="measurements.waist"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData().measurements.waist}
                        onInput={handleInputChange}
                        onKeyDown={handleNumberInput}
                        disabled={formData().garmentType === "shirt" || formData().garmentType === "jacket"}
                        class={`w-full pl-3 pr-3 py-2 bg-emerald-950/50 border ${errors()["measurements.waist"] ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="0.0"
                      />
                      <Show when={errors()["measurements.waist"]}>
                        <p class="text-red-400 text-xs mt-1">{errors()["measurements.waist"]}</p>
                      </Show>
                    </div>
                    
                    {/* Hips */}
                    <div>
                      <label for="hips" class="block text-emerald-200/80 text-xs mb-1">Hips</label>
                      <input
                        id="hips"
                        name="measurements.hips"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData().measurements.hips}
                        onInput={handleInputChange}
                        onKeyDown={handleNumberInput}
                        disabled={formData().garmentType === "shirt" || formData().garmentType === "jacket"}
                        class={`w-full pl-3 pr-3 py-2 bg-emerald-950/50 border ${errors()["measurements.hips"] ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="0.0"
                      />
                      <Show when={errors()["measurements.hips"]}>
                        <p class="text-red-400 text-xs mt-1">{errors()["measurements.hips"]}</p>
                      </Show>
                    </div>
                    
                    {/* Length */}
                    <div>
                      <label for="length" class="block text-emerald-200/80 text-xs mb-1">Length</label>
                      <input
                        id="length"
                        name="measurements.length"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData().measurements.length}
                        onInput={handleInputChange}
                        onKeyDown={handleNumberInput}
                        disabled={formData().garmentType === "shirt" || formData().garmentType === "jacket"}
                        class={`w-full pl-3 pr-3 py-2 bg-emerald-950/50 border ${errors()["measurements.length"] ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="0.0"
                      />
                      <Show when={errors()["measurements.length"]}>
                        <p class="text-red-400 text-xs mt-1">{errors()["measurements.length"]}</p>
                      </Show>
                    </div>
                    
                    {/* Inseam */}
                    <div>
                      <label for="inseam" class="block text-emerald-200/80 text-xs mb-1">Inseam</label>
                      <input
                        id="inseam"
                        name="measurements.inseam"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData().measurements.inseam}
                        onInput={handleInputChange}
                        onKeyDown={handleNumberInput}
                        disabled={formData().garmentType === "shirt" || formData().garmentType === "jacket"}
                        class={`w-full pl-3 pr-3 py-2 bg-emerald-950/50 border ${errors()["measurements.inseam"] ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="0.0"
                      />
                      <Show when={errors()["measurements.inseam"]}>
                        <p class="text-red-400 text-xs mt-1">{errors()["measurements.inseam"]}</p>
                      </Show>
                    </div>
                  </div>
                </div>

                {/* Budget Range */}
                <div>
                  <label for="budget" class="block text-emerald-100 font-medium mb-2 text-sm">
                    Budget Range
                  </label>
                  <div class="relative">
                    <select
                      id="budget"
                      name="budget"
                      value={formData().budget}
                      onChange={(e) => handleSelectChange(e.target.value, "budget")}
                      class={`w-full pl-3 pr-10 py-3 bg-emerald-950/50 border ${errors().budget ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none`}
                    >
                      <option value="" disabled>Select budget range</option>
                      <option value="100-300">$100 - $300</option>
                      <option value="300-500">$300 - $500</option>
                      <option value="500-1000">$500 - $1000</option>
                      <option value="1000+">$1000+</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <Show when={errors().budget}>
                    <p class="text-red-400 text-xs mt-1.5 ml-1">{errors().budget}</p>
                  </Show>
                </div>

                {/* Timeline */}
                <div>
                  <label for="timeline" class="block text-emerald-100 font-medium mb-2 text-sm">
                    Timeline
                  </label>
                  <div class="relative">
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData().timeline}
                      onChange={(e) => handleSelectChange(e.target.value, "timeline")}
                      class={`w-full pl-3 pr-10 py-3 bg-emerald-950/50 border ${errors().timeline ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none`}
                    >
                      <option value="" disabled>Select timeline</option>
                      <option value="1-2weeks">1-2 weeks</option>
                      <option value="3-4weeks">3-4 weeks</option>
                      <option value="1-2months">1-2 months</option>
                      <option value="flexible">Flexible</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <Show when={errors().timeline}>
                    <p class="text-red-400 text-xs mt-1.5 ml-1">{errors().timeline}</p>
                  </Show>
                </div>

                {/* Additional Details */}
                <div>
                  <label for="details" class="block text-emerald-100 font-medium mb-2 text-sm">
                    Additional Details
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData().details}
                    onInput={handleInputChange}
                    placeholder="Tell us more about your vision..."
                    class={`w-full h-32 px-3 py-2 bg-emerald-950/50 border ${errors().details ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none`}
                  ></textarea>
                  <Show when={errors().details}>
                    <p class="text-red-400 text-xs mt-1.5 ml-1">{errors().details}</p>
                  </Show>
                </div>

                {/* Form Actions */}
                <div class="flex justify-end space-x-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => navigate(`/profile/orders/${params.id}`)}
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow transition-all"
                  >
                    Cancel
                  </button>
                  
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
              </form>
            </div>
          </Show>
        </Motion.div>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}