
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TestImageAccessProps {
  fileName?: string;
  defaultFileName?: string;
}

const TestImageAccess = ({ fileName, defaultFileName = 'settlement_1.jpg' }: TestImageAccessProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean; url?: string; error?: string} | null>(null);
  
  const testFile = fileName || defaultFileName;
  
  const checkFileAccess = async () => {
    setIsLoading(true);
    try {
      setResult(null);
      
      console.log(`Testing access to file: ${testFile}`);
      
      // First, check if the file exists in the bucket
      const { data: exists, error: existsError } = await supabase.storage
        .from('processed_images')
        .list('', {
          search: testFile,
        });
      
      // Get public URL regardless of file existence check
      const { data: urlData } = supabase.storage
        .from('processed_images')
        .getPublicUrl(testFile);
        
      // Try to fetch the image to verify it's actually accessible
      let accessible = false;
      if (urlData?.publicUrl) {
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          accessible = response.ok;
        } catch (err) {
          console.error("Error checking URL accessibility:", err);
        }
      }
      
      if (existsError) {
        setResult({
          success: false,
          error: `Error checking if file exists: ${existsError.message}`
        });
        return;
      }
      
      if (!exists || exists.length === 0) {
        setResult({
          success: false,
          error: `File "${testFile}" not found in bucket`
        });
        return;
      }
      
      if (!urlData?.publicUrl) {
        setResult({
          success: false,
          error: `Could not generate public URL for file "${testFile}"`
        });
        return;
      }
      
      if (!accessible) {
        setResult({
          success: false,
          url: urlData.publicUrl,
          error: `Generated URL exists but file is not accessible. This may be a permissions issue.`
        });
        return;
      }
      
      setResult({
        success: true,
        url: urlData.publicUrl
      });
      
    } catch (error) {
      console.error("Error testing file access:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium mb-2">Test Image Access</h3>
      <p className="text-sm text-gray-500 mb-4">
        Test if a file in the processed_images bucket is accessible
      </p>
      
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={checkFileAccess} 
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? 'Checking...' : 'Test file access'}
        </Button>
        <div className="text-sm text-gray-500 flex items-center">
          Testing: <span className="font-mono ml-1">{testFile}</span>
        </div>
      </div>
      
      {result && (
        <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          {result.success ? 
            <CheckCircle className="h-4 w-4 text-green-600" /> : 
            <AlertCircle className="h-4 w-4 text-red-600" />
          }
          <AlertDescription>
            {result.success ? (
              <div>
                <p className="text-green-700">File is accessible!</p>
                {result.url && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">URL:</p>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline break-all"
                    >
                      {result.url}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-red-700">{result.error}</p>
                {result.url && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Generated URL (inaccessible):</p>
                    <span className="text-xs font-mono break-all text-gray-500">
                      {result.url}
                    </span>
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TestImageAccess;
