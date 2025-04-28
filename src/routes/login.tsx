// @ts-ignore
import { createSignal } from "solid-js";
import { toast, Toaster } from "solid-toast";
import { Motion } from "solid-motionone";
import { useSupabase } from 'solid-supabase';
import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { DOMElement } from "solid-js/jsx-runtime";
import { useSession, getSession } from "vinxi/http";
import { useAuth } from "~/context/auth";




export default function Login() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [errors, setErrors] = createSignal({
    email: "",
    password: "",
    general: ""
  });

  const supabase = useSupabase(); 
  const navigate = useNavigate(); 

  const auth = useAuth();



  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      general: ""
    };

    if (!email().trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password().trim()) {
      newErrors.password = "Password is required";
    } else if (password().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error !== "");
  };

  const loginUser = async (e: SubmitEvent & { currentTarget: HTMLFormElement; target: DOMElement; }) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email(),
            password: password(),
        });
      
        if (error) {
            console.log(error)
            setErrors(prev => ({ ...prev, general: error.message }));
            toast.error("Login failed: " + error.message);
            return;
        }

        if (data) {
            toast.success("Login successful!");
            navigate("/");
        }
        } catch (err) {
        setErrors(prev => ({ ...prev, general: "An unexpected error occurred" }));
        toast.error("Login failed: An unexpected error occurred");
        } finally {
        setIsLoading(false);
    }
  }

  return (
    <main class="min-h-screen bg-gradient-to-b from-emerald-950 to-gray-950 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, easing: "ease-out" }}
          class="-mt-20 bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-emerald-700/20"
        >
          <div class="text-center mb-8">
            {/* Logo could go here */}
            <div class="h-16 w-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p class="text-emerald-200/70">Sign in to continue to your account</p>
          </div>

          <form onSubmit={(e) => loginUser(e)} class="space-y-6">
            <Show when={errors().general}>
              <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-200 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span>{errors().general}</span>
              </div>
            </Show>

            <div>
              <label for="email" class="block text-emerald-100 font-medium mb-2 text-sm">
                Email Address
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email()}
                  onInput={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  class={`w-full pl-10 pr-4 py-3 bg-emerald-950/50 border ${errors().email ? "border-red-500" : "border-emerald-700/30 focus:border-emerald-500/50"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                />
              </div>
              <Show when={errors().email}>
                <p class="text-red-400 text-xs mt-1.5 ml-1">{errors().email}</p>
              </Show>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="password" class="block text-emerald-100 font-medium text-sm">
                  Password
                </label>
                <a href="/forgot-password" class="text-emerald-400 hover:text-emerald-300 text-xs font-medium hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500/70" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password()}
                  onInput={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  class={`w-full pl-10 pr-4 py-3 bg-emerald-950/50 border ${errors().password ? "border-red-500" : "border-emerald-700/30 focus:border-emerald-500/50"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                />
              </div>
              <Show when={errors().password}>
                <p class="text-red-400 text-xs mt-1.5 ml-1">{errors().password}</p>
              </Show>
            </div>

            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                class="h-4 w-4 rounded border-emerald-700/40 bg-emerald-950/70 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
              />
              <label for="remember-me" class="ml-2 block text-sm text-emerald-200/90">
                Remember me for 30 days
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading()}
              class="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center transition-all duration-200 hover:shadow-emerald-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Show 
                when={isLoading()}
                fallback={
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
                    </svg>
                    Sign In
                  </>
                }
              >
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </Show>
            </button>

            {/* <div class="relative flex items-center justify-center mt-8 mb-4">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-emerald-800/30"></div>
              </div>
              <div class="relative px-4 bg-emerald-900/30 text-xs text-emerald-400 font-medium">
                OR CONTINUE WITH
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button
                type="button"
                class="flex items-center justify-center px-4 py-2.5 border border-emerald-700/30 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/20 text-emerald-100 transition-all"
              >
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.11 18.63 6.67 16.69 5.75 14.03H2.08V16.89C3.9 20.5 7.67 23 12 23Z" fill="#34A853"/>
                  <path d="M5.75 14.02C5.52 13.35 5.39 12.63 5.39 11.89C5.39 11.15 5.52 10.43 5.75 9.76V6.9H2.08C1.39 8.41 1 10.11 1 11.89C1 13.67 1.39 15.37 2.08 16.88L5.75 14.02Z" fill="#FBBC05"/>
                  <path d="M12 5.15C13.67 5.15 15.18 5.73 16.37 6.86L19.5 3.73C17.46 1.83 14.97 0.75 12 0.75C7.67 0.75 3.9 3.25 2.08 6.86L5.75 9.72C6.67 7.06 9.11 5.15 12 5.15Z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                class="flex items-center justify-center px-4 py-2.5 border border-emerald-700/30 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/20 text-emerald-100 transition-all"
              >
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.63 16.2C16.247 17.188 15.723 18.034 15.06 18.738C14.142 19.776 13.385 20.276 12.789 20.276C12.3 20.276 11.718 20.116 11.043 19.793C10.367 19.47 9.756 19.311 9.207 19.311C8.627 19.311 8 19.47 7.325 19.793C6.65 20.116 6.11 20.284 5.705 20.3C5.141 20.333 4.576 20.034 4.01 19.401C3.298 18.646 2.732 17.741 2.31 16.688C1.855 15.566 1.628 14.473 1.628 13.408C1.628 12.161 1.937 11.094 2.556 10.209C3.04 9.5 3.672 8.939 4.454 8.528C5.235 8.117 6.071 7.904 6.96 7.888C7.565 7.888 8.329 8.073 9.254 8.44C10.178 8.807 10.77 8.991 11.026 8.991C11.22 8.991 11.883 8.775 13.016 8.341C14.082 7.94 14.983 7.798 15.721 7.913C17.233 8.152 18.368 8.838 19.122 9.971C17.785 10.8 17.129 11.994 17.155 13.55C17.178 14.754 17.576 15.749 18.347 16.534C18.688 16.876 19.065 17.143 19.478 17.335C19.172 17.669 18.851 17.976 18.513 18.257C17.86 18.806 17.149 19.08 16.38 19.08C15.83 19.08 15.228 18.921 14.571 18.598C13.915 18.275 13.354 18.115 12.891 18.115C12.408 18.115 11.834 18.275 11.169 18.598C10.503 18.921 9.969 19.08 9.566 19.08C8.948 19.08 8.37 18.806 7.835 18.257L16.63 16.2ZM12.496 7.32C12.496 7.435 12.488 7.55 12.47 7.664C12.453 7.778 12.427 7.9 12.394 8.031C12.36 8.162 12.31 8.3 12.243 8.445C12.175 8.59 12.108 8.72 12.04 8.834C11.811 9.17 11.532 9.457 11.203 9.694C10.874 9.932 10.52 10.051 10.15 10.051C10.117 10.051 10.075 10.045 10.023 10.036C9.972 10.027 9.912 10.016 9.845 10C9.876 9.131 10.117 8.343 10.569 7.639C11.02 6.935 11.6 6.432 12.308 6.129C12.374 6.228 12.432 6.334 12.481 6.447C12.53 6.56 12.57 6.673 12.604 6.787C12.637 6.901 12.662 7.015 12.679 7.129C12.697 7.244 12.705 7.35 12.705 7.448C12.689 7.464 12.628 7.464 12.522 7.448C12.415 7.432 12.496 7.383 12.496 7.32Z"/>
                </svg>
                Apple
              </button>
            </div> */}

            <div class="text-center mt-6">
              <p class="text-emerald-200/70">
                Don't have an account?{" "}
                <a href="/register" class="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors">
                  Create account
                </a>
              </p>
            </div>
          </form>
        </Motion.div>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}