import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Camera, ShoppingCart, Users, Clock, AlertCircle } from 'lucide-react';
import { GroceryList } from './GroceryList';
import { LocationTracker } from './LocationTracker';
import { BarcodeScanner } from './BarcodeScanner';
import { NutritionDisplay } from './NutritionDisplay';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GroceryApp = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [nearSupermarket, setNearSupermarket] = useState(false);
  const [groceryItems, setGroceryItems] = useState<Array<{id: string, name: string, completed: boolean}>>([]);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [geoPermission, setGeoPermission] = useState<PermissionState>('prompt');
  const [geoError, setGeoError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setGeoError("Location services not supported");
      return;
    }

    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setGeoPermission(permission.state);
        
        permission.addEventListener('change', () => {
          setGeoPermission(permission.state);
        });

        if (permission.state === 'granted') {
          ensureLocationAccess();
        }
      } catch (error) {
        console.log('Permission API not supported, proceeding with location request');
        ensureLocationAccess();
      }
    } else {
      ensureLocationAccess();
    }
  };

  const ensureLocationAccess = () => {
    setGeoError(null);
    
    if (!navigator.geolocation) {
      const error = "Location services not supported";
      setGeoError(error);
      toast({
        title: "Location Not Supported",
        description: error,
        variant: "destructive"
      });
      return;
    }

    // Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setGeoError(null);
        checkNearSupermarket(position);
        console.log('High accuracy location obtained');
      },
      (error) => {
        console.error('High accuracy location error:', error);
        handleLocationError(error, true);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000 // 1 minute
      }
    );
  };

  const handleLocationError = (error: GeolocationPositionError, tryLowAccuracy: boolean = false) => {
    let errorMessage = "Unable to determine your location";
    let shouldTryFallback = false;

    switch (error.code) {
      case 1: // PERMISSION_DENIED
        setGeoPermission('denied');
        errorMessage = "Location access denied. Please enable location permissions.";
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = "Location unavailable. Check your connection or try again.";
        shouldTryFallback = tryLowAccuracy;
        break;
      case 3: // TIMEOUT
        errorMessage = "Location request timed out.";
        shouldTryFallback = tryLowAccuracy;
        break;
    }

    setGeoError(errorMessage);

    if (shouldTryFallback) {
      console.log('Trying low accuracy fallback');
      tryLowAccuracyLocation();
    } else {
      toast({
        title: "Location Issue",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const tryLowAccuracyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setGeoError(null);
        checkNearSupermarket(position);
        console.log('Low accuracy location obtained');
        toast({
          title: "Location Found",
          description: "Using approximate location",
        });
      },
      (error) => {
        console.error('Low accuracy location error:', error);
        handleLocationError(error, false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const checkNearSupermarket = async (position: GeolocationPosition) => {
    try {
      const { data, error } = await supabase.functions.invoke('nearby-supermarkets', {
        body: { 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude, 
          radius: 1 // 1km radius for "near" detection
        }
      });

      if (error) {
        console.error('Error checking nearby supermarkets:', error);
        return;
      }

      if (data.success && data.data.length > 0) {
        // Check if any supermarket is within 500m (0.5km)
        const veryClose = data.data.some((store: any) => store.distance <= 0.5);
        
        if (veryClose && !nearSupermarket) {
          setNearSupermarket(true);
          toast({
            title: "📍 Supermarket Detected!",
            description: "You're near a supermarket. Ready to start shopping?",
          });
        } else if (!veryClose && nearSupermarket) {
          setNearSupermarket(false);
        }
      } else if (nearSupermarket) {
        setNearSupermarket(false);
      }
    } catch (error) {
      console.error('Error calling nearby-supermarkets function:', error);
    }
  };

  const handleProductScanned = (productData: any) => {
    setScannedProduct(productData);
    setActiveTab('nutrition');
  };

  const completedCount = groceryItems.filter(item => item.completed).length;
  const totalCount = groceryItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-fresh-green-light/10 to-citrus-yellow/10">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            🛒 FreshCart
          </h1>
          <p className="text-muted-foreground">Your smart grocery shopping companion</p>
          
          {/* Status Bar */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant={nearSupermarket ? "default" : "secondary"} className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {nearSupermarket ? "Near Supermarket" : "Location Tracking"}
            </Badge>
            
            {totalCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" />
                {completedCount}/{totalCount} items
              </Badge>
            )}
          </div>

          {/* Location Permission Alert */}
          {(!location || geoPermission !== 'granted') && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 border rounded-lg">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {geoPermission === 'denied' 
                    ? "Location access denied" 
                    : geoError || "Location needed for features"}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={ensureLocationAccess}
                  disabled={geoPermission === 'denied'}
                >
                  {geoPermission === 'denied' ? 'Check Settings' : 'Enable Location'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Nutrition
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <GroceryList 
              items={groceryItems}
              onItemsChange={setGroceryItems}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <LocationTracker 
              location={location}
              nearSupermarket={nearSupermarket}
              onRequestLocation={ensureLocationAccess}
              geoPermission={geoPermission}
              geoError={geoError}
            />
          </TabsContent>

          <TabsContent value="scan" className="space-y-4">
            <BarcodeScanner 
              onProductScanned={handleProductScanned}
              nearSupermarket={nearSupermarket}
            />
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <NutritionDisplay 
              product={scannedProduct}
              onScanAgain={() => setActiveTab('scan')}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        {nearSupermarket && (
          <Card className="mt-6 border-fresh-green/30 bg-fresh-green-light/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">🎯 You're at the supermarket!</h3>
                <p className="text-muted-foreground mb-4">Start scanning products to see nutritional information</p>
                <Button 
                  variant="fresh" 
                  onClick={() => setActiveTab('scan')}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanning Products
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};