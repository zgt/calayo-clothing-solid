import { createSignal, createEffect, Show, For, onCleanup } from "solid-js";
import SignIn from "./SignIn";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "~/context/auth"; // Import the auth context

const userNavigation = [
  { name: 'Your Profile', href: '/home/profile', id: "1" },
  { name: 'Your Orders', href: '/home/profile/orders', id: "2" },
  { name: 'Settings', href: '#', id: "3" }
];

export interface UserData {
  id: string | undefined,
  name: string | undefined,
  email: string | undefined,
  role: string | undefined
}

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const auth = useAuth(); // Use the auth context
  
  const [isOpen, setIsOpen] = createSignal(false);
  const dropdownRef = createSignal(null);

  // Get user info from auth context
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

  const logOut = async () => {
    await auth.signOut(); // Use signOut from auth context
    setIsOpen(false);
    navigate("/login", { replace: true });
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen());
  };
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event: { target: any; }) => {
    if (dropdownRef[0] && !dropdownRef[0]().contains(event.target)) {
      setIsOpen(false);
    }
  };
  
  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });
  });

  return (
    <Show
      when={auth.isAuthenticated()} // Use isAuthenticated from auth context
      fallback={<SignIn />}
    >
      <div class="relative" ref={dropdownRef[1]}>
        {/* Profile Button */}
        <button
          onClick={toggleDropdown}
          type="button"
          class="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
          id="user-menu-button"
          aria-expanded={isOpen()}
          aria-haspopup="true"
        >
          <span class="absolute -inset-1.5" />
          <span class="sr-only">Open user menu</span>
          <img 
            alt="Profile" 
            src="https://i.pinimg.com/736x/58/9c/8c/589c8cb207fd529d2a3cb5e4d012434d.jpg"
            class="h-8 w-8 rounded-full"
          />
        </button>
        
        {/* Dropdown Menu */}
        <Show when={isOpen()}>
          <div 
            class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
            tabindex="-1"
          >
            {/* Show user info at the top of dropdown */}
            <div class="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
              <div class="font-medium">{getUserData()?.name || 'User'}</div>
              <div class="text-xs text-gray-500 truncate">{getUserData()?.email}</div>
            </div>
            
            <For each={userNavigation}>
              {(item) => (
                <a
                  href={item.href}
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabindex="-1"
                  id={`user-menu-item-${item.id}`}
                >
                  {item.name}
                </a>
              )}
            </For>
            
            <button
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              tabindex="-1"
              onClick={logOut}
            >
              Sign out
            </button>
          </div>
        </Show>
      </div>
    </Show>
  );
}