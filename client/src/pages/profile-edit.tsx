import React from "react";
import { useProfile } from "@/hooks/use-profile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const profileSchema = z.object({
  name: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
  branch: z.string().optional(),
  year: z.string().optional(),
  profilePicture: z.string().url("Invalid URL").optional().or(z.literal(""))
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const { profile, updateProfileMutation } = useProfile();
  const [, navigate] = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      branch: profile?.branch || "",
      year: profile?.year || "",
      profilePicture: profile?.profilePicture || ""
    }
  });

  const watchedProfilePicture = watch("profilePicture");

  const onSubmit = async (data: ProfileFormValues) => {
    await updateProfileMutation.mutateAsync(data);
    navigate("/profile");
  };

  const getAvatarFallback = () => {
    const name = watch("name");
    const username = watch("username");
    
    if (name) return name.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return "U";
  };

  const branchOptions = [
    { value: "CS", label: "Computer Science" },
    { value: "AIML", label: "AI & Machine Learning" },
    { value: "DS", label: "Data Science" },
    { value: "ECS", label: "Electronics & Computer Science" },
    { value: "ECE", label: "Electronics & Communication" },
    { value: "CE", label: "Civil Engineering" },
    { value: "ME", label: "Mechanical Engineering" },
  ];

  const yearOptions = [
    { value: "1st", label: "1st Year" },
    { value: "2nd", label: "2nd Year" },
    { value: "3rd", label: "3rd Year" },
    { value: "4th", label: "4th Year" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex justify-center mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={watchedProfilePicture} />
                  <AvatarFallback className="text-2xl">{getAvatarFallback()}</AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Your username"
                      {...register("username")}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture URL</Label>
                  <Input
                    id="profilePicture"
                    placeholder="https://example.com/image.jpg"
                    {...register("profilePicture")}
                  />
                  {errors.profilePicture && (
                    <p className="text-sm text-destructive">{errors.profilePicture.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select
                      onValueChange={(value) => setValue("branch", value)}
                      defaultValue={profile?.branch || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      onValueChange={(value) => setValue("year", value)}
                      defaultValue={profile?.year || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    className="min-h-[100px]"
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive">{errors.bio.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground text-right">
                    {watch("bio")?.length || 0}/200
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)} 
              disabled={isSubmitting || updateProfileMutation.isPending}
            >
              {(isSubmitting || updateProfileMutation.isPending) ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
} 