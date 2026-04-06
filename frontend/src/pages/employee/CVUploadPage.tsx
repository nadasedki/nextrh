import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadProgress } from '@/components/common';
import { UploadStatus } from '@/types';
import { Upload, FileText, CheckCircle, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
}

const CVUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<UploadedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Real Upload Handler ---
  const handleUpload = useCallback(async (uploadedFile: File) => {
    // Set UI basic info
    setFile({
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: uploadedFile.type,
    });
    setError(null);
    setUploadStatus('uploading');
    setProgress(10); // Initial progress

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const token = localStorage.getItem('token');
      
      // Update progress to simulate network activity
      const progInterval = setInterval(() => setProgress(prev => (prev < 90 ? prev + 5 : prev)), 200);

      const response = await fetch('http://localhost:3000/cv-parsing/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type is set automatically by the browser for FormData
        },
        body: formData,
      });

      clearInterval(progInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload CV');
      }

      setProgress(100);
      setUploadStatus('parsing');

      // Small delay to let the user see "Parsing" status
      setTimeout(() => {
        setUploadStatus('completed');
      }, 1500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
      setUploadStatus('error');
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile.type === 'application/pdf') {
          handleUpload(droppedFile);
        } else {
          setError('Please upload a PDF file');
        }
      }
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        if (selectedFile.type === 'application/pdf') {
          handleUpload(selectedFile);
        } else {
          setError('Please upload a PDF file');
        }
      }
    },
    [handleUpload]
  );

  const handleReset = () => {
    setFile(null);
    setUploadStatus('idle');
    setProgress(0);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusMessage = (): string => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading your CV to server...';
      case 'parsing':
        return 'Analyzing and extracting sections...';
      case 'completed':
        return 'CV uploaded and parsed successfully!';
      case 'error':
        return error || 'Upload failed. Please try again.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload CV</h1>
        <p className="text-muted-foreground">Automatically update your profile info via CV parsing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CV Document</CardTitle>
          <CardDescription>
            Upload your CV in PDF format. The system will automatically extract your info.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadStatus === 'idle' || uploadStatus === 'error' ? (
            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-12 transition-all duration-200',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50',
                uploadStatus === 'error' && 'border-destructive'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-4">
                <div
                  className={cn(
                    'p-4 rounded-full transition-colors',
                    dragActive ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Upload
                    className={cn(
                      'h-8 w-8 transition-colors',
                      dragActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">
                    {dragActive ? 'Drop your file here' : 'Drag and drop your CV'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF files only (max 10MB)
                  </p>
                </div>
                <Button variant="outline" className="mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>
              {uploadStatus === 'error' && (
                <p className="text-destructive text-sm text-center mt-4">{getStatusMessage()}</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {file && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  {uploadStatus === 'completed' && (
                    <CheckCircle className="h-6 w-6 text-success" />
                  )}
                </div>
              )}

              <div className="space-y-4">
                {(uploadStatus === 'uploading' || uploadStatus === 'parsing') && (
                  <UploadProgress 
                    progress={uploadStatus === 'parsing' ? 100 : progress} 
                    status={getStatusMessage()} 
                  />
                )}

                {uploadStatus === 'parsing' && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Extracting Data...</span>
                  </div>
                )}

                {uploadStatus === 'completed' && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-success">Upload Complete</p>
                        <p className="text-sm text-muted-foreground">
                          Your profile has been updated based on your CV data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps UI */}
            {/* Status Steps UI */}
<div className="flex items-center justify-center gap-2 py-4">
  {['Uploading', 'Parsing', 'Completed'].map((step, index) => {
    // 1. A step is "Active" ONLY if it is currently spinning
    const isActive =
      (index === 0 && uploadStatus === 'uploading') ||
      (index === 1 && uploadStatus === 'parsing');

    // 2. A step is "Completed" if the logic has moved past it
    const isCompleted =
      (index === 0 && ['parsing', 'completed'].includes(uploadStatus)) ||
      (index === 1 && uploadStatus === 'completed') ||
      (index === 2 && uploadStatus === 'completed'); // The final checkmark

    return (
      <React.Fragment key={step}>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
            isActive ? 'bg-primary text-primary-foreground' : 
            isCompleted ? 'bg-success/10 text-success' : 
            'bg-muted text-muted-foreground'
          )}
        >
          {isCompleted ? (
            <CheckCircle className="h-4 w-4" />
          ) : isActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="h-4 w-4 flex items-center justify-center text-xs">
              {index + 1}
            </span>
          )}
          {step}
        </div>
        {index < 2 && (
          <div
            className={cn(
              'w-8 h-0.5 rounded-full',
              // The line turns green if the step BEFORE it is finished
              (index === 0 && ['parsing', 'completed'].includes(uploadStatus)) ||
              (index === 1 && uploadStatus === 'completed')
                ? 'bg-success'
                : 'bg-muted'
            )}
          />
        )}
      </React.Fragment>
    );
  })}
</div>
              </div>

              <div className="flex justify-center gap-3">
                {uploadStatus === 'completed' ? (
                  <>
                    <Button variant="outline" onClick={handleReset}>Upload Another</Button>
                    <Button onClick={() => navigate('/employee/cv-preview')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View CV
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={handleReset}>Cancel</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CVUploadPage;