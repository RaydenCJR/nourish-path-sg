import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, StopCircle, RotateCcw, Zap, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onProductScanned: (product: any) => void;
  nearSupermarket: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onProductScanned, nearSupermarket }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Mock product database
  const mockProducts = {
    '8901030896491': {
      name: 'Britannia Good Day Butter Cookies',
      brand: 'Britannia',
      barcode: '8901030896491',
      category: 'Biscuits & Cookies',
      price: 'S$2.95',
      nutrition: {
        calories: 456,
        fat: 16.2,
        saturatedFat: 8.1,
        carbs: 71.4,
        sugar: 29.7,
        protein: 7.2,
        sodium: 0.34,
        fiber: 2.1
      }
    },
    '8901030896481': {
      name: 'Maggi 2-Minute Noodles Curry',
      brand: 'Maggi',
      barcode: '8901030896481',
      category: 'Instant Noodles',
      price: 'S$1.20',
      nutrition: {
        calories: 387,
        fat: 13.6,
        saturatedFat: 6.8,
        carbs: 58.4,
        sugar: 4.2,
        protein: 9.8,
        sodium: 1.87,
        fiber: 3.2
      }
    },
    '1234567890123': {
      name: 'Fresh Banana (Per kg)',
      brand: 'Local Farm',
      barcode: '1234567890123',
      category: 'Fresh Fruits',
      price: 'S$3.50/kg',
      nutrition: {
        calories: 89,
        fat: 0.3,
        saturatedFat: 0.1,
        carbs: 22.8,
        sugar: 12.2,
        protein: 1.1,
        sodium: 0.001,
        fiber: 2.6
      }
    }
  };

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
        title: "Scanner Active",
        description: "Point your camera at a product barcode",
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

  const simulateScan = () => {
    // Simulate scanning by randomly selecting a product
    const barcodes = Object.keys(mockProducts);
    const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)];
    const product = mockProducts[randomBarcode as keyof typeof mockProducts];
    
    const scannedProduct = {
      ...product,
      scannedAt: new Date().toISOString(),
      scanLocation: nearSupermarket ? 'In Store' : 'Outside Store'
    };

    setRecentScans(prev => [scannedProduct, ...prev.slice(0, 4)]);
    onProductScanned(scannedProduct);
    
    toast({
      title: "Product Scanned! 📦",
      description: `${product.name} - ${product.price}`,
    });
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
              <Camera className="w-5 h-5" />
              Barcode Scanner
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
                      : "Ready to scan products"}
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
                <div className="border-2 border-fresh-green w-64 h-32 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-fresh-green rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-fresh-green rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-fresh-green rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-fresh-green rounded-br-lg"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-fresh-green animate-pulse"></div>
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
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Scanning
              </Button>
            )}
            
            <Button variant="outline" onClick={switchCamera}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Demo Button */}
          <Button 
            onClick={simulateScan} 
            variant="citrus" 
            className="w-full"
          >
            📱 Demo: Simulate Product Scan
          </Button>

          {hasPermission === false && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Camera access is required to scan barcodes. Please enable camera permissions in your browser settings.
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
              Recent Scans
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
            <h3 className="font-medium mb-2">🎯 Scanning Tips</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Hold your phone steady over the barcode</p>
              <p>• Ensure good lighting for best results</p>
              <p>• Try different angles if scanning fails</p>
              <p>• Clean your camera lens for clarity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};