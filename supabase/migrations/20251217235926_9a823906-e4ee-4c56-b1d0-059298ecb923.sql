-- First drop all dependent policies
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Change column to text temporarily
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;

-- Now drop the enum
DROP TYPE IF EXISTS public.app_role;

-- Create new comprehensive enum
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'admin',
  'product_staff',
  'order_fulfillment',
  'customer_support',
  'finance',
  'marketing',
  'customer'
);

-- Convert existing roles to new system
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'customer' WHERE role = 'user';
UPDATE public.user_roles SET role = 'admin' WHERE role = 'moderator';

-- Convert column back to enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Recreate the has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any staff role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'product_staff', 'order_fulfillment', 'customer_support', 'finance', 'marketing')
  )
$$;

-- Create function to check if user can manage staff
CREATE OR REPLACE FUNCTION public.can_manage_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'customer');
  
  RETURN new;
END;
$$;

-- Recreate RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (is_staff(auth.uid()));

-- RLS policies for orders
CREATE POLICY "Staff can view all orders" ON public.orders FOR SELECT USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'order_fulfillment') OR has_role(auth.uid(), 'customer_support') OR has_role(auth.uid(), 'finance')
);

CREATE POLICY "Order staff can update orders" ON public.orders FOR UPDATE USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'order_fulfillment')
);

-- RLS policies for order_items
CREATE POLICY "Staff can view all order items" ON public.order_items FOR SELECT USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'order_fulfillment') OR has_role(auth.uid(), 'customer_support') OR has_role(auth.uid(), 'finance')
);

-- RLS policies for products
CREATE POLICY "Product staff can manage products" ON public.products FOR ALL USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'product_staff') OR has_role(auth.uid(), 'marketing')
);

-- RLS policies for categories
CREATE POLICY "Product staff can manage categories" ON public.categories FOR ALL USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'product_staff')
);

-- RLS policies for user_roles
CREATE POLICY "Super admin can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'));