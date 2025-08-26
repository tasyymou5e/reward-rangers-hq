import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  user_id: string;
  family_id: string;
  title: string;
  description?: string;
  points_goal: number;
  status: string;
  approved_by?: string;
  approved_at?: string;
  achieved_at?: string;
  created_at: string;
  updated_at: string;
  item_type?: string;
  affiliate_id?: string;
  product_url?: string;
  product_image_url?: string;
  original_price?: number;
  profiles?: {
    display_name: string;
    username: string;
  } | null;
  approved_affiliates?: {
    name: string;
    logo_url?: string;
  } | null;
}

export function useWishlist() {
  const { user, profile } = useAuth();
  const { family } = useFamily();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlistItems = async () => {
    if (!user || !family) return;

    try {
      setLoading(true);
      
      // For parents, fetch all family wishlist items with user profiles and affiliate info
      // For kids, fetch only their own items
      let query = supabase
        .from('wishlist_items')
        .select(`
          *,
          approved_affiliates (
            name,
            logo_url
          )
        `)
        .eq('family_id', family.id);

      if (profile?.role !== 'parent') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately for parent view
      let itemsWithProfiles = data || [];
      if (profile?.role === 'parent' && data?.length > 0) {
        const userIds = [...new Set(data.map(item => item.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', userIds);
          
        itemsWithProfiles = data.map(item => ({
          ...item,
          profiles: profiles?.find(p => p.id === item.user_id) || null
        }));
      }
      
      setWishlistItems(itemsWithProfiles as WishlistItem[]);
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      toast({
        title: "Error",
        description: "Failed to load wishlist items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addWishlistItem = async (data: { 
    title: string; 
    description: string; 
    points_goal: number;
    item_type: 'custom' | 'affiliate';
    affiliate_id?: string;
    product_url?: string;
    product_image_url?: string;
    original_price?: number;
  }) => {
    if (!user || !family) return;

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({
          user_id: user.id,
          family_id: family.id,
          title: data.title,
          description: data.description,
          points_goal: data.points_goal,
          status: 'pending',
          item_type: data.item_type,
          affiliate_id: data.affiliate_id,
          product_url: data.product_url,
          product_image_url: data.product_image_url,
          original_price: data.original_price,
        });

      if (error) throw error;

      toast({
        title: "Wish Added!",
        description: "Your wish has been added and is waiting for parent approval.",
      });

      fetchWishlistItems();
    } catch (error) {
      console.error('Error adding wishlist item:', error);
      toast({
        title: "Error",
        description: "Failed to add wishlist item",
        variant: "destructive",
      });
    }
  };

  const approveWishlistItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Wish Approved!",
        description: "The wishlist item has been approved.",
      });

      fetchWishlistItems();
    } catch (error) {
      console.error('Error approving wishlist item:', error);
      toast({
        title: "Error",
        description: "Failed to approve wishlist item",
        variant: "destructive",
      });
    }
  };

  const rejectWishlistItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({
          status: 'rejected'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Wish Rejected",
        description: "The wishlist item has been rejected.",
      });

      fetchWishlistItems();
    } catch (error) {
      console.error('Error rejecting wishlist item:', error);
      toast({
        title: "Error",
        description: "Failed to reject wishlist item",
        variant: "destructive",
      });
    }
  };

  const achieveWishlistItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({
          status: 'achieved',
          achieved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "🎉 Goal Achieved!",
        description: "Congratulations! You've reached your goal!",
      });

      fetchWishlistItems();
    } catch (error) {
      console.error('Error achieving wishlist item:', error);
      toast({
        title: "Error",
        description: "Failed to mark as achieved",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user && family) {
      fetchWishlistItems();
    }
  }, [user, family]);

  return {
    wishlistItems,
    loading,
    addWishlistItem,
    approveWishlistItem,
    rejectWishlistItem,
    achieveWishlistItem,
    refetchWishlist: fetchWishlistItems,
  };
}