import { createSignal, createEffect, For, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { toast, Toaster } from "solid-toast";
import { useNavigate } from "@solidjs/router";
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

export default function UserCommissions() {
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [commissions, setCommissions] = createSignal<Commission[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  
  // Function to fetch user's commissions
  const fetchCommissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      if (!auth.isAuthenticated()) {
        throw new Error("You must be logged in to view your commissions");
      }
      
      const userId = auth.user()?.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Fetch commissions from Supabase where user_id matches
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      setCommissions(data as Commission[]);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Status badge color mapping
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
  
  // Format date for better readability
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // View details of a specific commission
  const viewCommissionDetails = (id: string) => {
    navigate(`/profile/orders/${id}`);
  };
  
  // Fetch user's commissions when component mounts
  createEffect(() => {
    if (!auth.isLoading()) {
      if (auth.isAuthenticated()) {
        fetchCommissions();
      } else {
        navigate("/login", { replace: true });
      }
    }
  });

  return (
    <main class="min-h-screen bg-gradient-to-b from-emerald-950 to-gray-950 py-10 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, easing: "ease-out" }}
        >
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-white">My Commission Requests</h1>
            <button
              onClick={() => navigate('/commissions')}
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 transition-all"
            >
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                New Commission
              </span>
            </button>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden">
            {/* Loading State */}
            <Show when={isLoading()}>
              <div class="flex items-center justify-center py-20">
                <div class="animate-spin h-10 w-10 border-4 border-emerald-500 rounded-full border-t-transparent"></div>
                <span class="ml-3 text-emerald-300">Loading your commissions...</span>
              </div>
            </Show>
            
            {/* Error State */}
            <Show when={!isLoading() && error()}>
              <div class="flex flex-col items-center justify-center py-16 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl text-white font-medium mb-2">Error Loading Commissions</h3>
                <p class="text-emerald-300/70 text-center mb-6">{error()}</p>
                <button
                  onClick={() => fetchCommissions()}
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 transition-all"
                >
                  Try Again
                </button>
              </div>
            </Show>
            
            {/* No Commissions State */}
            <Show when={!isLoading() && !error() && commissions().length === 0}>
              <div class="flex flex-col items-center justify-center py-16 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-emerald-500/60 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 class="text-xl text-white font-medium mb-2">No Commission Requests Yet</h3>
                <p class="text-emerald-300/70 text-center mb-6">You haven't placed any commission requests yet. Start by creating your first request.</p>
                <button
                  onClick={() => navigate('/commissions')}
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 transition-all"
                >
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Create Your First Commission
                  </span>
                </button>
              </div>
            </Show>
            
            {/* Commissions Table */}
            <Show when={!isLoading() && !error() && commissions().length > 0}>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-emerald-700/30">
                      <th class="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Garment</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Budget</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Timeline</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-emerald-800/30">
                    <For each={commissions()}>
                      {(commission) => (
                        <tr class="hover:bg-emerald-800/10 transition-colors">
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-200">
                            {formatDate(commission.created_at)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-200 capitalize">
                            {commission.garment_type}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-200">
                            ${commission.budget.replace('-', ' - $')}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-200">
                            {commission.timeline.replace(/(\d+)(\w+)/, '$1 $2')}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(commission.status)}`}>
                              {commission.status}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-200">
                            <button 
                              onClick={() => viewCommissionDetails(commission.id)}
                              class="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </Motion.div>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}