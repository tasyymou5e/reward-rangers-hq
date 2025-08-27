import { useAffiliates } from '@/hooks/useAffiliates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Image } from 'lucide-react';

interface AffiliateDisplayProps {
  title?: string;
  description?: string;
}

export function AffiliateDisplay({ 
  title = "Partner Stores", 
  description = "Shop with our trusted partners" 
}: AffiliateDisplayProps) {
  const { affiliates, loading } = useAffiliates();

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="text-2xl animate-spin">🔄</div>
              <p className="text-muted-foreground">Loading partners...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (affiliates.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No partner stores available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {affiliates.map((affiliate) => (
            <div
              key={affiliate.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.open(affiliate.base_url, '_blank', 'noopener,noreferrer')}
            >
              <div className="flex items-center gap-3">
                {affiliate.logo_url ? (
                  <img
                    src={affiliate.logo_url}
                    alt={`${affiliate.name} logo`}
                    className="h-10 w-10 object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs font-bold';
                        fallback.textContent = affiliate.name.substring(0, 2).toUpperCase();
                        parent.insertBefore(fallback, target);
                      }
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-600 text-xs font-bold">
                    {affiliate.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{affiliate.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Shop now</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {affiliates.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {affiliates.length} Partner{affiliates.length > 1 ? 's' : ''}
              </Badge>
              <span>•</span>
              <span>Click to visit store</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}