
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

const Analytics = () => {
  const location = useLocation();
  
  useEffect(() => {
    const sendPageView = () => {
      trackPageView({
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname + location.search
      });
      console.log('🔍 Analytics: Tracked page view for', location.pathname);
    };
    
    // Track page view with small delay to ensure page title is updated
    setTimeout(sendPageView, 100);
  }, [location]);
  
  return null;
};

export default Analytics;
