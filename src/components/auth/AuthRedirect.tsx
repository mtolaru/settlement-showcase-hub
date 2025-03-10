
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const AuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuthRedirect = async () => {
      try {
        // Log the full URL and hash for debugging
        console.log("Auth redirect processing:", {
          fullUrl: window.location.href,
          hash: location.hash,
          pathname: location.pathname
        });

        // Check if this is a password reset flow
        if (location.pathname.includes("/auth/reset-password")) {
          console.log("Detected password reset flow");
          
          // Handle the hash fragment from the URL which contains the access token
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");
          
          if (accessToken) {
            console.log("Found access token in URL, processing reset");
            
            // For password reset flows, we should redirect to the login page
            // where the user will be prompted to enter a new password
            toast({
              title: "Password reset link valid",
              description: "You can now set a new password.",
            });
            
            // Update the Supabase session with the token
            if (type === "recovery") {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              });
              
              if (error) {
                console.error("Error setting session:", error);
                setError("Failed to process password reset. Please try again.");
              } else {
                // Redirect to login page which handles the UI for password reset
                navigate("/");
                
                // Show login dialog with recovery mode
                // We'll need to implement this in the LoginDialog component
                localStorage.setItem("show_reset_ui", "true");
                
                toast({
                  title: "Please set a new password",
                  description: "Use the login dialog to set your new password.",
                });
              }
            }
          } else {
            console.error("No access token found in URL");
            setError("Invalid password reset link. Please request a new one.");
          }
        } else {
          // Handle other auth redirects (verify email, etc.)
          console.log("Processing general auth callback");
          const { error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Auth session error:", error);
            setError("Authentication error. Please try logging in again.");
          } else {
            navigate("/");
            toast({
              title: "Authentication successful",
              description: "You have been signed in successfully.",
            });
          }
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
        setError("Failed to process authentication. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    processAuthRedirect();
  }, [location, navigate, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-primary-900">Processing Authentication</h1>
          <p className="text-gray-600">Please wait while we verify your request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-primary-900">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthRedirect;
