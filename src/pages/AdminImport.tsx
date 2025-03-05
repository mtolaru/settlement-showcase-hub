
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminImport = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<string>('');
  const [imagesUploaded, setImagesUploaded] = useState<{name: string, url: string}[]>([]);
  const [tab, setTab] = useState('data');
  const [isDeletingImages, setIsDeletingImages] = useState(false);

  // Handle JSON file upload
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

      // Call the Edge Function to handle the import
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

  // Handle image files upload
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
        
        // Extract settlement number from filename if possible (e.g., "settlement_1.jpg")
        const match = file.name.match(/settlement_(\d+)/i);
        let customFilename = '';
        
        if (match && match[1]) {
          customFilename = `processed_images/settlement_${match[1]}`;
        }
        
        // Create a form for the file upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Add custom filename if it was extracted
        if (customFilename) {
          formData.append('customFilename', customFilename);
        }

        // Call the Edge Function to handle the file upload
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

  // Handle deleting all images
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">Import Settlements</TabsTrigger>
          <TabsTrigger value="images">Upload Images</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default AdminImport;
