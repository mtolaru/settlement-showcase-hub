
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  className?: string;
}

const ImageUpload = ({ onImageUpload, className = "" }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, or WebP)",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      setIsUploading(true);

      // Upload file using Edge Function (this will now put it in processed_images folder)
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('upload-settlement-image', {
        body: formData
      });

      if (error) {
        throw error;
      }

      // The response will now have the publicUrl with the processed_images path
      onImageUpload(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your photo. Please try again.",
      });
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const removeImage = () => {
    setPreview(null);
    onImageUpload('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-400'}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          {preview ? (
            <div className="relative w-32 h-32 mx-auto">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              {!isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <div className="p-4 rounded-full bg-neutral-100">
                {isUploading ? (
                  <Upload className="h-8 w-8 text-neutral-400 animate-pulse" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-neutral-400" />
                )}
              </div>
              <div className="text-sm text-neutral-600">
                <p className="font-medium">
                  {isDragActive ? 'Drop your photo here' : 'Drag and drop your professional photo here'}
                </p>
                <p>or click to select</p>
              </div>
              <p className="text-xs text-neutral-500">
                JPG, PNG or WebP (max. 5MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
