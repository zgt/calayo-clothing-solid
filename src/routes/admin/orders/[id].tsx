import { createSignal, createEffect, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { toast, Toaster } from "solid-toast";
import { useNavigate, useParams } from "@solidjs/router";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";
import MessageChat from "~/components/MessageChat";

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
  user_email?: string;
  user_name?: string;
}

export default function AdminCommissionDetails() {
  const params = useParams();
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [commission, setCommission] = createSignal<Commission | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [showMessages, setShowMessages] = createSignal(true);
  const [adminId, setAdminId] = createSignal('');
  const [adminName, setAdminName] = createSignal('Admin');
  
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
      
      // Get the admin ID from environment variables
      const adminIdValue = import.meta.env.VITE_ADMIN_ID;
      setAdminId(adminIdValue);
      
      // Verify the current user is an admin
      if (userId !== adminIdValue) {
        throw new Error("You don't have permission to access this page");
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
      
      // Fetch user information for this commission
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', data.user_id)
        .single();
      
      if (userError) {
        console.error("Error fetching user data:", userError);
      }
      
      // Combine commission and user data
      const completeCommission = {
        ...data,
        user_email: userData?.email || 'Unknown email',
        user_name: userData?.full_name || 'Unknown user'
      };
      
      setCommission(completeCommission);
      
      // Get admin's name
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', adminIdValue)
        .single();
        
      if (adminData) {
        setAdminName(adminData.full_name || 'Admin');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      
      // Redirect to admin dashboard if not authorized
      if (err.message.includes("permission")) {
        setTimeout(() => {
          navigate("/admin/orders", { replace: true });
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update commission status
  const updateCommissionStatus = async (newStatus: string) => {
    if (!commission()) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', commission()!.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setCommission({
        ...commission()!,
        status: newStatus
      });
      
      toast.success(`Commission status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    } finally {
      setIsUpdating(false);
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
  
  // Toggle message panel
  const toggleMessages = () => {
    setShowMessages(!showMessages());
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
    <main class="min-h-screen bg-gradient-to-b from-purple-950 to-gray-950 py-10 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, easing: "ease-out" }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/orders')}
            class="mb-6 flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to All Commissions
          </button>
          
          {/* Loading State */}
          <Show when={isLoading()}>
            <div class="bg-gradient-to-br from-purple-900/30 to-purple-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-700/20 p-10">
              <div class="flex flex-col items-center justify-center py-10">
                <div class="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"></div>
                <span class="mt-4 text-purple-300">Loading commission details...</span>
              </div>
            </div>
          </Show>
          
          {/* Error State */}
          <Show when={!isLoading() && error()}>
            <div class="bg-gradient-to-br from-purple-900/30 to-purple-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-700/20 p-10">
              <div class="flex flex-col items-center justify-center py-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl text-white font-medium mb-2">Error Loading Commission</h3>
                <p class="text-purple-300/70 text-center mb-6">{error()}</p>
                <div class="flex space-x-4">
                  <button
                    onClick={() => fetchCommissionDetails()}
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/admin/orders')}
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
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Commission Details Panel */}
              <div class="lg:col-span-2 bg-gradient-to-br from-purple-900/30 to-purple-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-700/20 overflow-hidden">
                <div class="border-b border-purple-700/30 px-6 py-4 flex justify-between items-center">
                  <h1 class="text-2xl font-bold text-white">
                    Commission Details
                  </h1>
                  <div class="relative inline-block">
                    <button
                      type="button"
                      disabled={isUpdating()}
                      class={`inline-flex justify-between items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(commission()!.status)} ${isUpdating() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={(e) => {
                        const dropdown = document.getElementById('status-dropdown');
                        dropdown?.classList.toggle('hidden');
                        e.stopPropagation();
                        
                        // Close dropdown when clicking outside
                        const closeDropdown = () => {
                          dropdown?.classList.add('hidden');
                          document.removeEventListener('click', closeDropdown);
                        };
                        
                        document.addEventListener('click', closeDropdown);
                      }}
                    >
                      <Show
                        when={!isUpdating()}
                        fallback={
                          <div class="flex items-center">
                            <div class="animate-spin h-3 w-3 border-2 border-current rounded-full border-t-transparent mr-1"></div>
                            Updating...
                          </div>
                        }
                      >
                        <>
                          {commission()!.status}
                          <svg class="-mr-1 ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                        </>
                      </Show>
                    </button>
                    <div
                      id="status-dropdown"
                      class="hidden origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
                    >
                      <div class="py-1" role="none">
                        <button
                          onClick={() => updateCommissionStatus('Pending')}
                          class="text-yellow-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => updateCommissionStatus('In Progress')}
                          class="text-blue-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => updateCommissionStatus('Completed')}
                          class="text-green-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => updateCommissionStatus('Cancelled')}
                          class="text-red-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                        >
                          Cancelled
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="p-6">
                  {/* Customer Information */}
                  <div class="mb-8">
                    <h2 class="text-purple-400 text-sm font-medium uppercase tracking-wider mb-3">Customer Information</h2>
                    
                    <div class="bg-purple-950/50 border border-purple-700/30 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div class="text-purple-300/70 text-xs">Customer Name</div>
                        <div class="text-purple-100 font-medium">{commission()!.user_name}</div>
                      </div>
                      
                      <div>
                        <div class="text-purple-300/70 text-xs">Customer Email</div>
                        <div class="text-purple-100 font-medium">{commission()!.user_email}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Main Info Section */}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h2 class="text-purple-400 text-sm font-medium uppercase tracking-wider mb-3">Commission Information</h2>
                      
                      <div class="space-y-3">
                        <div>
                          <div class="text-purple-300/70 text-xs">Garment Type</div>
                          <div class="text-purple-100 font-medium capitalize">{commission()!.garment_type}</div>
                        </div>
                        
                        <div>
                          <div class="text-purple-300/70 text-xs">Budget Range</div>
                          <div class="text-purple-100 font-medium">{formatBudget(commission()!.budget)}</div>
                        </div>
                        
                        <div>
                          <div class="text-purple-300/70 text-xs">Timeline</div>
                          <div class="text-purple-100 font-medium">{formatTimeline(commission()!.timeline)}</div>
                        </div>
                        
                        <div>
                          <div class="text-purple-300/70 text-xs">Request Date</div>
                          <div class="text-purple-100 font-medium">{formatDate(commission()!.created_at)}</div>
                        </div>
                        
                        <div>
                          <div class="text-purple-300/70 text-xs">Last Updated</div>
                          <div class="text-purple-100 font-medium">{formatDate(commission()!.updated_at)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h2 class="text-purple-400 text-sm font-medium uppercase tracking-wider mb-3">Measurements</h2>
                      
                      <div class="grid grid-cols-2 gap-3">
                        <Show when={commission()!.garment_type === 'shirt' || commission()!.garment_type === 'jacket'}>
                          <div>
                            <div class="text-purple-300/70 text-xs">Chest</div>
                            <div class="text-purple-100 font-medium">
                              {commission()!.measurements.chest > 0 ? `${commission()!.measurements.chest} inches` : 'N/A'}
                            </div>
                          </div>
                          
                          <div>
                            <div class="text-purple-300/70 text-xs">Shoulders</div>
                            <div class="text-purple-100 font-medium">
                              {commission()!.measurements.shoulders > 0 ? `${commission()!.measurements.shoulders} inches` : 'N/A'}
                            </div>
                          </div>
                        </Show>
                        
                        <Show when={commission()!.garment_type === 'pants'}>
                          <div>
                            <div class="text-purple-300/70 text-xs">Waist</div>
                            <div class="text-purple-100 font-medium">
                              {commission()!.measurements.waist > 0 ? `${commission()!.measurements.waist} inches` : 'N/A'}
                            </div>
                          </div>
                          
                          <div>
                            <div class="text-purple-300/70 text-xs">Hips</div>
                            <div class="text-purple-100 font-medium">
                              {commission()!.measurements.hips > 0 ? `${commission()!.measurements.hips} inches` : 'N/A'}
                            </div>
                          </div>
                          
                          <div>
                            <div class="text-purple-300/70 text-xs">Length</div>
                            <div class="text-purple-100 font-medium">
                              {commission()!.measurements.length > 0 ? `${commission()!.measurements.length} inches` : 'N/A'}
                            </div>
                          </div>
                          
                          <div>
                            <div class="text-purple-300/70 text-xs">Inseam</div>
                            <div class="text-purple-100 font-medium">
                              {commission()!.measurements.inseam > 0 ? `${commission()!.measurements.inseam} inches` : 'N/A'}
                            </div>
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Section */}
                  <div class="mb-6">
                    <h2 class="text-purple-400 text-sm font-medium uppercase tracking-wider mb-3">Additional Details</h2>
                    <div class="bg-purple-950/50 border border-purple-700/30 rounded-lg p-4">
                      <p class="text-purple-100 whitespace-pre-wrap">
                        {commission()!.details || "No additional details provided."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div class="flex flex-wrap gap-4 justify-between border-t border-purple-700/30 pt-6">
                    <div>
                      <button
                        onClick={toggleMessages}
                        class="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-lg shadow transition-all flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                        </svg>
                        {showMessages() ? "Hide Messages" : "Show Messages"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Message Panel - Shown based on state */}
              <div class="lg:col-span-1">
                <Show when={showMessages()}>
                  <MessageChat 
                    commissionId={commission()!.id}
                    adminId={adminId()}
                    adminName={adminName()}
                    userName={commission()!.user_name || 'Customer'}
                  />
                </Show>
                <Show when={!showMessages()}>
                  <div class="bg-gradient-to-br from-purple-900/20 to-purple-950/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-700/20 p-6 flex flex-col items-center justify-center h-[300px] text-center">
                    <div class="bg-purple-700/20 p-4 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <h3 class="text-lg font-medium text-purple-100 mb-2">Customer Chat</h3>
                    <p class="text-purple-300/70 mb-4">
                      Communicate with the customer about their commission
                    </p>
                    <button
                      onClick={toggleMessages}
                      class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow transition-all flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                      </svg>
                      Open Chat
                    </button>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </Motion.div>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}