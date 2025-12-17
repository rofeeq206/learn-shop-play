-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create cart items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products policies (public read)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cart items policies
CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Order items policies
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.categories (name, slug, description, image_url) VALUES
  ('Electronics', 'electronics', 'Smartphones, laptops, and gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
  ('Fashion', 'fashion', 'Clothing, shoes, and accessories', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'),
  ('Home & Garden', 'home-garden', 'Furniture, decor, and outdoor items', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400'),
  ('Sports', 'sports', 'Sports equipment and activewear', 'https://images.unsplash.com/photo-1461896836934- voices/photo-1461896836934-ffe607ba8211?w=400'),
  ('Books', 'books', 'Books, magazines, and stationery', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'),
  ('Beauty', 'beauty', 'Skincare, makeup, and fragrances', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400');

-- Insert sample products
INSERT INTO public.products (name, slug, description, price, original_price, image_url, category_id, stock_quantity, is_featured, rating, review_count) VALUES
  ('Wireless Bluetooth Headphones', 'wireless-bluetooth-headphones', 'Premium noise-canceling headphones with 30-hour battery life', 149.99, 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', (SELECT id FROM categories WHERE slug = 'electronics'), 50, true, 4.5, 128),
  ('Smart Watch Pro', 'smart-watch-pro', 'Advanced fitness tracking with heart rate monitor', 299.99, NULL, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', (SELECT id FROM categories WHERE slug = 'electronics'), 35, true, 4.7, 256),
  ('Laptop Stand Aluminum', 'laptop-stand-aluminum', 'Ergonomic aluminum stand for laptops up to 17 inches', 49.99, 69.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', (SELECT id FROM categories WHERE slug = 'electronics'), 100, false, 4.3, 89),
  ('Mechanical Keyboard RGB', 'mechanical-keyboard-rgb', 'Cherry MX switches with customizable RGB lighting', 129.99, NULL, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400', (SELECT id FROM categories WHERE slug = 'electronics'), 75, true, 4.6, 312),
  ('Wireless Mouse Ergonomic', 'wireless-mouse-ergonomic', 'Comfortable grip with precision tracking', 39.99, 49.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', (SELECT id FROM categories WHERE slug = 'electronics'), 200, false, 4.2, 156),
  ('Premium Cotton T-Shirt', 'premium-cotton-tshirt', '100% organic cotton, available in multiple colors', 29.99, NULL, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', (SELECT id FROM categories WHERE slug = 'fashion'), 500, false, 4.4, 89),
  ('Leather Messenger Bag', 'leather-messenger-bag', 'Genuine leather with laptop compartment', 159.99, 199.99, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', (SELECT id FROM categories WHERE slug = 'fashion'), 45, true, 4.8, 67),
  ('Running Sneakers', 'running-sneakers', 'Lightweight with responsive cushioning', 119.99, 149.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', (SELECT id FROM categories WHERE slug = 'fashion'), 80, true, 4.5, 234),
  ('Denim Jacket Classic', 'denim-jacket-classic', 'Timeless style with modern fit', 89.99, NULL, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400', (SELECT id FROM categories WHERE slug = 'fashion'), 60, false, 4.3, 45),
  ('Minimalist Wall Clock', 'minimalist-wall-clock', 'Silent movement, modern design', 34.99, 44.99, 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400', (SELECT id FROM categories WHERE slug = 'home-garden'), 120, false, 4.1, 78),
  ('Indoor Plant Set', 'indoor-plant-set', 'Set of 3 low-maintenance indoor plants', 49.99, NULL, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400', (SELECT id FROM categories WHERE slug = 'home-garden'), 40, true, 4.6, 156),
  ('Yoga Mat Premium', 'yoga-mat-premium', 'Extra thick, non-slip surface', 44.99, 59.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', (SELECT id FROM categories WHERE slug = 'sports'), 150, false, 4.4, 203),
  ('Dumbbell Set 20kg', 'dumbbell-set-20kg', 'Adjustable weight set for home workouts', 79.99, 99.99, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', (SELECT id FROM categories WHERE slug = 'sports'), 30, true, 4.7, 89),
  ('Best Seller Novel Collection', 'bestseller-novel-collection', 'Top 5 fiction books of the year', 59.99, 79.99, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', (SELECT id FROM categories WHERE slug = 'books'), 200, true, 4.9, 312),
  ('Skincare Starter Kit', 'skincare-starter-kit', 'Complete routine for glowing skin', 69.99, 89.99, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', (SELECT id FROM categories WHERE slug = 'beauty'), 85, true, 4.5, 178);