
// URL resolution and base URL determination
export const resolveBaseUrl = (req: Request): string => {
  // Extract headers for URL determination
  const requestOrigin = req.headers.get('origin');
  const requestUrl = req.url;
  const referrer = req.headers.get('referer');
  const host = req.headers.get('host');
  
  console.log("Request details for URL resolution:", {
    origin: requestOrigin,
    url: requestUrl,
    referrer,
    host
  });
  
  // Define allowed production domains
  const productionDomains = [
    'https://www.settlementwins.com', 
    'https://settlementwins.com',
    'https://settlement-wins-web.vercel.app',
    'https://payment-redirect-preview.vercel.app'
  ];
  
  // Default production domain as fallback
  const defaultProductionDomain = 'https://www.settlementwins.com';
  
  // Determine base URL with improved fallback logic
  let baseUrl;
  
  // First try to get it directly from the origin header - highest priority
  if (requestOrigin && requestOrigin.length > 0) {
    console.log("Using origin header for base URL:", requestOrigin);
    baseUrl = requestOrigin;
  } 
  // If no origin, try to extract from referrer
  else if (referrer && referrer.length > 0) {
    try {
      const referrerUrl = new URL(referrer);
      baseUrl = `${referrerUrl.protocol}//${referrerUrl.host}`;
      console.log("Extracted base URL from referrer:", baseUrl);
    } catch (e) {
      console.log("Failed to extract from referrer, using default production domain");
      baseUrl = defaultProductionDomain;
    }
  } 
  // If we have a host header and URL, try to construct from that
  else if (host && requestUrl) {
    try {
      const urlObj = new URL(requestUrl);
      baseUrl = `${urlObj.protocol}//${host}`;
      console.log("Constructed base URL from host and request URL:", baseUrl);
    } catch (e) {
      console.log("Failed to construct URL from host, falling back to default");
      baseUrl = defaultProductionDomain;
    }
  }
  // Last resort fallback to default production domain
  else {
    console.log("No origin, referrer or host found, using default production domain");
    baseUrl = defaultProductionDomain;
  }
  
  // Sanity check - ensure baseUrl has protocol
  if (!baseUrl.startsWith('http')) {
    console.log("Adding https:// to baseUrl as it's missing protocol:", baseUrl);
    baseUrl = 'https://' + baseUrl;
  }
  
  console.log("Final base URL for redirects:", baseUrl);
  return baseUrl;
};
