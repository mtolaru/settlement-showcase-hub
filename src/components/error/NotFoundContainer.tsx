
import React from "react";

interface NotFoundContainerProps {
  children: React.ReactNode;
}

export const NotFoundContainer: React.FC<NotFoundContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {children}
    </div>
  );
};
