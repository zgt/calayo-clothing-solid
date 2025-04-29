import { createSignal, createEffect, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { toast, Toaster } from "solid-toast";
import { useNavigate } from "@solidjs/router";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";

export default function Settings() {
  const supabase = useSupabase();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = createSignal(false);
  const [isChangingPassword, setIsChangingPassword] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  
  // Form states
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [deleteConfirmation, setDeleteConfirmation] = createSignal("");
  
  // Error states
  const [passwordErrors, setPasswordErrors] = createSignal({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: ""
  });
  
  // Validate password form
  const validatePasswordForm = () => {
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: ""
    };
    
    if (!currentPassword().trim()) {
      errors.currentPassword = "Current password is required";
    }
    
    if (!newPassword().trim()) {
      errors.newPassword = "New password is required";
    } else if (newPassword().length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword().trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (confirmPassword() !== newPassword()) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setPasswordErrors(errors);
    
    return !Object.values(errors).some(error => error !== "");
  };
  
  // Change password
  const changePassword = async (e: SubmitEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Sign in again with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: auth.user()?.email as string,
        password: currentPassword()
      });
      
      if (signInError) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: "Current password is incorrect" }));
        throw new Error("Current password is incorrect");
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword()
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast.success("Password changed successfully");
    } catch (err: any) {
      if (!passwordErrors().currentPassword) {
        toast.error(err.message);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Delete account
  const deleteAccount = async () => {
    if (deleteConfirmation() !== auth.user()?.email) {
      toast.error("Email confirmation doesn't match your email");
      return;
    }
    
    if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      setIsDeleting(true);
      
      try {
        // Delete user data from profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', auth.user()?.id);
          
        if (profileError) {
          throw new Error("Error deleting profile data: " + profileError.message);
        }
        
        // Delete user from auth
        // Note: This might be handled by Supabase via cascading deletes or RLS
        // depending on your setup
        const { error: authError } = await supabase.rpc('delete_user_account');
        
        if (authError) {
          throw new Error("Error deleting account: " + authError.message);
        }
        
        // Sign out
        await auth.signOut();
        
        // Redirect to home
        toast.success("Your account has been successfully deleted");
        navigate("/", { replace: true });
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  // Sign out from all devices
  const signOutAllDevices = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Signed out from all devices");
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check authentication on component mount
  createEffect(() => {
    if (!auth.isLoading() && !auth.isAuthenticated()) {
      navigate("/login", { replace: true });
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
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-white">Account Settings</h1>
            <button
              onClick={() => navigate('/profile')}
              class="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
              </svg>
              Back to Profile
            </button>
          </div>
          
          {/* Change Password Section */}
          <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden mb-8">
            <div class="border-b border-emerald-700/30 p-6">
              <h2 class="text-2xl font-bold text-white">Change Password</h2>
              <p class="text-emerald-200/70 mt-1">Update your password to keep your account secure</p>
            </div>
            
            <form onSubmit={changePassword} class="p-6">
              <div class="space-y-4">
                {/* Current Password */}
                <div>
                  <label for="currentPassword" class="block text-sm font-medium text-emerald-100 mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword()}
                    onInput={(e) => setCurrentPassword(e.target.value)}
                    class={`w-full px-3 py-2 bg-emerald-950/50 border ${passwordErrors().currentPassword ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Enter your current password"
                  />
                  <Show when={passwordErrors().currentPassword}>
                    <p class="text-red-400 text-xs mt-1">{passwordErrors().currentPassword}</p>
                  </Show>
                </div>
                
                {/* New Password */}
                <div>
                  <label for="newPassword" class="block text-sm font-medium text-emerald-100 mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword()}
                    onInput={(e) => setNewPassword(e.target.value)}
                    class={`w-full px-3 py-2 bg-emerald-950/50 border ${passwordErrors().newPassword ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Enter new password"
                  />
                  <Show when={passwordErrors().newPassword}>
                    <p class="text-red-400 text-xs mt-1">{passwordErrors().newPassword}</p>
                  </Show>
                </div>
                
                {/* Confirm New Password */}
                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-emerald-100 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword()}
                    onInput={(e) => setConfirmPassword(e.target.value)}
                    class={`w-full px-3 py-2 bg-emerald-950/50 border ${passwordErrors().confirmPassword ? "border-red-500" : "border-emerald-700/30"} rounded-lg shadow-sm text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Confirm new password"
                  />
                  <Show when={passwordErrors().confirmPassword}>
                    <p class="text-red-400 text-xs mt-1">{passwordErrors().confirmPassword}</p>
                  </Show>
                </div>
              </div>
              
              <div class="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword()}
                  class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center transition-all duration-200 hover:shadow-emerald-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Show 
                    when={isChangingPassword()}
                    fallback={
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2h2l2.757-2.757A6 6 0 0118 8zm-6-4a1 1 0 10-2 0v1H8v2h2v1a1 1 0 102 0v-1h2V5h-2V4z" clip-rule="evenodd" />
                        </svg>
                        Change Password
                      </>
                    }
                  >
                    <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Changing Password...
                  </Show>
                </button>
              </div>
            </form>
          </div>
          
          {/* Session Management Section */}
          <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden mb-8">
            <div class="border-b border-emerald-700/30 p-6">
              <h2 class="text-2xl font-bold text-white">Session Management</h2>
              <p class="text-emerald-200/70 mt-1">Manage your active sessions</p>
            </div>
            
            <div class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium text-emerald-100">Sign out from all devices</h3>
                  <p class="text-emerald-300/70 text-sm mt-1">
                    This will immediately sign you out from all devices where you're currently logged in.
                  </p>
                </div>
                
                <button
                  onClick={signOutAllDevices}
                  disabled={isLoading()}
                  class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Show 
                    when={isLoading()}
                    fallback="Sign Out All Devices"
                  >
                    <svg class="animate-spin -ml-1 mr-2 inline h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </Show>
                </button>
              </div>
            </div>
          </div>
          
          {/* Danger Zone Section */}
          <div class="bg-gradient-to-br from-red-900/30 to-red-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-red-700/20 overflow-hidden">
            <div class="border-b border-red-700/30 p-6">
              <h2 class="text-2xl font-bold text-white">Danger Zone</h2>
              <p class="text-red-200/70 mt-1">These actions are irreversible</p>
            </div>
            
            <div class="p-6">
              <div>
                <h3 class="text-lg font-medium text-red-100">Delete Account</h3>
                <p class="text-red-300/70 text-sm mt-1 mb-4">
                  Once you delete your account, there is no going back. This will permanently delete your profile, 
                  commission requests, and remove all of your information from our servers.
                </p>
                
                <div class="bg-red-950/50 border border-red-700/30 rounded-lg p-4">
                  <p class="text-sm text-red-200 mb-3">
                    Type your email <strong>{auth.user()?.email}</strong> to confirm:
                  </p>
                  
                  <div class="flex flex-col sm:flex-row gap-4">
                    <input
                      type="email"
                      value={deleteConfirmation()}
                      onInput={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Enter your email address"
                      class="flex-1 px-3 py-2 bg-red-950/50 border border-red-700/30 rounded-lg shadow-sm text-red-100 placeholder:text-red-600/50 outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    />
                    
                    <button
                      onClick={deleteAccount}
                      disabled={isDeleting() || deleteConfirmation() !== auth.user()?.email}
                      class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Show 
                        when={isDeleting()}
                        fallback={
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            Delete Account
                          </>
                        }
                      >
                        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </Show>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Motion.div>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}