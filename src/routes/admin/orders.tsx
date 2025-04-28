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
  // Added properties for admin view
  user_email: string;
  user_name: string;
}

export default function AdminCommissions() {
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [commissions, setCommissions] = createSignal<Commission[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [statusFilter, setStatusFilter] = createSignal<string | null>(null);
  const [searchTerm, setSearchTerm] = createSignal("");
  
  // Function to fetch all commissions - admin view
  const fetchCommissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      if (!auth.isAuthenticated()) {
        throw new Error("You must be logged in to view this page");
      }
      
      const userId = auth.user()?.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Check if the user ID matches the admin ID from environment variables
      const adminId = import.meta.env.VITE_ADMIN_ID;
      
      if (userId !== adminId) {
        throw new Error("Unauthorized: Admin access required");
      }
      
      // Fetch all commissions
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Fetch user information for each commission
      const commissionWithUsers = await Promise.all(
        data.map(async (commission) => {
          // Get user profile information
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', commission.user_id)
            .single();
            
          
          return {
            ...commission,
            user_email: userData?.email || 'Unknown',
            user_name: userData?.full_name || 'Unknown User'
          };
        })
      );
      
      setCommissions(commissionWithUsers as Commission[]);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      
      // Redirect to dashboard if not admin
      if (err.message.includes("Unauthorized")) {
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update commission status
  const updateCommissionStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setCommissions(prev => 
        prev.map(comm => 
          comm.id === id ? { ...comm, status: newStatus } : comm
        )
      );
      
      toast.success(`Commission status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
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
    navigate(`/admin/commissions/${id}`);
  };
  
  // Filter commissions based on status and search term
  const filteredCommissions = () => {
    return commissions().filter(commission => {
      // Status filter
      if (statusFilter() && commission.status.toLowerCase() !== statusFilter()?.toLowerCase()) {
        return false;
      }
      
      // Search term filter - check user name, email, garment type
      if (searchTerm()) {
        const search = searchTerm().toLowerCase();
        return (
          commission.user_name.toLowerCase().includes(search) ||
          commission.user_email.toLowerCase().includes(search) ||
          commission.garment_type.toLowerCase().includes(search) ||
          commission.id.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  };
  
  // Fetch commissions when component mounts
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
    <main class="min-h-screen bg-gradient-to-b from-purple-950 to-gray-950 py-10 px-4 sm:px-6">
      <div class="max-w-7xl mx-auto">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, easing: "ease-out" }}
        >
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-white">Admin Commission Management</h1>
            <div class="flex space-x-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow-lg transition-all"
              >
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Dashboard
                </span>
              </button>
              <button
                onClick={() => fetchCommissions()}
                class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-900/30 transition-all"
              >
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  </svg>
                  Refresh
                </span>
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div class="bg-purple-900/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-700/20 shadow-lg">
            <div class="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div class="flex-1">
                <label for="search" class="block text-sm font-medium text-purple-300 mb-1">Search</label>
                <div class="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by name, email, garment..."
                    value={searchTerm()}
                    onInput={(e) => setSearchTerm(e.currentTarget.value)}
                    class="w-full bg-purple-950/50 border border-purple-700/30 text-white rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-400 absolute left-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <label for="status" class="block text-sm font-medium text-purple-300 mb-1">Filter by Status</label>
                <select
                  id="status"
                  value={statusFilter() || ""}
                  onChange={(e) => setStatusFilter(e.currentTarget.value || null)}
                  class="bg-purple-950/50 border border-purple-700/30 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="md:self-end">
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    setSearchTerm("");
                  }}
                  class="px-4 py-2 bg-purple-700/50 hover:bg-purple-600/70 text-white font-medium rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-900/30 to-purple-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-700/20 overflow-hidden">
            {/* Loading State */}
            <Show when={isLoading()}>
              <div class="flex items-center justify-center py-20">
                <div class="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"></div>
                <span class="ml-3 text-purple-300">Loading commissions...</span>
              </div>
            </Show>
            
            {/* Error State */}
            <Show when={!isLoading() && error()}>
              <div class="flex flex-col items-center justify-center py-16 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl text-white font-medium mb-2">Error Loading Commissions</h3>
                <p class="text-purple-300/70 text-center mb-6">{error()}</p>
                <button
                  onClick={() => fetchCommissions()}
                  class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-900/30 transition-all"
                >
                  Try Again
                </button>
              </div>
            </Show>
            
            {/* No Commissions State */}
            <Show when={!isLoading() && !error() && filteredCommissions().length === 0}>
              <div class="flex flex-col items-center justify-center py-16 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-purple-500/60 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 class="text-xl text-white font-medium mb-2">No Commission Requests Found</h3>
                <p class="text-purple-300/70 text-center mb-6">
                  {searchTerm() || statusFilter() 
                    ? "No commissions match your current filters. Try changing or clearing your filters."
                    : "There are no commission requests in the system yet."
                  }
                </p>
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    setSearchTerm("");
                  }}
                  class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-900/30 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </Show>
            
            {/* Commissions Table */}
            <Show when={!isLoading() && !error() && filteredCommissions().length > 0}>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-purple-700/30">
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">ID</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">Customer</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">Garment</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">Budget</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">Timeline</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-4 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-purple-800/30">
                    <For each={filteredCommissions()}>
                      {(commission) => (
                        <tr class="hover:bg-purple-800/10 transition-colors">
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                            <span class="font-mono">{commission.id.substring(0, 8)}...</span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                            {formatDate(commission.created_at)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                            <div class="flex flex-col">
                              <span>{commission.user_name}</span>
                              <span class="text-purple-400 text-xs">{commission.user_email}</span>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-200 capitalize">
                            {commission.garment_type}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                            ${commission.budget.replace('-', ' - $')}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                            {commission.timeline.replace(/(\d+)(\w+)/, '$1 $2')}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <div class="relative inline-block w-full text-left">
                              <div>
                                <button
                                  type="button"
                                  class={`inline-flex justify-between w-full items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(commission.status)}`}
                                  id={`status-menu-${commission.id}`}
                                  aria-expanded="true"
                                  aria-haspopup="true"
                                  onClick={(e) => {
                                    const menu = document.getElementById(`status-dropdown-${commission.id}`);
                                    menu?.classList.toggle('hidden');
                                    e.stopPropagation();
                                    
                                    // Close other menus
                                    document.querySelectorAll('[id^="status-dropdown-"]').forEach(el => {
                                      if (el.id !== `status-dropdown-${commission.id}`) {
                                        el.classList.add('hidden');
                                      }
                                    });
                                    
                                    // Close menu when clicking outside
                                    const closeMenu = () => {
                                      menu?.classList.add('hidden');
                                      document.removeEventListener('click', closeMenu);
                                    };
                                    
                                    document.addEventListener('click', closeMenu);
                                  }}
                                >
                                  {commission.status}
                                  <svg class="-mr-1 ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                              <div
                                id={`status-dropdown-${commission.id}`}
                                class="hidden origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby={`status-menu-${commission.id}`}
                              >
                                <div class="py-1" role="none">
                                  <button
                                    onClick={() => updateCommissionStatus(commission.id, 'pending')}
                                    class="text-yellow-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                                    role="menuitem"
                                  >
                                    Pending
                                  </button>
                                  <button
                                    onClick={() => updateCommissionStatus(commission.id, 'in progress')}
                                    class="text-blue-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                                    role="menuitem"
                                  >
                                    In Progress
                                  </button>
                                  <button
                                    onClick={() => updateCommissionStatus(commission.id, 'completed')}
                                    class="text-green-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                                    role="menuitem"
                                  >
                                    Completed
                                  </button>
                                  <button
                                    onClick={() => updateCommissionStatus(commission.id, 'cancelled')}
                                    class="text-red-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                                    role="menuitem"
                                  >
                                    Cancelled
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                            <button 
                              onClick={() => viewCommissionDetails(commission.id)}
                              class="text-purple-400 hover:text-purple-300 font-medium transition-colors"
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