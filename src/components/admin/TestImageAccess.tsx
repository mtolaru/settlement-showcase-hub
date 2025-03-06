
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const TestImageAccess = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [settlementId, setSettlementId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [publicResult, setPublicResult] = useState<{success: boolean; url?: string; error?: string} | null>(null);
  const [signedResult, setSignedResult] = useState<{success: boolean; url?: string; error?: string} | null>(null);
  const [headResult, setHeadResult] = useState<{success: boolean; status?: number; error?: string} | null>(null);

  const testAccess = async () => {
    setIsLoading(true);
    setPublicResult(null);
    setSignedResult(null);
    setHeadResult(null);
    
    let filePath = imageUrl;
    
    if (settlementId && !imageUrl) {
      filePath = `settlement_${settlementId}.jpg`;
    }
    
    if (filePath.startsWith('http')) {
      try {
        const url = new URL(filePath);
        const pathParts = url.pathname.split('/');
        filePath = pathParts[pathParts.length - 1];
      } catch (err) {
      }
    }
    
    if (filePath.startsWith('processed_images/')) {
      filePath = filePath.substring('processed_images/'.length);
    }
    
    try {
      const { data } = supabase.storage
        .from('processed_images')
        .getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        setPublicResult({
          success: true,
          url: data.publicUrl
        });
        
        try {
          const response = await fetch(data.publicUrl, { method: 'HEAD' });
          setHeadResult({
            success: response.ok,
            status: response.status
          });
        } catch (err: any) {
          setHeadResult({
            success: false,
            error: err.message || 'Network error'
          });
        }
      } else {
        setPublicResult({
          success: false,
          error: 'No public URL returned'
        });
      }
    } catch (err: any) {
      setPublicResult({
        success: false,
        error: err.message || 'Unknown error'
      });
    }
    
    try {
      const { data, error } = await supabase.storage
        .from('processed_images')
        .createSignedUrl(filePath, 60);
        
      if (error) {
        setSignedResult({
          success: false,
          error: error.message
        });
      } else if (data?.signedUrl) {
        setSignedResult({
          success: true,
          url: data.signedUrl
        });
      } else {
        setSignedResult({
          success: false,
          error: 'No signed URL returned'
        });
      }
    } catch (err: any) {
      setSignedResult({
        success: false,
        error: err.message || 'Unknown error'
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Test Image Access</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Settlement ID or Image Path:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Settlement ID
                </label>
                <Input
                  value={settlementId}
                  onChange={(e) => setSettlementId(e.target.value)}
                  placeholder="e.g. 91"
                  className="mb-2"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Image Path/URL (overrides ID)
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. settlement_91.jpg"
                  className="mb-2"
                />
              </div>
            </div>
            <Button 
              onClick={testAccess} 
              disabled={isLoading || (!settlementId && !imageUrl)}
              className="mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Access'
              )}
            </Button>
          </div>
          
          {publicResult && (
            <Alert variant={publicResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {publicResult.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5" />
                )}
                <AlertDescription className="break-all">
                  <strong>Public URL:</strong> {publicResult.success ? (
                    <>
                      <span className="block mb-2">{publicResult.url}</span>
                      <a 
                        href={publicResult.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline text-sm"
                      >
                        Open in New Tab
                      </a>
                    </>
                  ) : (
                    publicResult.error
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {headResult && (
            <Alert variant={headResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {headResult.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5" />
                )}
                <AlertDescription>
                  <strong>HTTP HEAD Test:</strong> {headResult.success ? (
                    <>Status: {headResult.status} OK</>
                  ) : (
                    headResult.error ? headResult.error : `Status: ${headResult.status}`
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {signedResult && (
            <Alert variant={signedResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {signedResult.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5" />
                )}
                <AlertDescription className="break-all">
                  <strong>Signed URL:</strong> {signedResult.success ? (
                    <>
                      <span className="block mb-2">{signedResult.url}</span>
                      <a 
                        href={signedResult.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline text-sm"
                      >
                        Open in New Tab
                      </a>
                    </>
                  ) : (
                    signedResult.error
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {publicResult?.success && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Preview:</h3>
              <div className="relative h-48 bg-neutral-100 rounded-md overflow-hidden">
                <img 
                  src={publicResult.url} 
                  alt="Image preview" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    // Use optional chaining and type assertion for next element sibling
                    const nextElement = target.nextElementSibling as HTMLElement | null;
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center hidden">
                  <div className="text-sm text-neutral-600 bg-white px-4 py-2 rounded-md shadow-sm">
                    Image failed to load
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {(publicResult?.success || signedResult?.success) && (
            <div className="mt-4 p-3 bg-neutral-50 rounded-md text-sm text-neutral-700">
              <p className="font-medium mb-1">Tips for debugging:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>If public URL works but HEAD request fails, you might have CORS issues</li>
                <li>If signed URL works but public URL fails, check bucket permissions</li>
                <li>Try opening the URLs directly in a new browser tab</li>
                <li>Check the network tab for more error details</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestImageAccess;
