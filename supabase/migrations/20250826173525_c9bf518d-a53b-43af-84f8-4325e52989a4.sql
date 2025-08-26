-- Create approved affiliates/retailers table
CREATE TABLE public.approved_affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  base_url TEXT NOT NULL,
  api_key_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approved_affiliates ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliates
CREATE POLICY "Everyone can view active affiliates"
ON public.approved_affiliates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage affiliates"
ON public.approved_affiliates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

-- Add affiliate product columns to wishlist_items
ALTER TABLE public.wishlist_items 
ADD COLUMN affiliate_id UUID REFERENCES public.approved_affiliates(id),
ADD COLUMN product_url TEXT,
ADD COLUMN product_image_url TEXT,
ADD COLUMN original_price DECIMAL(10,2),
ADD COLUMN item_type TEXT NOT NULL DEFAULT 'custom';

-- Create trigger for affiliate timestamp updates
CREATE TRIGGER update_approved_affiliates_updated_at
BEFORE UPDATE ON public.approved_affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default approved affiliates
INSERT INTO public.approved_affiliates (name, logo_url, base_url, is_active) VALUES
('Amazon', 'https://logo.clearbit.com/amazon.com', 'https://amazon.com', true),
('Walmart', 'https://logo.clearbit.com/walmart.com', 'https://walmart.com', true),
('Target', 'https://logo.clearbit.com/target.com', 'https://target.com', true),
('Best Buy', 'https://logo.clearbit.com/bestbuy.com', 'https://bestbuy.com', true);