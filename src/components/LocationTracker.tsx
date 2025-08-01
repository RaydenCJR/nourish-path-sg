import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Store, Clock, RefreshCw } from 'lucide-react';

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
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({ location, nearSupermarket }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<Supermarket[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock data for Singapore supermarkets
  const singaporeSupermarkets: Supermarket[] = [
    {
      id: '1',
      name: 'FairPrice Orchard',
      address: 'Orchard Road, Singapore 238801',
      distance: 0.3,
      type: 'FairPrice'
    },
    {
      id: '2',
      name: 'Cold Storage Marina Bay',
      address: 'Marina Bay Sands, Singapore 018956',
      distance: 0.8,
      type: 'Cold Storage'
    },
    {
      id: '3',
      name: 'Giant Tampines',
      address: 'Tampines Central, Singapore 529510',
      distance: 1.2,
      type: 'Giant'
    },
    {
      id: '4',
      name: 'Sheng Siong Bedok',
      address: 'Bedok Mall, Singapore 469332',
      distance: 1.5,
      type: 'Sheng Siong'
    },
    {
      id: '5',
      name: 'FairPrice Finest Bukit Timah',
      address: 'Bukit Timah Road, Singapore 269718',
      distance: 2.1,
      type: 'FairPrice Finest'
    }
  ];

  useEffect(() => {
    if (location) {
      setNearbyStores(singaporeSupermarkets);
      setLastUpdate(new Date());
    }
  }, [location]);

  const refreshLocation = () => {
    setIsTracking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLastUpdate(new Date());
        setIsTracking(false);
      },
      (error) => {
        console.error('Location error:', error);
        setIsTracking(false);
      }
    );
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
              
              <div className="text-sm text-muted-foreground">
                <p>Latitude: {location.coords.latitude.toFixed(6)}</p>
                <p>Longitude: {location.coords.longitude.toFixed(6)}</p>
                <p>Accuracy: ±{location.coords.accuracy.toFixed(0)}m</p>
              </div>

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
              <Button variant="outline" size="sm" onClick={refreshLocation} className="mt-2">
                Enable Location Access
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
          {nearbyStores.length > 0 ? (
            <div className="space-y-3">
              {nearbyStores.map((store) => (
                <div
                  key={store.id}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    store.distance <= 0.5 
                      ? 'bg-fresh-green-light/20 border-fresh-green/30' 
                      : 'bg-card hover:shadow-md'
                  }`}
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
                    
                    {store.distance <= 0.5 && (
                      <Badge variant="default" className="text-xs">
                        Nearby
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
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