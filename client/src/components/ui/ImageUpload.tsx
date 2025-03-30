import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Trash, Upload } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ImageUploadProps {
  className?: string;
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
}

export function ImageUpload({ 
  className, 
  value, 
  onChange, 
  label = "Upload Image" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      // Create form data for the upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Use fetch directly since we need to send FormData
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      // Return the URL of the uploaded image
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your image.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image should be less than 5MB',
        variant: 'destructive'
      });
      return;
    }
    
    const url = await uploadImage(file);
    if (url) {
      onChange(url);
    }
    
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative aspect-video rounded-md overflow-hidden">
          <img 
            src={value} 
            alt="Uploaded image" 
            className="object-contain w-full h-full" 
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 opacity-80 hover:opacity-100"
            onClick={handleRemoveImage}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-md p-4 flex flex-col items-center justify-center aspect-video text-muted-foreground">
          <Upload className="h-6 w-6 mb-2" />
          <p className="text-sm">{label}</p>
          <p className="text-xs mt-1">JPG, PNG, GIF (max 5MB)</p>
          {isUploading && <p className="text-xs mt-2">Uploading...</p>}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="image-upload"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {!value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isUploading}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {isUploading ? 'Uploading...' : 'Select Image'}
        </Button>
      )}
    </div>
  );
} 