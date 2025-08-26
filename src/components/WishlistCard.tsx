import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, CheckCircle, Clock, X, ExternalLink, ShoppingBag } from "lucide-react";

interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  points_goal: number;
  status: string;
  created_at: string;
  approved_at?: string;
  achieved_at?: string;
  item_type?: string;
  affiliate_id?: string;
  product_url?: string;
  product_image_url?: string;
  original_price?: number;
  approved_affiliates?: {
    name: string;
    logo_url?: string;
  };
}

interface WishlistCardProps {
  item: WishlistItem;
  userPoints: number;
  isParent?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onAchieve?: (id: string) => void;
}

export function WishlistCard({ 
  item, 
  userPoints, 
  isParent = false,
  onApprove,
  onReject,
  onAchieve
}: WishlistCardProps) {
  const progress = Math.min((userPoints / item.points_goal) * 100, 100);
  const canAchieve = userPoints >= item.points_goal && item.status === 'approved';

  const getStatusBadge = () => {
    switch (item.status) {
      case 'pending':
        return <Badge variant="outline" className="text-kids-accent"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-kids-secondary text-white"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'achieved':
        return <Badge variant="default" className="bg-kids-accent text-white"><Star className="h-3 w-3 mr-1" />Achieved!</Badge>;
      default:
        return <Badge variant="outline">{item.status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-glow hover:scale-105 transform transition-bounce">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {item.item_type === 'affiliate' && <ShoppingBag className="h-4 w-4 text-muted-foreground" />}
              {item.title}
            </CardTitle>
            {item.approved_affiliates && (
              <div className="text-sm text-muted-foreground mt-1">
                from {item.approved_affiliates.name}
              </div>
            )}
          </div>
          {getStatusBadge()}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
        {item.original_price && (
          <div className="text-sm font-medium text-green-600">
            ${item.original_price.toFixed(2)}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.product_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-md">
            <img 
              src={item.product_image_url} 
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-kids-accent font-bold">
            <Star className="h-4 w-4" />
            {item.points_goal} XP Goal
          </div>
          <div className="text-sm text-muted-foreground">
            {userPoints} / {item.points_goal} XP
          </div>
        </div>
        
        {item.status === 'approved' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-center text-muted-foreground">
              {progress.toFixed(0)}% Complete
            </div>
          </div>
        )}
        
        {isParent && item.status === 'pending' && (
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onApprove?.(item.id)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onReject?.(item.id)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
        
        {!isParent && canAchieve && (
          <Button 
            variant="reward" 
            size="sm" 
            onClick={() => onAchieve?.(item.id)}
            className="w-full"
          >
            <Star className="h-4 w-4 mr-2" />
            Achieve Goal!
          </Button>
        )}
        
        {item.product_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(item.product_url, '_blank')}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Product
          </Button>
        )}
      </CardContent>
    </Card>
  );
}