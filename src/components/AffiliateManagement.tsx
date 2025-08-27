import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, ExternalLink, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Affiliate {
  id: string;
  name: string;
  logo_url?: string;
  base_url: string;
  api_key_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AffiliateManagement() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    base_url: '',
    api_key_name: '',
    is_active: true,
  });

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('approved_affiliates')
        .select('*')
        .order('name');

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.base_url.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and Base URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingAffiliate) {
        const { error } = await supabase
          .from('approved_affiliates')
          .update({
            name: formData.name.trim(),
            logo_url: formData.logo_url.trim() || null,
            base_url: formData.base_url.trim(),
            api_key_name: formData.api_key_name.trim() || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAffiliate.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Affiliate updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('approved_affiliates')
          .insert({
            name: formData.name.trim(),
            logo_url: formData.logo_url.trim() || null,
            base_url: formData.base_url.trim(),
            api_key_name: formData.api_key_name.trim() || null,
            is_active: formData.is_active,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Affiliate created successfully",
        });
      }

      resetForm();
      setShowDialog(false);
      loadAffiliates();
    } catch (error) {
      console.error('Error saving affiliate:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingAffiliate ? 'update' : 'create'} affiliate`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setFormData({
      name: affiliate.name,
      logo_url: affiliate.logo_url || '',
      base_url: affiliate.base_url,
      api_key_name: affiliate.api_key_name || '',
      is_active: affiliate.is_active,
    });
    setShowDialog(true);
  };

  const handleDelete = async (affiliateId: string) => {
    try {
      const { error } = await supabase
        .from('approved_affiliates')
        .delete()
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Affiliate deleted successfully",
      });
      
      loadAffiliates();
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      toast({
        title: "Error",
        description: "Failed to delete affiliate",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async (affiliate: Affiliate) => {
    try {
      const { error } = await supabase
        .from('approved_affiliates')
        .update({
          is_active: !affiliate.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Affiliate ${!affiliate.is_active ? 'activated' : 'deactivated'}`,
      });
      
      loadAffiliates();
    } catch (error) {
      console.error('Error toggling affiliate status:', error);
      toast({
        title: "Error",
        description: "Failed to update affiliate status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      base_url: '',
      api_key_name: '',
      is_active: true,
    });
    setEditingAffiliate(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-muted-foreground">Loading affiliates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-admin-primary">Affiliate Management</h2>
          <p className="text-muted-foreground">Manage affiliate partners displayed to families</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-admin-primary hover:bg-admin-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Affiliate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAffiliate ? 'Edit Affiliate' : 'Add New Affiliate'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Affiliate partner name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_url">Base URL *</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key_name">API Key Name</Label>
                  <Input
                    id="api_key_name"
                    value={formData.api_key_name}
                    onChange={(e) => setFormData({ ...formData, api_key_name: e.target.value })}
                    placeholder="AFFILIATE_API_KEY"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-admin-primary hover:bg-admin-primary/90">
                  {editingAffiliate ? 'Update' : 'Create'} Affiliate
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Affiliate Partners ({affiliates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="text-center py-8">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No affiliates found</p>
              <p className="text-sm text-muted-foreground">Add your first affiliate partner to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium">{affiliate.name}</TableCell>
                    <TableCell>
                      <a
                        href={affiliate.base_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {affiliate.base_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      {affiliate.logo_url ? (
                        <img
                          src={affiliate.logo_url}
                          alt={`${affiliate.name} logo`}
                          className="h-8 w-8 object-contain rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">No logo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {affiliate.api_key_name ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {affiliate.api_key_name}
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={affiliate.is_active}
                          onCheckedChange={() => toggleActiveStatus(affiliate)}
                        />
                        <Badge
                          variant={affiliate.is_active ? 'default' : 'secondary'}
                          className={affiliate.is_active ? 'bg-green-500' : 'bg-gray-500'}
                        >
                          {affiliate.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(affiliate.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(affiliate)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Affiliate</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{affiliate.name}"? This action cannot be undone and will remove the affiliate from all family portals.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(affiliate.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}