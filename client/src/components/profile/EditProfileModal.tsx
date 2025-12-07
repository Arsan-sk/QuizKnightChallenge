import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, User, Briefcase, Save, X } from "lucide-react";

interface EditProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
    const { profile, updateProfileMutation } = useProfile();
    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        profilePicture: "",
        bio: "",
        branch: "",
        year: "",
    });

    // Initialize form when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || "",
                username: profile.username || "",
                email: profile.email || "",
                profilePicture: profile.profilePicture || profile.profileImage || "",
                bio: profile.bio || "",
                branch: profile.branch || "",
                year: profile.year || "",
            });
        }
    }, [profile]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please select an image smaller than 2MB",
                variant: "destructive",
            });
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid file type",
                description: "Please select an image file",
                variant: "destructive",
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setFormData((prev) => ({
                    ...prev,
                    profilePicture: event.target!.result as string,
                }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfileMutation.mutateAsync(formData);
            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated",
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Update failed",
                description: "There was an error updating your profile",
                variant: "destructive",
            });
        }
    };

    const getInitials = () => {
        if (formData.name) {
            return formData.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2);
        }
        return formData.username.substring(0, 2).toUpperCase();
    };

    const isStudent = user?.role === "student";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your personal information and preferences
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">
                                <User className="h-4 w-4 mr-2" />
                                Basic Info
                            </TabsTrigger>
                            <TabsTrigger value="picture">
                                <Camera className="h-4 w-4 mr-2" />
                                Picture
                            </TabsTrigger>
                            <TabsTrigger value="details">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Details
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Your full name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="grid gap-2">
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

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="your.email@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="grid gap-2">
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
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="picture" className="space-y-4 mt-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center space-y-4"
                            >
                                <div
                                    className="relative cursor-pointer group"
                                    onClick={handleImageClick}
                                >
                                    <Avatar className="h-32 w-32 border-4 border-primary/20 group-hover:border-primary/50 transition-all">
                                        <AvatarImage src={formData.profilePicture} />
                                        <AvatarFallback className="text-3xl">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    Click to upload a new profile picture
                                </p>

                                <div className="w-full space-y-2">
                                    <Label htmlFor="profilePicture">Or enter image URL</Label>
                                    <Input
                                        id="profilePicture"
                                        name="profilePicture"
                                        placeholder="https://example.com/avatar.jpg"
                                        value={formData.profilePicture}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-4 mt-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {isStudent && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="branch">Branch</Label>
                                            <Select
                                                value={formData.branch}
                                                onValueChange={(value) =>
                                                    handleSelectChange("branch", value)
                                                }
                                            >
                                                <SelectTrigger id="branch">
                                                    <SelectValue placeholder="Select your branch" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CS">Computer Science</SelectItem>
                                                    <SelectItem value="AIML">
                                                        AI & Machine Learning
                                                    </SelectItem>
                                                    <SelectItem value="DS">Data Science</SelectItem>
                                                    <SelectItem value="ECS">Electronics & CS</SelectItem>
                                                    <SelectItem value="ECE">
                                                        Electronics & Communication
                                                    </SelectItem>
                                                    <SelectItem value="CE">Civil Engineering</SelectItem>
                                                    <SelectItem value="ME">
                                                        Mechanical Engineering
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="year">Year of Study</Label>
                                            <Select
                                                value={formData.year}
                                                onValueChange={(value) =>
                                                    handleSelectChange("year", value)
                                                }
                                            >
                                                <SelectTrigger id="year">
                                                    <SelectValue placeholder="Select your year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1st">1st Year</SelectItem>
                                                    <SelectItem value="2nd">2nd Year</SelectItem>
                                                    <SelectItem value="3rd">3rd Year</SelectItem>
                                                    <SelectItem value="4th">4th Year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateProfileMutation.isPending}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
