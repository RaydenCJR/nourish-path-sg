import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Camera, ShoppingCart, Users, Clock } from 'lucide-react';
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
  const { toast } = useToast();

  useEffect(() => {
    // Request location permission on app start
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return;
    }

    // Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        checkNearSupermarket(position);
        toast({
          title: "Location Found",
          description: "Location services are working properly",
        });
      },
      (error) => {
        console.error('High accuracy location error:', error);
        // Fallback to low accuracy
        tryLowAccuracyLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  };

  const tryLowAccuracyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        checkNearSupermarket(position);
        toast({
          title: "Location Found",
          description: "Using approximate location",
        });
      },
      (error) => {
        console.error('Low accuracy location error:', error);
        let errorMessage = "Unable to determine your location";
        
        if (error.code === 1) {
          errorMessage = "Location access denied. Please allow location access and refresh the page.";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Please check your internet connection or try again later.";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please try again.";
        }

        toast({
          title: "Location Issue",
          description: errorMessage,
          variant: "destructive"
        });
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