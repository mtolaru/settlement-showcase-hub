
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, FileQuestion, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

const ImageMappingFixer = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const checkBucketContents = async () => {
    try {
      setIsLoading(true);
      setProgress(30);
      
      const { data, error } = await supabase.storage
        .from('processed_images')
        .list();
        
      if (error) throw error;
      
      setResults({
        bucketContents: true,
        files: data || [],
        validSettlementImages: data?.filter(file => 
          file.name.match(/settlement_\d+\.jpg/i)
        ) || []
      });
      
      toast({
        title: "Bucket Content Listed",
        description: `Found ${data?.length || 0} files in the bucket.`
      });
      
      setProgress(100);
    } catch (error: any) {
      console.error('Error checking bucket contents:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check bucket contents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runMappingFix = async () => {
    try {
      setIsLoading(true);
      setProgress(20);
      toast({
        title: "Processing",
        description: "Running image mapping fix..."
      });
      
      const { data, error } = await supabase.functions.invoke('map-settlement-images');
      
      if (error) throw error;
      
      setResults({
        ...results,
        mappingResults: data
      });
      
      setProgress(100);
      
      toast({
        title: "Mapping Complete",
        description: data.message || "Successfully updated settlement image mappings"
      });
    } catch (error: any) {
      console.error('Error running mapping fix:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to run mapping fix",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-blue-500" />
          Image Mapping Fixer
        </CardTitle>
        <CardDescription>
          Fix settlement to image mappings by only linking to images that actually exist in the storage bucket
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            This tool will check for all actual settlement_ID.jpg images in the storage bucket and 
            update the database to only map settlements to images that actually exist.
            Settlements without images will be marked as hidden.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col gap-4 md:flex-row md:gap-3">
          <Button 
            onClick={checkBucketContents} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileQuestion className="h-4 w-4" />
            Check Bucket Contents
          </Button>
          
          <Button 
            onClick={runMappingFix} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Run Mapping Fix
          </Button>
        </div>
        
        {isLoading && (
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        {results?.bucketContents && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Storage Bucket Contents
            </h3>
            <p className="text-sm">Total files in bucket: {results.files.length}</p>
            <p className="text-sm">Valid settlement images: {results.validSettlementImages.length}</p>
            
            {results.validSettlementImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mt-2 mb-1">Valid settlement image files:</h4>
                <div className="max-h-24 overflow-y-auto text-xs">
                  {results.validSettlementImages.map((file: any, index: number) => (
                    <div key={index} className="text-gray-600">{file.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {results?.mappingResults && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 space-y-2">
            <h3 className="font-semibold text-green-800">Mapping Results</h3>
            <p className="text-sm">{results.mappingResults.message}</p>
            
            {results.mappingResults.updated && (
              <div>
                <h4 className="text-sm font-medium mt-2 mb-1">Updated settlements:</h4>
                <div className="max-h-32 overflow-y-auto text-xs">
                  {results.mappingResults.updated.map((update: any, index: number) => (
                    <div key={index} className="text-gray-600">
                      Settlement ID {update.id} → {update.fileName}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageMappingFixer;
