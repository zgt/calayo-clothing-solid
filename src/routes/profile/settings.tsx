import { createSignal, createEffect, Show, onMount } from "solid-js";
import { Motion } from "solid-motionone";
import { toast, Toaster } from "solid-toast";
import { useNavigate, useLocation } from "@solidjs/router";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";
import ProfileMeasurements from "~/components/ProfileMeasurements";
import {
  NotificationSettings,
  PrivacySettings,
  saveNotificationSettings,
  savePrivacySettings,
  fetchNotificationSettings,
  fetchPrivacySettings,
  enableTwoFactorAuth,
  signOutAllDevices,
  deleteMeasurementData,
  deactivateAccount,
  deleteAccount
} from "~/api/user/saveUserSettings";

export default function ProfileSettings() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = useSupabase();

  // Get hash from URL for tab navigation
  const initialTab = () => {
    const hash = location.hash.replace('#', '');
    return ['account', 'measurements', 'notifications', 'privacy'].includes(hash) ? hash : 'measurements';
  };

  const [activeTab, setActiveTab] = createSignal(initialTab());
  const [loading, setLoading] = createSignal(false);
  const [userData, setUserData] = createSignal({
    fullName: '',
    email: ''
  });
  const [newPassword, setNewPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [currentPassword, setCurrentPassword] = createSignal('');
  const [notificationSettings, setNotificationSettings] = createSignal<NotificationSettings>({
    emailUpdates: true,
    commissionUpdates: true,
    promotions: false
  });
  const [privacySettings, setPrivacySettings] = createSignal<PrivacySettings>({
    profileVisibility: 'private',
    dataUsage: true
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = createSignal(false);
  const [confirmAction, setConfirmAction] = createSignal<() => Promise<void>>(() => Promise.resolve());
  const [confirmMessage, setConfirmMessage] = createSignal('');
  const [confirmTitle, setConfirmTitle] = createSignal('');

  // Handle tab change and update URL hash
  const changeTab = (tab: string) => {
    setActiveTab(tab);
    navigate(`#${tab}`, { replace: true });
    // Scroll to top when changing tabs
    window.scrollTo(0, 0);
  };

  // Load user data from auth
  const loadUserData = async () => {
    if (!auth.isAuthenticated() || !auth.user()) return;

    setUserData({
      fullName: auth.user()?.user_metadata?.full_name || '',
      email: auth.user()?.email || ''
    });

    // Load notification settings
    try {
      const userId = auth.user()?.id;
      if (userId) {
        const notifSettings = await fetchNotificationSettings(userId);
        setNotificationSettings(notifSettings);

        const privSettings = await fetchPrivacySettings(userId);
        setPrivacySettings(privSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // Show confirmation dialog
  const showConfirmDialog = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmDialogOpen(true);
  };

  // Handle confirmation dialog confirm
  const handleConfirm = async () => {
    setConfirmDialogOpen(false);
    await confirmAction()();
  };

  // Handle confirmation dialog cancel
  const handleCancel = () => {
    setConfirmDialogOpen(false);
  };

  // Update user profile
  const updateProfile = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!auth.isAuthenticated()) {
      toast.error("You need to be logged in to update your profile");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: userData().fullName }
      });

      if (error) throw new Error(error.message);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Validate password
  const validatePassword = () => {
    if (newPassword().length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (newPassword() !== confirmPassword()) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  // Update password
  const updatePassword = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword()
      });

      if (error) throw new Error(error.message);

      toast.success("Password updated successfully");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // Save notification settings
  const handleSaveNotificationSettings = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!auth.isAuthenticated() || !auth.user()) {
      toast.error("You need to be logged in to update your settings");
      return;
    }

    const userId = auth.user()?.id;
    if (!userId) return;

    setLoading(true);

    try {
      await saveNotificationSettings(userId, notificationSettings());
      toast.success("Notification preferences saved");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setLoading(false);
    }
  };

  // Save privacy settings
  const handleSavePrivacySettings = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!auth.isAuthenticated() || !auth.user()) {
      toast.error("You need to be logged in to update your settings");
      return;
    }

    const userId = auth.user()?.id;
    if (!userId) return;

    setLoading(true);

    try {
      await savePrivacySettings(userId, privacySettings());
      toast.success("Privacy settings saved");
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast.error("Failed to save privacy settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle enable 2FA
  const handleEnable2FA = async () => {
    if (!auth.isAuthenticated() || !auth.user()) return;

    const userId = auth.user()?.id;
    if (!userId) return;

    showConfirmDialog(
      "Enable Two-Factor Authentication",
      "Are you sure you want to enable two-factor authentication? You will need to set up an authenticator app.",
      async () => {
        try {
          await enableTwoFactorAuth(userId);
          toast.success("Two-factor authentication enabled");
        } catch (error) {
          console.error("Error enabling 2FA:", error);
          toast.error("Failed to enable two-factor authentication");
        }
      }
    );
  };

  // Handle sign out all devices
  const handleSignOutAllDevices = async () => {
    if (!auth.isAuthenticated() || !auth.user()) return;

    const userId = auth.user()?.id;
    if (!userId) return;

    showConfirmDialog(
      "Sign Out of All Devices",
      "Are you sure you want to sign out from all devices? You will need to sign in again on all your devices.",
      async () => {
        try {
          await signOutAllDevices(userId);
          toast.success("Successfully signed out from all devices");
          // Sign out from current device
          await auth.signOut();
          navigate("/login", { replace: true });
        } catch (error) {
          console.error("Error signing out from all devices:", error);
          toast.error("Failed to sign out from all devices");
        }
      }
    );
  };

  // Handle delete measurements
  const handleDeleteMeasurements = async () => {
    if (!auth.isAuthenticated() || !auth.user()) return;

    const userId = auth.user()?.id;
    if (!userId) return;

    showConfirmDialog(
      "Delete Measurement Data",
      "Are you sure you want to delete all your measurements data? This action cannot be undone.",
      async () => {
        try {
          await deleteMeasurementData(userId);
          toast.success("Measurement data deleted successfully");
          // Reload the page to refresh measurements component
          window.location.reload();
        } catch (error) {
          console.error("Error deleting measurements:", error);
          toast.error("Failed to delete measurement data");
        }
      }
    );
  };

  // Handle deactivate account
  const handleDeactivateAccount = async () => {
    if (!auth.isAuthenticated() || !auth.user()) return;

    const userId = auth.user()?.id;
    if (!userId) return;

    showConfirmDialog(
      "Deactivate Account",
      "Are you sure you want to deactivate your account? You will no longer be able to access your commissions or data.",
      async () => {
        try {
          await deactivateAccount(userId);
          toast.success("Account deactivation initiated");
          // Sign the user out
          await auth.signOut();
          navigate("/login", { replace: true });
        } catch (error) {
          console.error("Error deactivating account:", error);
          toast.error("Failed to deactivate account");
        }
      }
    );
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!auth.isAuthenticated() || !auth.user()) return;

    const userId = auth.user()?.id;
    if (!userId) return;

    showConfirmDialog(
      "Delete Account Permanently",
      "Are you sure you want to permanently delete your account? All your data will be permanently removed. This action cannot be undone.",
      async () => {
        try {
          await deleteAccount(userId);
          toast.success("Account deletion initiated");
          // Sign the user out
          await auth.signOut();
          navigate("/login", { replace: true });
        } catch (error) {
          console.error("Error deleting account:", error);
          toast.error("Failed to delete account");
        }
      }
    );
  };

  // Check if user is signed in when component mounts
  onMount(() => {
    // If hash is present in URL, set active tab
    if (location.hash) {
      const hash = location.hash.replace('#', '');
      if (['account', 'measurements', 'notifications', 'privacy'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  });

  // Load user data when auth state changes
  createEffect(() => {
    if (!auth.isLoading()) {
      if (auth.isAuthenticated()) {
        loadUserData();
      } else {
        toast.error("You must be logged in to view your profile settings");
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
          <h1 class="text-3xl font-bold text-white mb-8">Profile Settings</h1>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <div class="md:col-span-4">
              <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden sticky top-6">
                <div class="p-4 border-b border-emerald-700/30">
                  <h2 class="text-lg font-medium text-white">Settings</h2>
                </div>
                <nav class="p-2">
                  <button
                    onClick={() => changeTab('account')}
                    class={`w-full flex items-center px-3 py-2 rounded-lg text-emerald-200 ${activeTab() === 'account' ? 'bg-emerald-800/30 font-medium' : 'hover:bg-emerald-800/20 hover:text-white'} transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                    Account
                  </button>
                  <button
                    onClick={() => changeTab('measurements')}
                    class={`w-full flex items-center px-3 py-2 rounded-lg text-emerald-200 ${activeTab() === 'measurements' ? 'bg-emerald-800/30 font-medium' : 'hover:bg-emerald-800/20 hover:text-white'} transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-6 0a1 1 0 100 2h.01a1 1 0 100-2H4z" clip-rule="evenodd" />
                    </svg>
                    Measurements
                  </button>
                  <button
                    onClick={() => changeTab('notifications')}
                    class={`w-full flex items-center px-3 py-2 rounded-lg text-emerald-200 ${activeTab() === 'notifications' ? 'bg-emerald-800/30 font-medium' : 'hover:bg-emerald-800/20 hover:text-white'} transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    Notifications
                  </button>
                  <button
                    onClick={() => changeTab('privacy')}
                    class={`w-full flex items-center px-3 py-2 rounded-lg text-emerald-200 ${activeTab() === 'privacy' ? 'bg-emerald-800/30 font-medium' : 'hover:bg-emerald-800/20 hover:text-white'} transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                    </svg>
                    Privacy & Security
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div class="md:col-span-8">
              {/* Account Settings */}
              <Show when={activeTab() === 'account'}>
                <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden mb-8">
                  <div class="border-b border-emerald-700/30 px-6 py-4">
                    <h2 class="text-xl font-bold text-white">Account Settings</h2>
                    <p class="text-emerald-300/70 text-sm mt-1">
                      Manage your account information
                    </p>
                  </div>
                  <div class="p-6">
                    <form onSubmit={updateProfile} class="space-y-6">
                      <div>
                        <label for="fullName" class="block text-emerald-100 font-medium mb-2 text-sm">
                          Full Name
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={userData().fullName}
                          onInput={(e) => setUserData({ ...userData(), fullName: e.currentTarget.value })}
                          class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="Your full name"
                        />
                      </div>

                      <div>
                        <label for="email" class="block text-emerald-100 font-medium mb-2 text-sm">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={userData().email}
                          class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all opacity-70"
                          disabled
                        />
                        <p class="text-emerald-400/70 text-xs mt-1.5 ml-1">Email cannot be changed</p>
                      </div>

                      <div class="pt-4">
                        <button
                          type="submit"
                          disabled={loading()}
                          class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center transition-all duration-200 hover:shadow-emerald-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <Show
                            when={loading()}
                            fallback="Save Changes"
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

                    <div class="mt-8 pt-8 border-t border-emerald-700/30">
                      <h3 class="text-lg font-medium text-white mb-4">Change Password</h3>
                      <form onSubmit={updatePassword} class="space-y-6">
                        <div>
                          <label for="currentPassword" class="block text-emerald-100 font-medium mb-2 text-sm">
                            Current Password
                          </label>
                          <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword()}
                            onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                            class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="••••••••"
                          />
                        </div>

                        <div>
                          <label for="newPassword" class="block text-emerald-100 font-medium mb-2 text-sm">
                            New Password
                          </label>
                          <input
                            id="newPassword"
                            type="password"
                            value={newPassword()}
                            onInput={(e) => setNewPassword(e.currentTarget.value)}
                            class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="••••••••"
                          />
                          <p class="text-emerald-400/70 text-xs mt-1.5 ml-1">Password must be at least 6 characters</p>
                        </div>

                        <div>
                          <label for="confirmPassword" class="block text-emerald-100 font-medium mb-2 text-sm">
                            Confirm New Password
                          </label>
                          <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword()}
                            onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                            class="w-full pl-3 pr-3 py-2 bg-emerald-950/50 border border-emerald-700/30 rounded-lg shadow-sm text-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            placeholder="••••••••"
                          />
                        </div>

                        <div class="pt-4">
                          <button
                            type="submit"
                            disabled={loading() || !currentPassword() || !newPassword() || !confirmPassword()}
                            class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 flex items-center justify-center transition-all duration-200 hover:shadow-emerald-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            <Show
                              when={loading()}
                              fallback="Update Password"
                            >
                              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </Show>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Show>

              {/* Measurements */}
              <Show when={activeTab() === 'measurements'}>
                <ProfileMeasurements />
              </Show>

              {/* Notification Settings */}
              <Show when={activeTab() === 'notifications'}>
                <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-700/20 overflow-hidden mb-8">
                  <div class="border-b border-emerald-700/30 px-6 py-4">
                    <h2 class="text-xl font-bold text-white">Notification Settings</h2>
                    <p class="text-emerald-300/70 text-sm mt-1">
                      Manage your notification preferences
                    </p>
                  </div>
                  <div class="p-6">
                    <form onSubmit={handleSaveNotificationSettings} class="space-y-6">
                      <div class="space-y-4">
                        <div class="flex items-center">
                          <input
                            id="emailUpdates"
                            type="checkbox"
                            checked={notificationSettings().emailUpdates}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings(),
                              emailUpdates: e.currentTarget.checked
                            })}
                            class="h-4 w-4 rounded border-emerald-700/40 bg-emerald-950/70 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
                          />
                          <label for="emailUpdates" class="ml-3 block text-emerald-100">
                            <span class="font-medium">Email Updates</span>
                            <p class="text-emerald-300/70 text-sm">Receive general updates about your account</p>
                          </label>
                        </div>

                        <div class="flex items-center">
                          <input
                            id="commissionUpdates"
                            type="checkbox"
                            checked={notificationSettings().commissionUpdates}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings(),
                              commissionUpdates: e.currentTarget.checked
                            })}
                            class="h-4 w-4 rounded border-emerald-700/40 bg-emerald-950/70 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
                          />
                          <label for="commissionUpdates" class="ml-3 block text-emerald-100">
                            <span class="font-medium">Commission Updates</span>
                            <p class="text-emerald-300/70 text-sm">Get notified when your commission status changes</p>
                          </label>
                        </div>

                        <div class="flex items-center">
                          <input
                            id="promotions"
                            type="checkbox"
                            checked={notificationSettings().promotions}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings(),
                              promotions: e.currentTarget.checked
                            })}
                            class="h-4 w-4 rounded border-emerald-700/40 bg-emerald-950/70 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
                          />
                          <label for="promotions" class="ml-3 block text-emerald-100">
                            <span class="font-medium">Promotions & Offers</span>
                            <p class="text-emerald-300/70 text-sm">Receive promotional emails about special offers</p>
                          </label>
                        </div>
                      </div>

                      <div class="pt-4">
                        <button
                          type="submit"
                          disabled={loading()}
                          class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Motion.div>
      </div>
    </main>
  );
}