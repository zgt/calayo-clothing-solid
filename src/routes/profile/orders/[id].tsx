import { createSignal, createEffect, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { toast, Toaster } from "solid-toast";
import { useNavigate, useParams } from "@solidjs/router";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";

// Type for commission data from database
interface Commission {
  id: string;
  status: string;
  garment_type: string;
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
  created_at: string;
  updated_at: string;
}

export default function CommissionDetails() {
  const params = useParams();
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [commission, setCommission] = createSignal<Commission | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  
  // Function to fetch commission details
  const fetchCommissionDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      if (!auth.isAuthenticated()) {
        throw new Error("You must be logged in to view commission details");
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
        throw new Error("You don't have permission to view this commission");
      }
      
      setCommission(data as Commission);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for better readability
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'in progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };
  
  // Format budget string
  const formatBudget = (budget: string) => {
    if (!budget) return "N/A";
    
    if (budget.includes('-')) {
      const [min, max] = budget.split('-');
      return `$${min} - $${max}`;
    } else if (budget.includes('+')) {
      return `$${budget.replace('+', '')}+`;
    }
    
    return `$${budget}`;
  };
  
  // Format timeline string
  const formatTimeline = (timeline: string) => {
    if (!timeline) return "N/A";
    
    // Replace patterns like "1-2weeks" with "1-2 weeks"
    return timeline
      .replace(/(\d+)(\w+)/, '$1 $2')
      .replace(/(\d+)-(\d+)(\w+)/, '$1-$2 $3');
  };
  
  // Cancel commission handler
  const cancelCommission = async () => {
    if (!commission()) return;
    
    if (!confirm("Are you sure you want to cancel this commission request? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status: 'Cancelled' })
        .eq('id', commission()?.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setCommission({
        ...commission()!,
        status: 'Cancelled'
      });
      
      toast.success("Commission cancelled successfully");
    } catch (err: any) {
      toast.error("Failed to cancel commission: " + err.message);
    }
  };
  
  // Fetch commission details when component mounts
  createEffect(() => {
    if (!auth.isLoading()) {
      if (auth.isAuthenticated()) {
        fetchCommissionDetails();
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
          {/* Back Button */}
          <button
            onClick={() => navigate('/profile/orders')}
            class="mb-6 flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Commissions
          </button>
          
          {/* Loading State */}
          <Show when={isLoading()}>
            <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 p-10">
              <div class="flex flex-col items-center justify-center py-10">
                <div class="animate-spin h-10 w-10 border-4 border-emerald-500 rounded-full border-t-transparent"></div>
                <span class="mt-4 text-emerald-300">Loading commission details...</span>
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
                    onClick={() => fetchCommissionDetails()}
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
          
          {/* Commission Details */}
          <Show when={!isLoading() && !error() && commission()}>
            <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden">
              <div class="border-b border-emerald-700/30 px-6 py-4 flex justify-between items-center">
                <h1 class="text-2xl font-bold text-white">
                  Commission Details
                </h1>
                <span class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(commission()!.status)}`}>
                  {commission()!.status}
                </span>
              </div>
              
              <div class="p-6">
                {/* Main Info Section */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h2 class="text-emerald-400 text-sm font-medium uppercase tracking-wider mb-3">Commission Information</h2>
                    
                    <div class="space-y-3">
                      <div>
                        <div class="text-emerald-300/70 text-xs">Garment Type</div>
                        <div class="text-emerald-100 font-medium capitalize">{commission()!.garment_type}</div>
                      </div>
                      
                      <div>
                        <div class="text-emerald-300/70 text-xs">Budget Range</div>
                        <div class="text-emerald-100 font-medium">{formatBudget(commission()!.budget)}</div>
                      </div>
                      
                      <div>
                        <div class="text-emerald-300/70 text-xs">Timeline</div>
                        <div class="text-emerald-100 font-medium">{formatTimeline(commission()!.timeline)}</div>
                      </div>
                      
                      <div>
                        <div class="text-emerald-300/70 text-xs">Request Date</div>
                        <div class="text-emerald-100 font-medium">{formatDate(commission()!.created_at)}</div>
                      </div>
                      
                      <div>
                        <div class="text-emerald-300/70 text-xs">Last Updated</div>
                        <div class="text-emerald-100 font-medium">{formatDate(commission()!.updated_at)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 class="text-emerald-400 text-sm font-medium uppercase tracking-wider mb-3">Measurements</h2>
                    
                    <div class="grid grid-cols-2 gap-3">
                      <Show when={commission()!.garment_type === 'shirt' || commission()!.garment_type === 'jacket'}>
                        <div>
                          <div class="text-emerald-300/70 text-xs">Chest</div>
                          <div class="text-emerald-100 font-medium">
                            {commission()!.measurements.chest > 0 ? `${commission()!.measurements.chest} inches` : 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div class="text-emerald-300/70 text-xs">Shoulders</div>
                          <div class="text-emerald-100 font-medium">
                            {commission()!.measurements.shoulders > 0 ? `${commission()!.measurements.shoulders} inches` : 'N/A'}
                          </div>
                        </div>
                      </Show>
                      
                      <Show when={commission()!.garment_type === 'pants'}>
                        <div>
                          <div class="text-emerald-300/70 text-xs">Waist</div>
                          <div class="text-emerald-100 font-medium">
                            {commission()!.measurements.waist > 0 ? `${commission()!.measurements.waist} inches` : 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div class="text-emerald-300/70 text-xs">Hips</div>
                          <div class="text-emerald-100 font-medium">
                            {commission()!.measurements.hips > 0 ? `${commission()!.measurements.hips} inches` : 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div class="text-emerald-300/70 text-xs">Length</div>
                          <div class="text-emerald-100 font-medium">
                            {commission()!.measurements.length > 0 ? `${commission()!.measurements.length} inches` : 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div class="text-emerald-300/70 text-xs">Inseam</div>
                          <div class="text-emerald-100 font-medium">
                            {commission()!.measurements.inseam > 0 ? `${commission()!.measurements.inseam} inches` : 'N/A'}
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>
                
                {/* Details Section */}
                <div class="mb-8">
                  <h2 class="text-emerald-400 text-sm font-medium uppercase tracking-wider mb-3">Additional Details</h2>
                  <div class="bg-emerald-950/50 border border-emerald-700/30 rounded-lg p-4">
                    <p class="text-emerald-100 whitespace-pre-wrap">
                      {commission()!.details || "No additional details provided."}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div class="flex flex-wrap gap-4 justify-end border-t border-emerald-700/30 pt-6">
                  <button
                    onClick={() => navigate(`/profile/orders/edit/${commission()!.id}`)}
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={commission()!.status !== 'Pending'}
                  >
                    <span class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit Commission
                    </span>
                  </button>
                  
                  <button
                    onClick={cancelCommission}
                    class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={commission()!.status === 'Cancelled' || commission()!.status === 'Completed'}
                  >
                    <span class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                      Cancel Commission
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </Show>
        </Motion.div>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}