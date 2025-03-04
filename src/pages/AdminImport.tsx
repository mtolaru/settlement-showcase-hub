
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, Image, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminImport = () => {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUploadProgress, setImageUploadProgress] = useState<{[key: string]: {status: string, url?: string}}>({}); 
  const [importResults, setImportResults] = useState<any>(null);
  const { toast } = useToast();

  // Handler for JSON file drop
  const onDropJson = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === "application/json" || file.name.endsWith('.json')) {
        setJsonFile(file);
        toast({
          title: "JSON file selected",
          description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a JSON file",
        });
      }
    }
  }, [toast]);

  // Handler for image files drop
  const onDropImages = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setImageFiles(prev => [...prev, ...imageFiles]);
      toast({
        title: "Images added",
        description: `${imageFiles.length} images selected for upload`,
      });
    }
  }, [toast]);

  // Setup dropzones
  const { getRootProps: getJsonRootProps, getInputProps: getJsonInputProps } = useDropzone({
    onDrop: onDropJson,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1
  });

  const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps } = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  });

  // Process JSON import
  const processImport = async () => {
    if (!jsonFile) {
      toast({
        variant: "destructive",
        title: "No JSON file",
        description: "Please select a JSON file first",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Read JSON file
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const fileContent = e.target?.result as string;
          const parsedData = JSON.parse(fileContent);
          
          // Call the import function
          const { data, error } = await supabase.functions.invoke('import-settlements', {
            body: { settlements: parsedData }
          });

          if (error) throw error;
          
          setImportResults(data);
          toast({
            title: "Import complete",
            description: data.message,
          });
        } catch (err: any) {
          console.error('Error processing JSON:', err);
          toast({
            variant: "destructive",
            title: "Import failed",
            description: err.message || "Failed to process JSON data",
          });
        }
      };
      fileReader.readAsText(jsonFile);
    } catch (err: any) {
      console.error('Error reading file:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "An error occurred while reading the file",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload images
  const uploadImages = async () => {
    if (imageFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "No images selected",
        description: "Please select at least one image to upload",
      });
      return;
    }

    // Initialize progress tracker
    const newProgress = {...imageUploadProgress};
    imageFiles.forEach(file => {
      if (!newProgress[file.name]) {
        newProgress[file.name] = { status: 'pending' };
      }
    });
    setImageUploadProgress(newProgress);

    // Process each image
    for (const file of imageFiles) {
      if (imageUploadProgress[file.name]?.status === 'completed') continue;
      
      try {
        setImageUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'uploading' }
        }));

        // Create form data for the file
        const formData = new FormData();
        formData.append('file', file);
        
        // Call the upload function
        const { data, error } = await supabase.functions.invoke('upload-settlement-image', {
          body: formData
        });

        if (error) throw error;
        
        setImageUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'completed', url: data.publicUrl }
        }));
      } catch (err: any) {
        console.error(`Error uploading ${file.name}:`, err);
        setImageUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'error' }
        }));
      }
    }

    toast({
      title: "Image uploads complete",
      description: `Processed ${imageFiles.length} images`,
    });
  };

  // Clear selected files
  const clearFiles = () => {
    setJsonFile(null);
    setImageFiles([]);
    setImageUploadProgress({});
    setImportResults(null);
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Import Settlements</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Step 1: Import JSON Data</h2>
        
        <div 
          {...getJsonRootProps()} 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-4 hover:border-primary-400 transition-colors"
        >
          <input {...getJsonInputProps()} />
          <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
          <p className="font-medium">Drag and drop your JSON file here</p>
          <p className="text-sm text-neutral-500">or click to select file</p>
        </div>
        
        {jsonFile && (
          <div className="flex items-center justify-between bg-neutral-50 p-3 rounded mb-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <p className="font-medium">{jsonFile.name}</p>
                <p className="text-sm text-neutral-500">{(jsonFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                setJsonFile(null);
              }}
            >
              Remove
            </Button>
          </div>
        )}
        
        <Button 
          onClick={processImport} 
          disabled={!jsonFile || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Import Settlements"
          )}
        </Button>
        
        {importResults && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium flex items-center text-green-700">
              <Check className="h-5 w-5 mr-1" />
              Import Results
            </h3>
            <p className="text-sm text-green-700 mt-1">{importResults.message}</p>
            {importResults.results?.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-600">Errors:</p>
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {importResults.results.errors.map((error: any, i: number) => (
                    <li key={i}>{`Chunk ${error.chunk}: ${error.error}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Step 2: Upload Attorney Images</h2>
        
        <div 
          {...getImagesRootProps()} 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-4 hover:border-primary-400 transition-colors"
        >
          <input {...getImagesInputProps()} />
          <Image className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
          <p className="font-medium">Drag and drop attorney photos here</p>
          <p className="text-sm text-neutral-500">or click to select multiple images</p>
        </div>
        
        {imageFiles.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Selected Images ({imageFiles.length})</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setImageFiles([])}
              >
                Clear All
              </Button>
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded">
              {imageFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 mr-3 bg-neutral-100 rounded overflow-hidden">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {imageUploadProgress[file.name]?.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 text-primary-500 animate-spin mr-2" />
                    )}
                    {imageUploadProgress[file.name]?.status === 'completed' && (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    )}
                    {imageUploadProgress[file.name]?.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          onClick={uploadImages} 
          disabled={imageFiles.length === 0}
          className="w-full mb-4"
        >
          Upload Images
        </Button>
        
        <div className="bg-neutral-50 p-4 rounded text-sm">
          <h3 className="font-medium mb-1">Important Notes:</h3>
          <ul className="list-disc list-inside space-y-1 text-neutral-600">
            <li>Images should follow the naming convention used in your JSON file</li>
            <li>Supported formats: JPG, PNG, WebP</li>
            <li>Maximum file size: 5MB per image</li>
            <li>After uploading, copy the URLs provided to update your JSON data</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={clearFiles}>
          Clear All
        </Button>
        <Button onClick={() => window.location.href = '/settlements'}>
          Go to Settlements
        </Button>
      </div>
    </div>
  );
};

export default AdminImport;
