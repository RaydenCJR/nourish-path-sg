import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ShoppingBag, Apple, Milk, Beef, Fish } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroceryItem {
  id: string;
  name: string;
  completed: boolean;
  category?: string;
}

interface GroceryListProps {
  items: GroceryItem[];
  onItemsChange: (items: GroceryItem[]) => void;
}

const categoryIcons = {
  fruits: Apple,
  dairy: Milk,
  meat: Beef,
  seafood: Fish,
  default: ShoppingBag,
};

const getItemCategory = (itemName: string): string => {
  const name = itemName.toLowerCase();
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('fruit')) return 'fruits';
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('dairy')) return 'dairy';
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('meat')) return 'meat';
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') || name.includes('seafood')) return 'seafood';
  return 'default';
};

export const GroceryList: React.FC<GroceryListProps> = ({ items, onItemsChange }) => {
  const [newItem, setNewItem] = useState('');
  const { toast } = useToast();

  const addItem = () => {
    if (!newItem.trim()) return;

    const item: GroceryItem = {
      id: Date.now().toString(),
      name: newItem.trim(),
      completed: false,
      category: getItemCategory(newItem)
    };

    onItemsChange([...items, item]);
    setNewItem('');
    toast({
      title: "Item Added",
      description: `${item.name} added to your grocery list`,
    });
  };

  const toggleItem = (id: string) => {
    onItemsChange(
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeItem = (id: string) => {
    const item = items.find(i => i.id === id);
    onItemsChange(items.filter(item => item.id !== id));
    if (item) {
      toast({
        title: "Item Removed",
        description: `${item.name} removed from your list`,
        variant: "destructive"
      });
    }
  };

  const clearCompleted = () => {
    const completedCount = items.filter(item => item.completed).length;
    onItemsChange(items.filter(item => !item.completed));
    toast({
      title: "List Cleaned",
      description: `${completedCount} completed items removed`,
    });
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            🛍️ My Grocery List
          </span>
          {totalCount > 0 && (
            <Badge variant="outline">
              {completedCount}/{totalCount} completed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder="Add grocery item (e.g., Bananas, Milk, Chicken...)"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="flex-1"
          />
          <Button onClick={addItem} variant="fresh">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-fresh-green to-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}

        {/* Items list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your grocery list is empty</p>
              <p className="text-sm">Add items above to get started!</p>
            </div>
          ) : (
            items.map((item) => {
              const CategoryIcon = categoryIcons[item.category as keyof typeof categoryIcons] || categoryIcons.default;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    item.completed 
                      ? 'bg-muted/50 opacity-60' 
                      : 'bg-card hover:shadow-md'
                  }`}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                  <span 
                    className={`flex-1 ${
                      item.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.category && item.category !== 'default' && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        {completedCount > 0 && (
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="text-muted-foreground"
            >
              Clear completed ({completedCount})
            </Button>
          </div>
        )}

        {/* Quick add suggestions */}
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {['Milk', 'Bread', 'Eggs', 'Bananas', 'Chicken', 'Rice'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewItem(suggestion);
                  addItem();
                }}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};