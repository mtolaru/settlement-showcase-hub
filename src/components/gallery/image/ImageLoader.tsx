
import React from "react";

interface ImageLoaderProps {
  isLoading: boolean;
}

const ImageLoader: React.FC<ImageLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default ImageLoader;
