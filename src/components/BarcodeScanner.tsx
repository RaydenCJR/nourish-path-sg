import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, StopCircle, RotateCcw, Zap, ShoppingCart, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ItemScannerProps {
  onProductScanned: (product: any) => void;
  nearSupermarket: boolean;
}

export const BarcodeScanner: React.FC<ItemScannerProps> = ({ onProductScanned, nearSupermarket }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      });
      setHasPermission(true);
      return stream;
    } catch (error) {
      setHasPermission(false);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access to scan products",
        variant: "destructive"
      });
      return null;
    }
  };

  const startScanning = async () => {
    const stream = await requestCameraPermission();
    if (stream && videoRef.current) {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsScanning(true);
      toast({
        title: "Item Scanner Active",
        description: "Point your camera at any product to identify it",
      });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !isScanning) return;
    
    setIsCapturing(true);
    toast({
      title: "📸 Capturing Image...",
      description: "Using AI to identify the product",
    });

    try {
      // Create canvas element for image capture
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      // Send to AI for identification
      await identifyProductWithAI(null, imageData);
    } catch (error) {
      console.error('Error during image capture and AI identification:', error);
      
      toast({
        title: "❌ Identification Failed",
        description: "Could not identify the product. Please try again with better lighting.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const simulateScan = async () => {
    if (!isScanning) {
      toast({
        title: "⚠️ Camera Required",
        description: "Please start the camera first to scan products",
        variant: "destructive"
      });
      return;
    }
    
    // Use actual camera capture instead of mock data
    await captureImage();
  };

  const identifyProductWithAI = async (barcode?: string | null, imageData?: string) => {
    try {
      const requestBody = barcode ? { barcode } : { imageData };
      
      const { data, error } = await supabase.functions.invoke('identify-product', {
        body: requestBody
      });

      if (error) {
        console.error('Error calling identify-product function:', error);
        throw error;
      }

      if (data?.success && data?.product) {
        const scannedProduct = {
          ...data.product,
          scanLocation: nearSupermarket ? 'In Store' : 'Outside Store'
        };

        setRecentScans(prev => [scannedProduct, ...prev.slice(0, 4)]);
        onProductScanned(scannedProduct);
        
        toast({
          title: "Product Identified! 🤖",
          description: `${data.product.name} - ${data.product.price}`,
        });
      } else {
        throw new Error('Failed to identify product');
      }
    } catch (error) {
      console.error('Error identifying product with AI:', error);
      throw error;
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 100);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              AI Item Scanner
            </span>
            {nearSupermarket && (
              <Badge variant="default" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Ready to scan
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {hasPermission === false 
                      ? "Camera access denied" 
                      : "Ready to identify products"}
                  </p>
                  {!nearSupermarket && (
                    <Badge variant="outline" className="mb-4">
                      Better accuracy when at supermarket
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-fresh-green w-80 h-48 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-fresh-green rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-fresh-green rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-fresh-green rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-fresh-green rounded-br-lg"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                      Position product in frame
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} variant="scan" className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button 
                  onClick={captureImage} 
                  variant="default" 
                  className="flex-1"
                  disabled={isCapturing}
                >
                  <Scan className="w-4 h-4 mr-2" />
                  {isCapturing ? "Analyzing..." : "Capture & Identify"}
                </Button>
                <Button onClick={stopScanning} variant="outline">
                  <StopCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {isScanning && (
              <Button variant="outline" onClick={switchCamera}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Quick Capture Button */}
          {isScanning && (
            <Button 
              onClick={simulateScan} 
              variant="citrus" 
              className="w-full"
              disabled={isCapturing}
            >
              📸 Quick Capture & Identify
            </Button>
          )}

          {hasPermission === false && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Camera access is required to identify products. Please enable camera permissions in your browser settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Recently Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScans.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onProductScanned(product)}
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">
                    📦
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{product.price}</p>
                    <Badge variant="outline" className="text-xs">
                      {product.scanLocation}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-fresh-green-light/20 to-primary/10 border-fresh-green/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-medium mb-2">🎯 Item Scanning Tips</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Position the entire product within the frame</p>
              <p>• Ensure good lighting and clear visibility</p>
              <p>• Hold steady when capturing the image</p>
              <p>• Show product labels and packaging clearly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};