import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Zap, 
  Droplets, 
  Wheat, 
  AlertTriangle, 
  CheckCircle,
  Star,
  Share2,
  ShoppingCart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NutritionDisplayProps {
  product: any;
  groceryItems?: Array<{id: string, name: string, completed: boolean}>;
  onItemsChange?: (items: Array<{id: string, name: string, completed: boolean}>) => void;
}

const getNutritionScore = (nutrition: any): { score: number; grade: string; color: string } => {
  if (!nutrition) return { score: 0, grade: 'N/A', color: 'gray' };
  
  // Simple scoring algorithm based on calories, sugar, and sodium
  let score = 100;
  
  if (nutrition.calories > 400) score -= 20;
  if (nutrition.sugar > 20) score -= 15;
  if (nutrition.sodium > 1.5) score -= 15;
  if (nutrition.saturatedFat > 10) score -= 10;
  
  // Bonus for protein and fiber
  if (nutrition.protein > 10) score += 5;
  if (nutrition.fiber > 5) score += 5;
  
  score = Math.max(0, Math.min(100, score));
  
  let grade, color;
  if (score >= 85) {
    grade = 'A';
    color = 'text-fresh-green';
  } else if (score >= 70) {
    grade = 'B';
    color = 'text-citrus-yellow';
  } else if (score >= 55) {
    grade = 'C';
    color = 'text-citrus-orange';
  } else {
    grade = 'D';
    color = 'text-berry-red';
  }
  
  return { score, grade, color };
};

const getHealthInsights = (nutrition: any): { positive: string[]; warnings: string[] } => {
  if (!nutrition) return { positive: [], warnings: [] };
  
  const positive = [];
  const warnings = [];
  
  if (nutrition.protein > 10) positive.push('High in protein');
  if (nutrition.fiber > 5) positive.push('Good source of fiber');
  if (nutrition.calories < 200) positive.push('Low calorie option');
  if (nutrition.sodium < 0.5) positive.push('Low sodium');
  if (nutrition.sugar < 5) positive.push('Low sugar');
  
  if (nutrition.calories > 400) warnings.push('High in calories');
  if (nutrition.sugar > 20) warnings.push('High in sugar');
  if (nutrition.sodium > 1.5) warnings.push('High in sodium');
  if (nutrition.saturatedFat > 10) warnings.push('High in saturated fat');
  
  return { positive, warnings };
};

export const NutritionDisplay: React.FC<NutritionDisplayProps> = ({ product, groceryItems = [], onItemsChange }) => {
  const { toast } = useToast();

  if (!product) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Zap className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Product Scanned</h3>
            <p className="text-muted-foreground">
              Scan a product barcode to see detailed nutritional information
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { score, grade, color } = getNutritionScore(product.nutrition);
  const { positive, warnings } = getHealthInsights(product.nutrition);

  const addToList = () => {
    if (!onItemsChange) {
      toast({
        title: "Error",
        description: "Cannot add to list at this time",
        variant: "destructive"
      });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: product.name,
      completed: false
    };

    onItemsChange([...groceryItems, newItem]);
    toast({
      title: "Added to List",
      description: `${product.name} added to your grocery list`,
    });
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out the nutrition info for ${product.name}`,
        url: window.location.href,
      });
    } else {
      toast({
        title: "Product Info",
        description: "Sharing feature not available on this device",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Product Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{product.name}</CardTitle>
              <p className="text-muted-foreground">{product.brand}</p>
              <Badge variant="outline" className="mt-1">
                {product.category}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{product.price}</p>
              <div className={`text-3xl font-bold ${color}`}>
                {grade}
              </div>
              <p className="text-xs text-muted-foreground">Nutrition Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={addToList} variant="fresh" className="flex-1">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to List
            </Button>
            <Button onClick={shareProduct} variant="outline">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Nutrition Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Overall Score</span>
              <span className={`text-2xl font-bold ${color}`}>{score}/100</span>
            </div>
            <Progress value={score} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <div className={`text-4xl font-bold ${color}`}>{grade}</div>
                <p className="text-sm text-muted-foreground">Grade</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{product.nutrition.calories}</div>
                <p className="text-sm text-muted-foreground">kcal per 100g</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      {(positive.length > 0 || warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {positive.length > 0 && (
              <div>
                <h4 className="font-medium text-fresh-green mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Positive Aspects
                </h4>
                <div className="space-y-1">
                  {positive.map((item, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-1">
                      ✓ {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-berry-red mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Consider Moderating
                </h4>
                <div className="space-y-1">
                  {warnings.map((item, index) => (
                    <Badge key={index} variant="destructive" className="mr-2 mb-1">
                      ⚠ {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Nutrition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Nutrition Facts
            <Badge variant="outline" className="ml-auto">
              Per 100g
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Macronutrients */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-citrus-orange" />
                Calories
              </span>
              <span className="font-semibold">{product.nutrition.calories} kcal</span>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Fat</span>
                <span>{product.nutrition.fat}g</span>
              </div>
              <div className="flex justify-between pl-4 text-sm text-muted-foreground">
                <span>Saturated Fat</span>
                <span>{product.nutrition.saturatedFat}g</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <Wheat className="w-4 h-4 text-earth-brown" />
                Carbohydrates
              </span>
              <span>{product.nutrition.carbs}g</span>
            </div>
            <div className="flex justify-between pl-6 text-sm text-muted-foreground">
              <span>Sugar</span>
              <span>{product.nutrition.sugar}g</span>
            </div>
            
            <div className="flex justify-between">
              <span>Protein</span>
              <span>{product.nutrition.protein}g</span>
            </div>
            
            <div className="flex justify-between">
              <span>Fiber</span>
              <span>{product.nutrition.fiber}g</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                Sodium
              </span>
              <span>{product.nutrition.sodium}g</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Barcode: {product.barcode}</p>
            <p>Scanned: {new Date(product.scannedAt).toLocaleString()}</p>
            <p>Location: {product.scanLocation}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};