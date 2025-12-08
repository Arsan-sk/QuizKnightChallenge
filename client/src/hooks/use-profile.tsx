import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Define the structure for the user profile details
interface UserProfile {
  id: number;
  username: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  branch?: string;
  year?: string;
  role: string;
  points: number;
  email?: string;
  achievements?: string[];
  friendIds?: number[];
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
}

// Profile update data structure
interface ProfileUpdateData {
  displayName?: string;
  username?: string;
  profilePicture?: string;
  bio?: string;
  branch?: string;
  year?: string;
}

// Context type for profile operations
type ProfileContextType = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfileMutation: UseMutationResult<UserProfile, Error, ProfileUpdateData>;
  refreshProfile: () => void;
};

// Create the profile context
export const ProfileContext = createContext<ProfileContextType | null>(null);

// Provider component for the profile context
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Query to fetch the user profile - unique cache key per user
  const {
    data: profile,
    error,
    isLoading,
    refetch: refreshProfile,
  } = useQuery<UserProfile | null, Error>({
    queryKey: ["/api/users/me", user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Mutation to update the user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      console.log("Sending profile data to server:", {
        ...profileData,
        profilePicture: profileData.profilePicture ? `[Image data of length: ${profileData.profilePicture.length}]` : null
      });
      const res = await apiRequest("PUT", "/api/users/profile", profileData);
      return await res.json();
    },
    onSuccess: (updatedProfile: UserProfile) => {
      // Update the profile in the cache with user-specific key
      queryClient.setQueryData(["/api/users/me", user?.id], updatedProfile);
      
      // Show success message
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      // Show error message
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <ProfileContext.Provider
      value={{
        profile: profile ?? null,
        isLoading,
        error,
        updateProfileMutation,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

// Hook to use the profile context
export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
} 