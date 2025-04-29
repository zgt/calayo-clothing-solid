import { useLocation } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import ProfileDropdown from "./ProfileDropdown";

export default function Nav() {
  const location = useLocation();
  
  // Check if we're on the login page
  const isLoginPage = createMemo(() => location.pathname === "/login");
  
  // Active link style helper
  const active = (path: string) =>
    path === location.pathname 
      ? "border-emerald-400 text-white font-medium" 
      : "border-transparent text-emerald-100/80 hover:border-emerald-400/70 hover:text-white";
  
  return (
    <nav class="bg-gradient-to-r from-emerald-900 to-emerald-800 shadow-md">
      <div class="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Left side - Logo and Navigation links */}
        <div class="flex items-center space-x-6">
          {/* Logo */}
          <a href="/" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <span class="ml-2 text-xl font-bold text-white">Calayo Clothing</span>
          </a>

          {/* Navigation links */}
          <ul class="hidden md:flex items-center space-x-6">
            <li class={`border-b-2 py-2 transition-colors duration-200 ${active("/")}`}>
              <a href="/" class="px-1">Home</a>
            </li>
            <li class={`border-b-2 py-2 transition-colors duration-200 ${active("/commissions")}`}>
              <a href="/commissions" class="px-1">Commissions</a>
            </li>
            <li class={`border-b-2 py-2 transition-colors duration-200 ${active("/features")}`}>
              <a href="/features" class="px-1">Features</a>
            </li>
            <li class={`border-b-2 py-2 transition-colors duration-200 ${active("/about")}`}>
              <a href="/about" class="px-1">About me</a>
            </li>
          </ul>
        </div>

        {/* Right side - Profile */}
        <div class="flex items-center">
          <Show when={!isLoginPage()}>
            <div class="flex items-center">
              <ProfileDropdown />
            </div>
          </Show>
          
          {/* Mobile menu button */}
          <button class="ml-4 md:hidden rounded-lg p-2 text-emerald-100 hover:bg-emerald-700/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile navigation menu - hidden by default */}
      <div class="hidden md:hidden bg-emerald-800 pb-3">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <a href="/" class={`block px-3 py-2 rounded-md ${location.pathname === "/" ? "bg-emerald-700 text-white" : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"}`}>
            Home
          </a>
          <a href="/about" class={`block px-3 py-2 rounded-md ${location.pathname === "/about" ? "bg-emerald-700 text-white" : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"}`}>
            About
          </a>
          <a href="/features" class={`block px-3 py-2 rounded-md ${location.pathname === "/features" ? "bg-emerald-700 text-white" : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"}`}>
            Features
          </a>
          <a href="/contact" class={`block px-3 py-2 rounded-md ${location.pathname === "/contact" ? "bg-emerald-700 text-white" : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white"}`}>
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
}