-- Create wishlist table for kids to set reward goals
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  points_goal INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Kids can create their own wishlist items"
ON public.wishlist_items
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_family_member(family_id));

CREATE POLICY "Kids can view their own wishlist items"
ON public.wishlist_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Kids can update their own pending wishlist items"
ON public.wishlist_items
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Parents can view family wishlist items"
ON public.wishlist_items
FOR SELECT
USING (is_family_parent(family_id));

CREATE POLICY "Parents can approve family wishlist items"
ON public.wishlist_items
FOR UPDATE
USING (is_family_parent(family_id));

-- Create trigger for timestamp updates
CREATE TRIGGER update_wishlist_items_updated_at
BEFORE UPDATE ON public.wishlist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();