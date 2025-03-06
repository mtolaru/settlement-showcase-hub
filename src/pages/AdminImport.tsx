import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, AlertCircle, FileUp, ImageUp, Link, Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TestImageAccess from '@/components/admin/TestImageAccess';

const AdminImport = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<string>('');
  const [imagesUploaded, setImagesUploaded] = useState<{name: string, url: string}[]>([]);
  const [tab, setTab] = useState('data');
  const [isDeletingImages, setIsDeletingImages] = useState(false);
  const [isMappingImages, setIsMappingImages] = useState(false);
  const [mappingResults, setMappingResults] = useState<any>(null);
  const [settlementStats, setSettlementStats] = useState<any>(null);

  const onDropJson = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.type !== 'application/json') {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setUploadPhase('Reading JSON file');
    setProgress(10);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('Expected JSON array of settlements');
      }

      setUploadPhase('Uploading to Supabase');
      setProgress(30);

      const { data: result, error } = await supabase.functions.invoke('import-settlements', {
        body: { settlements: data }
      });

      if (error) throw error;
      
      setResults(result);
      setProgress(100);
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.imported} settlements`,
      });
    } catch (error: any) {
      console.error('Error importing settlements:', error);
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const onDropImages = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsLoading(true);
    setImagesUploaded([]);
    const totalFiles = acceptedFiles.length;
    let uploadedCount = 0;

    try {
      for (const file of acceptedFiles) {
        setUploadPhase(`Uploading image ${uploadedCount + 1}/${totalFiles}: ${file.name}`);
        setProgress(Math.floor((uploadedCount / totalFiles) * 100));
        
        const match = file.name.match(/settlement_(\d+)/i);
        let customFilename = '';
        
        if (match && match[1]) {
          customFilename = `processed_images/settlement_${match[1]}`;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        if (customFilename) {
          formData.append('customFilename', customFilename);
        }

        const { data, error } = await supabase.functions.invoke('upload-settlement-image', {
          body: formData
        });

        if (error) throw error;
        
        if (data && data.publicUrl) {
          setImagesUploaded(prev => [...prev, { name: file.name, url: data.publicUrl }]);
        }

        uploadedCount++;
      }

      setProgress(100);
      toast({
        title: "Images Uploaded",
        description: `Successfully uploaded ${uploadedCount} images`,
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDeleteAllImages = async () => {
    if (isDeletingImages) return;
    
    try {
      setIsDeletingImages(true);
      setUploadPhase('Deleting all images');
      
      const { data, error } = await supabase.functions.invoke('delete-settlement-images');
      
      if (error) throw error;
      
      setImagesUploaded([]);
      toast({
        title: "Images Deleted",
        description: data.message || "All images have been deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting images:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete images",
        variant: "destructive"
      });
    } finally {
      setIsDeletingImages(false);
    }
  };

  const handleMapSettlementImages = async () => {
    if (isMappingImages) return;
    
    try {
      setIsMappingImages(true);
      setUploadPhase('Completely remapping all settlement images');
      setProgress(30);
      
      console.log("Calling map-settlement-images function...");
      const { data, error } = await supabase.functions.invoke('map-settlement-images');
      
      if (error) {
        console.error('Error calling map-settlement-images function:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from map-settlement-images function');
        throw new Error('No data returned from function');
      }
      
      console.log("Function response:", data);
      setMappingResults(data);
      setProgress(100);
      
      toast({
        title: "Mapping Successful",
        description: data.message || `Mapped ${data.updated} out of ${data.total} settlements to images`,
      });
      
      fetchSettlementStats();
    } catch (error: any) {
      console.error('Error mapping settlement images:', error);
      setProgress(0);
      toast({
        title: "Mapping Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      
      // Set mapping results even in error case if we have some data
      if (error.data) {
        setMappingResults(error.data);
      }
    } finally {
      setIsMappingImages(false);
    }
  };
  
  const fetchSettlementStats = async () => {
    try {
      setUploadPhase('Fetching settlement statistics');
      setProgress(50);
      
      // Fix: Correctly destructure the count property from the Supabase response
      const { count: totalCount, error: totalError } = await supabase
        .from('settlements')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      const { count: withPhotoCount, error: photoError } = await supabase
        .from('settlements')
        .select('*', { count: 'exact', head: true })
        .not('photo_url', 'is', null);
      
      if (photoError) throw photoError;
      
      const { count: withoutPhotoCount, error: withoutPhotoError } = await supabase
        .from('settlements')
        .select('*', { count: 'exact', head: true })
        .is('photo_url', null);
      
      if (withoutPhotoError) throw withoutPhotoError;
      
      setSettlementStats({
        total: totalCount,
        withPhoto: withPhotoCount,
        withoutPhoto: withoutPhotoCount
      });
      
      setProgress(100);
    } catch (error) {
      console.error('Error fetching settlement stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settlement statistics",
        variant: "destructive"
      });
    }
  };
  
  React.useEffect(() => {
    if (tab === 'mapping') {
      fetchSettlementStats();
    }
  }, [tab]);

  const { getRootProps: getJsonRootProps, getInputProps: getJsonInputProps } = useDropzone({
    onDrop: onDropJson,
    accept: {
      'application/json': ['.json']
    },
    multiple: false,
    disabled: isLoading
  });

  const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps } = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true,
    disabled: isLoading
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Import Tool</h1>
      
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="data">Import Settlements</TabsTrigger>
          <TabsTrigger value="images">Upload Images</TabsTrigger>
          <TabsTrigger value="mapping">Map Images</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Import Settlement Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getJsonRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50"
              >
                <input {...getJsonInputProps()} />
                <p className="text-gray-500">
                  Drag 'n' drop a JSON file here, or click to select one
                </p>
                <em className="text-sm text-gray-400 mt-2 block">
                  Only JSON files with settlement data are accepted
                </em>
              </div>

              {isLoading && tab === 'data' && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">{uploadPhase}</p>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {results && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800">Import Results</h3>
                  <p>Settlements imported: {results.imported}</p>
                  {results.errors && results.errors.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-semibold text-amber-800">Errors:</h4>
                      <ul className="list-disc pl-5 text-sm text-amber-700">
                        {results.errors.map((err: string, index: number) => (
                          <li key={index}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Upload Attorney Images</span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteAllImages} 
                  disabled={isDeletingImages}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeletingImages ? 'Deleting...' : 'Delete All Images'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Images will be stored in the <strong>processed_images</strong> folder automatically.
                </AlertDescription>
              </Alert>
              
              <div
                {...getImagesRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50"
              >
                <input {...getImagesInputProps()} />
                <p className="text-gray-500">
                  Drag 'n' drop image files here, or click to select files
                </p>
                <em className="text-sm text-gray-400 mt-2 block">
                  Supported formats: PNG, JPG, JPEG, WebP
                </em>
              </div>

              {isLoading && tab === 'images' && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">{uploadPhase}</p>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {imagesUploaded.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Uploaded Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imagesUploaded.map((img, index) => (
                      <div key={index} className="text-center">
                        <img 
                          src={img.url} 
                          alt={img.name} 
                          className="w-24 h-24 object-cover rounded mx-auto mb-1" 
                        />
                        <p className="text-xs text-gray-500 truncate" title={img.name}>
                          {img.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Map Images to Settlements</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSettlementStats} 
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Stats
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This utility will reset all photo URL mappings in the database, then map only existing images to their settlements.
                  All settlements without a corresponding image in the bucket will have their photo_url set to null.
                </AlertDescription>
              </Alert>
              
              {settlementStats && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Current Settlement Statistics</h3>
                  <div className="space-y-2">
                    <p>Total settlements: <span className="font-medium">{settlementStats.total}</span></p>
                    <p>Settlements with images: <span className="font-medium text-green-600">{settlementStats.withPhoto}</span></p>
                    <p>Settlements without images: <span className="font-medium text-red-600">{settlementStats.withoutPhoto}</span></p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Link className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Complete Remapping</h3>
                <p className="text-gray-500 text-center mb-4">
                  Click the button below to reset all photo URL mappings and re-map only existing images to settlements.
                </p>
                <Button 
                  onClick={handleMapSettlementImages} 
                  disabled={isMappingImages}
                  className="mt-2"
                >
                  {isMappingImages ? 'Remapping...' : 'Remap All Settlement Images'}
                </Button>
              </div>

              {isMappingImages && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">{uploadPhase}</p>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {mappingResults && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Mapping Results</h3>
                  <p>Total settlements processed: {mappingResults.total}</p>
                  <p>Settlements mapped to images: {mappingResults.updated}</p>
                  <p>Settlements without matching images: {mappingResults.not_mapped}</p>
                  
                  {mappingResults.errors && mappingResults.errors.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-semibold text-amber-800">Errors:</h4>
                      <div className="mt-1 max-h-36 overflow-y-auto">
                        <ul className="list-disc pl-5 text-sm text-amber-700">
                          {mappingResults.errors.map((err: string, index: number) => (
                            <li key={index}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                Debug Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-amber-50 border-amber-200 mb-4">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  Use these tools to diagnose issues with settlement images and bucket access.
                </AlertDescription>
              </Alert>
              
              <TestImageAccess />
              
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-2">Bucket Content Checker</h3>
                <p className="text-sm text-gray-500 mb-4">
                  List files in the processed_images bucket
                </p>
                
                <Button 
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.storage
                        .from('processed_images')
                        .list();
                        
                      if (error) throw error;
                      
                      console.log('Files in processed_images bucket:', data);
                      toast({
                        title: "Bucket Content Listed",
                        description: `Found ${data?.length || 0} files/folders in bucket. Check console for details.`
                      });
                    } catch (error) {
                      console.error('Error listing bucket content:', error);
                      toast({
                        title: "Error",
                        description: "Failed to list bucket content. See console for details.",
                        variant: "destructive"
                      });
                    }
                  }}
                  size="sm"
                >
                  List Bucket Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminImport;
