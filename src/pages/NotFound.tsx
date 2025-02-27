
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "Search params:",
      location.search,
      "Full URL:",
      window.location.href
    );
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-primary-600">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="text-sm text-gray-500 mb-6">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable. If you were completing a payment, don't worry - 
          your payment was likely processed successfully.
        </p>
        
        <div className="space-y-4">
          <a href="/" className="block w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors">
            Return to Home
          </a>
          <a href="/confirmation" className="block w-full py-2 px-4 border border-primary-600 text-primary-600 hover:bg-primary-50 rounded transition-colors">
            Go to Payment Confirmation
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
