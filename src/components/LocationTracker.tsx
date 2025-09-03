import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Store, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocationTrackerProps {
  location: GeolocationPosition | null;
  nearSupermarket: boolean;
}

interface Supermarket {
  id: string;
  name: string;
  address: string;
  distance: number;
  type: string;
  phone?: string;
  opening_hours?: string;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({ location, nearSupermarket }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<Supermarket[]>([]);
  const [cheapestNearby, setCheapestNearby] = useState<Supermarket[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  // Get price ranking for store types (lower number = cheaper)
  const getStorePriceRanking = (type: string): number => {
    switch (type) {
      case 'Sheng Siong':
        return 1; // Generally cheapest
      case 'Giant':
        return 2;
      case 'FairPrice':
        return 3;
      case 'Cold Storage':
        return 4;
      case 'FairPrice Finest':
        return 5; // Generally most expensive
      default:
        return 3;
    }
  };

  // Fetch nearby supermarkets from the database
  const fetchNearbySupermarkets = async (latitude: number, longitude: number) => {
    setIsLoadingStores(true);
    try {
      // Fetch regular nearby stores (5km radius)
      const { data, error } = await supabase.functions.invoke('nearby-supermarkets', {
        body: { latitude, longitude, radius: 5 }
      });

      // Fetch very close stores for cheapest section (35m = 0.035km)
      const { data: cheapestData, error: cheapestError } = await supabase.functions.invoke('nearby-supermarkets', {
        body: { latitude, longitude, radius: 0.035 }
      });

      if (error) {
        console.error('Error fetching nearby supermarkets:', error);
        return;
      }

      if (data.success) {
        setNearbyStores(data.data);
        console.log(`Found ${data.count} nearby supermarkets`);
      }

      if (!cheapestError && cheapestData.success) {
        // Sort by price ranking (cheapest first)
        const cheapestSorted = cheapestData.data.sort((a: Supermarket, b: Supermarket) => {
          return getStorePriceRanking(a.type) - getStorePriceRanking(b.type);
        });
        setCheapestNearby(cheapestSorted);
        console.log(`Found ${cheapestData.count} supermarkets within 35m`);
      }
    } catch (error) {
      console.error('Error calling nearby-supermarkets function:', error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchNearbySupermarkets(location.coords.latitude, location.coords.longitude);
      setLastUpdate(new Date());
    }
  }, [location]);

  const refreshLocation = () => {
    setIsTracking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchNearbySupermarkets(position.coords.latitude, position.coords.longitude);
        setLastUpdate(new Date());
        setIsTracking(false);
      },
      (error) => {
        console.error('Location error:', error);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const openInGoogleMaps = (address: string, name: string) => {
    const encodedAddress = encodeURIComponent(`${name}, ${address}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const getStoreIcon = (type: string) => {
    switch (type) {
      case 'FairPrice':
      case 'FairPrice Finest':
        return '🛒';
      case 'Cold Storage':
        return '❄️';
      case 'Giant':
        return '🏪';
      case 'Sheng Siong':
        return '🏬';
      default:
        return '🏪';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Your Location
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshLocation}
              disabled={isTracking}
            >
              <RefreshCw className={`w-4 h-4 ${isTracking ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={nearSupermarket ? "default" : "secondary"}>
                  {nearSupermarket ? "At Supermarket" : "Location Active"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lastUpdate.toLocaleTimeString()}
                </Badge>
               </div>
               
               {!nearSupermarket && (
                 <div className="text-sm text-muted-foreground">
                   <p>Latitude: {location.coords.latitude.toFixed(6)}</p>
                   <p>Longitude: {location.coords.longitude.toFixed(6)}</p>
                   <p>Accuracy: ±{location.coords.accuracy.toFixed(0)}m</p>
                 </div>
               )}

               {nearSupermarket && (
                 <div className="p-3 bg-fresh-green-light/20 border border-fresh-green/30 rounded-lg">
                   <p className="text-sm font-medium text-fresh-green">
                     🎯 You're near a supermarket! Perfect time to start shopping.
                   </p>
                 </div>
               )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Navigation className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Location not available</p>
              <p className="text-xs text-muted-foreground mb-3">
                Make sure location services are enabled in your browser
              </p>
              <Button variant="outline" size="sm" onClick={refreshLocation} className="mt-2">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearby Supermarkets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Nearby Supermarkets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStores ? (
            <div className="text-center py-6">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Finding nearby supermarkets...</p>
            </div>
          ) : nearbyStores.length > 0 ? (
            <div className="space-y-3">
              {nearbyStores.slice(0, 3).map((store) => (
                <div
                  key={store.id}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    store.distance <= 0.5 
                      ? 'bg-fresh-green-light/20 border-fresh-green/30 hover:bg-fresh-green-light/30' 
                      : 'bg-card hover:shadow-md hover:bg-accent/50'
                  }`}
                  onClick={() => openInGoogleMaps(store.address, store.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getStoreIcon(store.type)}</span>
                      <div>
                        <h3 className="font-medium">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">{store.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {store.distance} km away
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {store.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {store.distance <= 0.5 && (
                        <Badge variant="default" className="text-xs">
                          Nearby
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Tap for directions
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {nearbyStores.length > 3 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Showing top 3 nearest • {nearbyStores.length - 3} more nearby
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No supermarkets found nearby</p>
              <p className="text-sm">Enable location to see nearby stores</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cheapest Within 35m */}
      {cheapestNearby.length > 0 && (
        <Card className="bg-gradient-to-r from-fresh-green/10 to-citrus-yellow/10 border-fresh-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              Cheapest Within 35m
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cheapestNearby.slice(0, 2).map((store, index) => (
                <div
                  key={store.id}
                  className="p-3 rounded-lg border bg-white/50 hover:bg-white/70 transition-all duration-200 cursor-pointer"
                  onClick={() => openInGoogleMaps(store.address, store.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl">{getStoreIcon(store.type)}</span>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs mt-1 bg-fresh-green">
                            Best Deal
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">{store.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(store.distance * 1000)}m away
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {store.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-fresh-green font-medium">
                        {getStorePriceRanking(store.type) === 1 ? '$ Budget' : 
                         getStorePriceRanking(store.type) === 2 ? '$$ Value' : '$$$'}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Tap for directions
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shopping Tips */}
      <Card className="bg-gradient-to-r from-citrus-orange/10 to-citrus-yellow/10 border-citrus-orange/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-medium mb-2">💡 Pro Shopping Tips</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Shop during off-peak hours for better deals</p>
              <p>• Check store apps for digital coupons</p>
              <p>• Compare prices using the scanner feature</p>
              <p>• Look for store brands to save money</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};