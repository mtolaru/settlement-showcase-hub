import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, FolderSearch } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { resolveSettlementImageUrl, verifyFileExists } from "@/utils/imageUtils";

interface ImageDebuggerProps {
  settlementId?: number | null;
  photo_url?: string | null;
}

interface BucketFile {
  name: string;
  size: number;
}

const ImageDebugger = ({ settlementId, photo_url }: ImageDebuggerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bucketFiles, setBucketFiles] = useState<BucketFile[]>([]);
  const [searchPattern, setSearchPattern] = useState<string>('');
  const [filteredFiles, setFilteredFiles] = useState<BucketFile[]>([]);
  const [result, setResult] = useState<{success: boolean; url?: string; error?: string} | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  const testFile = photo_url || (settlementId ? `settlement_${settlementId}.jpg` : 'settlement_1.jpg');
  
  useEffect(() => {
    if (searchPattern.trim()) {
      setFilteredFiles(bucketFiles.filter(file => file.name.toLowerCase().includes(searchPattern.toLowerCase())));
    } else {
      setFilteredFiles(bucketFiles);
    }
  }, [searchPattern, bucketFiles]);
  
  const loadBucketFiles = async () => {
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase.storage
        .from('processed_images')
        .list('');
        
      if (error) {
        console.error("Error listing bucket files:", error);
        return;
      }
      
      // Map FileObjects to our BucketFile type, filtering out folders
      const files: BucketFile[] = (data || [])
        .filter(item => item.id !== null)
        .map(file => ({
          name: file.name,
          size: file.metadata?.size || 0
        }));
      
      setBucketFiles(files);
      setFilteredFiles(files);
    } catch (err) {
      console.error("Error loading bucket files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };
  
  const checkFileAccess = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log(`Testing access to file: ${testFile}`);
      
      // Test using our utility function
      const url = await resolveSettlementImageUrl(testFile, settlementId);
      const exists = await verifyFileExists(testFile);
      
      if (url === "/placeholder.svg") {
        setResult({
          success: false,
          error: `Could not generate a valid URL for file "${testFile}"`
        });
        return;
      }
      
      // Try to fetch the image to verify it's actually accessible
      let accessible = false;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        accessible = response.ok;
      } catch (err) {
        console.error("Error checking URL accessibility:", err);
      }
      
      if (!exists) {
        setResult({
          success: false,
          error: `File "${testFile}" not found in bucket`
        });
        return;
      }
      
      if (!accessible) {
        setResult({
          success: false,
          url: url,
          error: `Generated URL exists but file is not accessible. This may be a permissions issue.`
        });
        return;
      }
      
      setResult({
        success: true,
        url: url
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
    <Card className="p-4 bg-gray-50">
      <h3 className="font-medium mb-2">Image Debugger</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">
            Test if a file for this settlement is accessible
          </p>
          
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={checkFileAccess} 
              disabled={isLoading}
              size="sm"
              variant="secondary"
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

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">
              Browse bucket files
            </p>
            <Button
              onClick={loadBucketFiles}
              disabled={loadingFiles}
              size="sm"
              variant="outline"
            >
              {loadingFiles ? 'Loading...' : 'Load Files'}
              <FolderSearch className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {bucketFiles.length > 0 && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Filter files..."
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                className="w-full p-2 text-sm border rounded mb-2"
              />
              
              <div className="max-h-64 overflow-y-auto border rounded">
                {filteredFiles.length > 0 ? (
                  <ul className="divide-y">
                    {filteredFiles.map(file => (
                      <li key={file.name} className="p-2 hover:bg-gray-100 text-sm flex justify-between">
                        <span className="font-mono truncate flex-1">{file.name}</span>
                        <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-center text-gray-500 text-sm">
                    {searchPattern ? "No files match your search" : "No files found in bucket"}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total files: {bucketFiles.length} | Filtered: {filteredFiles.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ImageDebugger;
