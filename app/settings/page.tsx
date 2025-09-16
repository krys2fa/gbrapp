"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/app/components/layout/header";
import { Button } from "@/app/components/ui/button";
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Loader,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { withClientAuth } from "@/app/lib/with-client-auth";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  isActive: boolean;
  profileCompletion: number;
  accountAge: number;
  lastLogin: string | null;
  lastLoginFormatted: string | null;
  createdAt: string;
  updatedAt: string;
}

function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const router = useRouter();
  const { user: authUser, token, isAuthenticated } = useAuth();

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Check if user is authenticated
        if (!isAuthenticated || !token) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const userData = await response.json();
        const profileData = userData.user || userData; // Handle both response formats
        setUserProfile(profileData);

        // Update notifications state with user's preferences
        setNotifications({
          email: profileData.emailNotifications || false,
          push: false, // Not implemented yet
          sms: profileData.smsNotifications || false,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load profile"
        );
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router, isAuthenticated, token]);

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Password change handlers
  const handlePasswordFormChange = (
    field: keyof typeof passwordForm,
    value: string
  ) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validatePasswordForm = () => {
    if (!passwordForm.currentPassword) {
      toast.error("Current password is required");
      return false;
    }
    if (!passwordForm.newPassword) {
      toast.error("New password is required");
      return false;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return false;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setPasswordChangeLoading(true);

      // Check authentication
      if (!isAuthenticated || !token) {
        toast.error("Authentication required. Please log in again.");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }

      toast.success("Password changed successfully");

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header
          title="Settings"
          icon={<User className="h-5 w-5" />}
          subtitle="Manage profile and security preferences."
        />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header
          title="Settings"
          icon={<User className="h-5 w-5" />}
          subtitle="Manage profile, security and application preferences."
        />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">
              Error Loading Profile
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Settings"
        icon={<User className="h-5 w-5" />}
        subtitle="Manage profile, security and application preferences."
      />

      <main className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <Button variant="outline" className="mt-3 text-sm">
                    Change Photo
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={userProfile?.name || ""}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        defaultValue={userProfile?.phone || ""}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={userProfile?.email || ""}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your email address"
                    />
                  </div>

                  {/* Profile Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Role
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white capitalize">
                        {userProfile?.role || "N/A"}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Profile Completion
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {userProfile?.profileCompletion || 0}%
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Account Age
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {userProfile?.accountAge || 0} days
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Security Settings
              </h2>
            </div>
            <div className="p-6">
              {/* Account Security Overview */}
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Account Security Status
                  </span>
                </div>
                <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <div>✓ Strong password protection enabled</div>
                  <div>
                    ✓ Last login:{" "}
                    {userProfile?.lastLogin
                      ? new Date(userProfile.lastLogin).toLocaleDateString()
                      : "Never"}
                  </div>
                  <div>✓ Account verification: Complete</div>
                </div>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Change Password
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        handlePasswordFormChange(
                          "currentPassword",
                          e.target.value
                        )
                      }
                      placeholder="Enter your current password"
                      className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      required
                      disabled={passwordChangeLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={passwordChangeLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          handlePasswordFormChange(
                            "newPassword",
                            e.target.value
                          )
                        }
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        required
                        minLength={8}
                        disabled={passwordChangeLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={passwordChangeLoading}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum 8 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          handlePasswordFormChange(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        required
                        disabled={passwordChangeLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={passwordChangeLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Password requirements: minimum 8 characters, different from
                    current password
                  </div>
                  <Button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordChangeLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Notification Settings */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {key} Notifications
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive notifications via {key}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() =>
                        handleNotificationChange(
                          key as keyof typeof notifications
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div> */}

          {/* Appearance Settings */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <Palette className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Appearance
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Light", "Dark", "System"].map((theme) => (
                    <button
                      key={theme}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {theme}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div> */}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

export default withClientAuth(SettingsPage);
