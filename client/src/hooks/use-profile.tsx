import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  name?: string;
  username?: string;
  profilePicture?: string;
  branch?: string;
  year?: string;
  bio?: string;
}

interface ProfileContextType {
  profile: ProfileData | null;
  isLoading: boolean;
  error: Error | null;
  updateProfileMutation: any;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: profile,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest("GET", "/api/user/profile");
      return await res.json();
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["/api/user/profile"], updatedProfile);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
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
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
} 