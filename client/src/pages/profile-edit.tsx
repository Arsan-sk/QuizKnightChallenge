import React, { useState, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useLocation } from "wouter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileEditPage() {
  const { profile, isLoading, error, updateProfileMutation } = useProfile();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    profilePicture: "",
    bio: "",
    branch: "",
    year: "",
    department: "",
    specialization: ""
  });

  // Initialize form with profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        username: profile.username || "",
        profilePicture: profile.profilePicture || "",
        bio: profile.bio || "",
        branch: profile.branch || "",
        year: profile.year || "",
        department: profile.department || "",
        specialization: profile.specialization || ""
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
      await updateProfileMutation.mutateAsync(formData);
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
    if (formData.displayName) {
      return formData.displayName
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
    <div className="container py-6">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleImageClick}
                >
                  <Avatar className="h-24 w-24 border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                    <AvatarImage src={formData.profilePicture} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Click to upload profile picture
                </p>
                <div className="w-full max-w-[250px] space-y-2">
                  <Label htmlFor="profilePicture">Or enter image URL</Label>
                  <Input
                    id="profilePicture"
                    name="profilePicture"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="Your name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.bio.length}/500
              </p>
            </div>
            
            {isStudent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="branch">Branch</Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => handleSelectChange("branch", value)}
                  >
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent>
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
                
                <div className="grid gap-3">
                  <Label htmlFor="year">Year of Study</Label>
                  <Select
                    value={formData.year}
                    onValueChange={(value) => handleSelectChange("year", value)}
                  >
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="1st">1st Year</SelectItem>
                      <SelectItem value="2nd">2nd Year</SelectItem>
                      <SelectItem value="3rd">3rd Year</SelectItem>
                      <SelectItem value="4th">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {isTeacher && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
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
                
                <div className="grid gap-3">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    placeholder="Your area of expertise"
                    value={formData.specialization}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/profile")}
              disabled={updateProfileMutation.isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateProfileMutation.isLoading}
            >
              {updateProfileMutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 