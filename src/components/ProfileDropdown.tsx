import { createSignal, createEffect, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";
import SignIn from "./SignIn";

export default function ProfileDropdown() {
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = createSignal(false);
  const [isAdmin, setIsAdmin] = createSignal(false);
  
  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(!isOpen());
  
  // Close dropdown when clicking outside
  const handleClickOutside = (e) => {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      setIsOpen(false);
    }
  };

  const getUserData = () => {
    // Only compute user data if user exists
    if (!auth.user()) return null;
    
    return {
      id: auth.user()?.id,
      name: auth.user()?.user_metadata?.full_name,
      email: auth.user()?.email,
      role: auth.user()?.role
    };
  };                
  
  // Sign out function
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error instanceof Error ? error.message : String(error));
    }
  };
  
  // Navigate to login page
  const handleSignIn = () => {
    navigate("/login");
  };
  
  // Check if user is admin
  const checkAdminStatus = () => {
    if (auth.isAuthenticated()) {
      const userId = auth.user()?.id;
      const adminId = import.meta.env.VITE_ADMIN_ID;
      
      setIsAdmin(userId === adminId);
    }
  };
  
  // Add/remove event listener for clicks outside dropdown
  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
  
  // Check admin status on component mount
  createEffect(() => {
    if (!auth.isLoading()) {
      checkAdminStatus();
    }
  });
  
  return (
    <div class="relative" id="profile-dropdown">
      {/* Show different UI based on authentication status */}
      <Show 
        when={auth.isAuthenticated()} 
        fallback={<SignIn />}
      >
        <button
          onClick={toggleDropdown}
          class="flex items-center space-x-2 focus:outline-none"
          aria-expanded={isOpen()}
          aria-haspopup="true"
        >
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-medium shadow-lg">
            {auth.user()?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class={`h-5 w-5 text-emerald-300 transition-transform duration-200 ${isOpen() ? 'rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        
        {/* Dropdown Menu - Only shown when authenticated and dropdown is open */}
        <Show when={isOpen()}>
          <div 
            class="absolute right-0 mt-2 w-48 bg-gradient-to-br from-gray-900 to-emerald-950 rounded-lg shadow-xl py-1 border border-emerald-800/30 backdrop-blur-sm z-10"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu"
          >
              <div class="px-4 py-2 text-sm text-gray-300 border-b border-emerald-800/30">
                <div class="font-medium">{getUserData()?.name || 'User'}</div>
                <div class="text-xs text-gray-400 truncate">{getUserData()?.email}</div>
              </div>
            
            <a
              href="/profile"
              class="block px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-800/20 hover:text-white transition-colors"
              role="menuitem"
            >
              Your Profile
            </a>
            
            <a
              href="/profile/orders"
              class="block px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-800/20 hover:text-white transition-colors"
              role="menuitem"
            >
              Your Commissions
            </a>
            
            <a
              href="/profile/settings"
              class="block px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-800/20 hover:text-white transition-colors"
              role="menuitem"
            >
              Settings
            </a>
            
            {/* Admin Navigation - Only shown if user is admin */}
            <Show when={isAdmin()}>
              <div class="border-t border-emerald-800/30 pt-1 mt-1">
                <a
                  href="/admin/orders"
                  class="flex items-center px-4 py-2 text-sm text-purple-300 hover:bg-purple-800/20 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
                  </svg>
                  Admin Dashboard
                </a>
              </div>
            </Show>
            
            <div class="border-t border-emerald-800/30 pt-1 mt-1">
              <button
                onClick={handleSignOut}
                class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                role="menuitem"
              >
                Sign Out
              </button>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}