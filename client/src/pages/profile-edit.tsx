import React, { useState, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Camera, ArrowLeft, Save, Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileEditPage() {
  const { profile, isLoading, error, updateProfileMutation } = useProfile();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    profilePicture: "",
    bio: "",
    branch: "none",
    year: "none",
    department: "none",
    specialization: "",
  });

  // Initialize form with profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        name: (profile as any).name || "",
        username: profile.username || "",
        email: (profile as any).email || "",
        profilePicture: profile.profilePicture || (profile as any).profileImage || "",
        bio: profile.bio || "",
        branch: profile.branch || "none",
        year: profile.year || "none",
        department: (profile as any).department || "none",
        specialization: (profile as any).specialization || "",
      });
    }
  }, [profile]);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string;
        console.log("Image loaded, type:", typeof imageData, "length:", imageData.length);
        setFormData(prev => ({ ...prev, profilePicture: imageData }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Submitting profile update with image:", formData.profilePicture ? formData.profilePicture.substring(0, 50) + "..." : "No image");
      
      const payload = {
        name: formData.name,
        username: formData.username,
        profilePicture: formData.profilePicture,
        bio: formData.bio,
        branch: formData.branch === "none" ? undefined : formData.branch,
        year: formData.year === "none" ? undefined : formData.year
      };

      await updateProfileMutation.mutateAsync(payload as any);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      });
      navigate("/profile");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load profile data</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              No profile information could be loaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please make sure you are logged in.</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/auth")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = () => {
    if (formData.name) {
      return formData.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return formData.username.substring(0, 2).toUpperCase();
  };

  // Check if user is student or teacher
  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden">
      {/* Gradient background elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-4xl font-bold tracking-tight">Edit Profile</h1>
            <p className="text-zinc-400 mt-2">Update your personal information and preferences</p>
          </motion.div>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          {/* Profile Picture Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1c1c21]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 mb-8 shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              Profile Picture
            </h2>
            
            <div className="flex items-center gap-6">
              {/* Avatar Preview */}
              <div
                onClick={handleImageClick}
                className="relative group cursor-pointer flex-shrink-0"
              >
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden group-hover:border-indigo-500/60 transition-all"
                >
                  {formData.profilePicture ? (
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Avatar className="w-full h-full border-0">
                      <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-2xl font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-xs text-white font-medium">Upload</span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Upload Info */}
              <div className="flex-1">
                <p className="text-sm text-zinc-300 mb-4">
                  Click the avatar to upload a new profile picture, or enter an image URL below.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="profilePicture" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                      Image URL
                    </Label>
                    <Input
                      id="profilePicture"
                      name="profilePicture"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.profilePicture}
                      onChange={handleInputChange}
                      className="bg-[#131316] border-white/10 focus:border-indigo-500/50 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1c1c21]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 mb-8 shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <Label htmlFor="name" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                    Display Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your full name"
                    value={formData.name}
                />
              </div>
              
              <div>
                <Label htmlFor="username" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="bg-[#131316] border-white/10 focus:border-indigo-500/50 rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="bio" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                Bio
              </Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
                className="bg-[#131316] border-white/10 focus:border-indigo-500/50 rounded-lg resize-none"
              />
              <p className="text-xs text-zinc-500 mt-2 text-right">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </motion.div>

          {/* Role-Specific Information */}
          {isStudent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1c1c21]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 mb-8 shadow-xl"
            >
              <h2 className="text-lg font-semibold mb-6">Academic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="branch" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                    Branch
                  </Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => handleSelectChange("branch", value)}
                  >
                    <SelectTrigger id="branch" className="bg-[#131316] border-white/10 focus:border-indigo-500/50">
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c21] border-white/10">
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="CS">Computer Science</SelectItem>
                      <SelectItem value="AIML">AI & Machine Learning</SelectItem>
                      <SelectItem value="DS">Data Science</SelectItem>
                      <SelectItem value="ECS">Electronics & CS</SelectItem>
                      <SelectItem value="ECE">Electronics & Communication</SelectItem>
                      <SelectItem value="CE">Civil Engineering</SelectItem>
                      <SelectItem value="ME">Mechanical Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="year" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                    Year of Study
                  </Label>
                  <Select
                    value={formData.year}
                    onValueChange={(value) => handleSelectChange("year", value)}
                  >
                    <SelectTrigger id="year" className="bg-[#131316] border-white/10 focus:border-indigo-500/50">
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c21] border-white/10">
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="1st">1st Year</SelectItem>
                      <SelectItem value="2nd">2nd Year</SelectItem>
                      <SelectItem value="3rd">3rd Year</SelectItem>
                      <SelectItem value="4th">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {isTeacher && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1c1c21]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 mb-8 shadow-xl"
            >
              <h2 className="text-lg font-semibold mb-6">Professional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="department" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                    Department
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger id="department" className="bg-[#131316] border-white/10 focus:border-indigo-500/50">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c21] border-white/10">
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="CS">Computer Science</SelectItem>
                      <SelectItem value="AIML">AI & Machine Learning</SelectItem>
                      <SelectItem value="DS">Data Science</SelectItem>
                      <SelectItem value="ECS">Electronics & CS</SelectItem>
                      <SelectItem value="ECE">Electronics & Communication</SelectItem>
                      <SelectItem value="CE">Civil Engineering</SelectItem>
                      <SelectItem value="ME">Mechanical Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="specialization" className="text-xs uppercase tracking-wider text-zinc-400 mb-2 block">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    placeholder="Your area of expertise"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="bg-[#131316] border-white/10 focus:border-indigo-500/50 rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile")}
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-[#1c1c21]/50 border-white/10 hover:bg-[#1c1c21]/80 hover:border-white/20 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-[0_0_30px_rgba(99,102,241,0.3)]"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </motion.div>
        </form>
        </div>
      </div>
    </div>
  );
} 