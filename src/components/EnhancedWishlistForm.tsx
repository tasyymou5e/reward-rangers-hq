import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, ExternalLink, ShoppingCart } from "lucide-react";
import { useAffiliates } from "@/hooks/useAffiliates";

interface EnhancedWishlistFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    points_goal: number;
    item_type: 'custom' | 'affiliate';
    affiliate_id?: string;
    product_url?: string;
    product_image_url?: string;
    original_price?: number;
  }) => void;
  isLoading?: boolean;
}

export function EnhancedWishlistForm({ onSubmit, isLoading = false }: EnhancedWishlistFormProps) {
  const [activeTab, setActiveTab] = useState('custom');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsGoal, setPointsGoal] = useState(50);
  const [productUrl, setProductUrl] = useState('');
  const [productImage, setProductImage] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number | undefined>();
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
  
  const { affiliates } = useAffiliates();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPointsGoal(50);
    setProductUrl('');
    setProductImage('');
    setOriginalPrice(undefined);
    setSelectedAffiliate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && pointsGoal > 0) {
      const baseData = {
        title: title.trim(),
        description: description.trim(),
        points_goal: pointsGoal,
      };

      if (activeTab === 'affiliate' && selectedAffiliate) {
        onSubmit({
          ...baseData,
          item_type: 'affiliate',
          affiliate_id: selectedAffiliate,
          product_url: productUrl.trim() || undefined,
          product_image_url: productImage.trim() || undefined,
          original_price: originalPrice,
        });
      } else {
        onSubmit({
          ...baseData,
          item_type: 'custom',
        });
      }
      
      resetForm();
    }
  };

  return (
    <Card className="border-2 border-dashed border-kids-accent/30 hover:border-kids-accent/60 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-kids-accent">
          <Plus className="h-5 w-5" />
          Add New Wish
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Custom Wish
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Shop Products
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">What do you wish for?</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeTab === 'affiliate' ? "Product name" : "e.g., New toy, extra screen time, special treat"}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Tell us more (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={activeTab === 'affiliate' ? "Why do you want this product?" : "Why do you want this? Any special details?"}
                rows={3}
              />
            </div>

            <TabsContent value="affiliate" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="affiliate">Choose Store</Label>
                <select
                  id="affiliate"
                  value={selectedAffiliate}
                  onChange={(e) => setSelectedAffiliate(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background"
                  required={activeTab === 'affiliate'}
                >
                  <option value="">Select a store...</option>
                  {affiliates.map((affiliate) => (
                    <option key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {affiliates.map((affiliate) => (
                    <Badge
                      key={affiliate.id}
                      variant={selectedAffiliate === affiliate.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedAffiliate(affiliate.id)}
                    >
                      {affiliate.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productUrl">Product Link (optional)</Label>
                <Input
                  id="productUrl"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productImage">Product Image URL (optional)</Label>
                <Input
                  id="productImage"
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalPrice">Product Price (optional)</Label>
                <Input
                  id="originalPrice"
                  value={originalPrice || ''}
                  onChange={(e) => setOriginalPrice(Number(e.target.value) || undefined)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
            </TabsContent>
            
            <div className="space-y-2">
              <Label htmlFor="points">How many XP should this cost?</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="points"
                  type="number"
                  min="1"
                  max="1000"
                  value={pointsGoal}
                  onChange={(e) => setPointsGoal(Number(e.target.value))}
                  className="w-24"
                  required
                />
                <div className="flex items-center gap-1 text-kids-accent">
                  <Star className="h-4 w-4" />
                  XP
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Ask your parents what they think is fair!
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={!title.trim() || pointsGoal <= 0 || isLoading || (activeTab === 'affiliate' && !selectedAffiliate)}
              className="w-full"
              variant="kids"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Adding Wish...' : 'Add to Wishlist'}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}