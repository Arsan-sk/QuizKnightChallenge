import { useState, useCallback, useId, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Image, Trash, Upload, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadProps {
  className?: string;
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
  compact?: boolean;
  id?: string; // Allow custom ID to be passed
}

export function ImageUpload({ 
  className, 
  value, 
  onChange, 
  label = "Upload Image",
  compact = true,
  id: customId
}: ImageUploadProps) {
  const instanceId = useId(); // Generate a unique ID for this component instance
  const uniqueId = customId || `image-upload-${instanceId}-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const activeElementRef = useRef<Element | null>(null);
  const isMounted = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Set up cleanup and initialization
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Preserve focus before operations that might disrupt it
  const preserveFocus = useCallback(() => {
    activeElementRef.current = document.activeElement;
  }, []);
  
  // Restore focus after operations
  const restoreFocus = useCallback(() => {
    // Use a small timeout to ensure DOM is settled
    if (activeElementRef.current && isMounted.current) {
      requestAnimationFrame(() => {
        if (activeElementRef.current instanceof HTMLElement) {
          activeElementRef.current.focus();
          activeElementRef.current = null;
        }
      });
    }
  }, []);
  
  const uploadImage = useCallback(async (file: File) => {
    // Save active element before upload
    preserveFocus();
    
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
      
      // Restore focus after successful upload
      setTimeout(restoreFocus, 0);
      
      // Return the URL of the uploaded image
      return data.url;
    } catch (error) {
      console.error(`Upload error:`, error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your image.',
        variant: 'destructive'
      });
      
      // Restore focus after failed upload too
      setTimeout(restoreFocus, 0);
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [toast, preserveFocus, restoreFocus]);

  // Carefully handle file dialog open to preserve focus
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save active element before opening file dialog
    preserveFocus();
    
    // Just show the file dialog without losing focus context
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      document.getElementById(uniqueId)?.click();
    }
  }, [uniqueId, preserveFocus]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // Restore focus even if no file selected
      restoreFocus();
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, etc.)',
        variant: 'destructive'
      });
      restoreFocus();
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image should be less than 5MB',
        variant: 'destructive'
      });
      restoreFocus();
      return;
    }
    
    const url = await uploadImage(file);
    if (url) {
      onChange(url);
      if (compact) setShowPreview(true);
    }
    
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save focus state before removing image
    preserveFocus();
    
    onChange(null);
    setShowPreview(false);
    
    // Restore focus after state change
    setTimeout(restoreFocus, 0);
  };

  const handleTogglePreview = (e: React.MouseEvent, show: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save focus state before toggling preview
    preserveFocus();
    
    setShowPreview(show);
    
    // Restore focus after state change
    setTimeout(restoreFocus, 0);
  };

  // Compact version - just a button with a small preview when image exists
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id={uniqueId}
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-1", value && !showPreview && "border-blue-500")}
          disabled={isUploading}
          onClick={handleButtonClick}
        >
          {isUploading ? (
            <>Uploading...</>
          ) : value ? (
            <>
              <Image className="h-4 w-4" /> 
              {showPreview ? "Change Image" : "View/Change Image"}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> {label}
            </>
          )}
        </Button>
        
        <AnimatePresence>
          {value && showPreview && (
            <motion.div 
              className="relative ml-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <img 
                src={value}
                alt="Preview" 
                className="h-20 w-20 object-cover rounded-md border" 
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -top-2 -left-2 h-5 w-5 rounded-full"
                onClick={(e) => handleTogglePreview(e, false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {value && !showPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-0 h-7"
            onClick={(e) => handleTogglePreview(e, true)}
          >
            <Image className="h-4 w-4 mr-1" /> View
          </Button>
        )}
        
        {value && !showPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-0 h-7 text-red-500 hover:text-red-600"
            onClick={handleRemoveImage}
          >
            <Trash className="h-4 w-4 mr-1" /> Remove
          </Button>
        )}
      </div>
    );
  }

  // Original version with larger preview box
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
        id={uniqueId + "-original"}
        ref={fileInputRef}
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Save focus state before opening file dialog
            preserveFocus();
            
            if (fileInputRef.current) {
              fileInputRef.current.click();
            } else {
              document.getElementById(uniqueId + "-original")?.click();
            }
          }}
        >
          {isUploading ? 'Uploading...' : 'Select Image'}
        </Button>
      )}
    </div>
  );
} 