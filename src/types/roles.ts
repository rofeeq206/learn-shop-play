export type AppRole = 
  | 'super_admin' 
  | 'admin' 
  | 'product_staff' 
  | 'order_fulfillment' 
  | 'customer_support' 
  | 'finance' 
  | 'marketing' 
  | 'customer';

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Store Manager',
  product_staff: 'Product Staff',
  order_fulfillment: 'Order Fulfillment',
  customer_support: 'Customer Support',
  finance: 'Finance / Accounting',
  marketing: 'Marketing Staff',
  customer: 'Customer',
};

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: [
    'manage_staff',
    'view_analytics',
    'manage_products',
    'manage_categories',
    'view_all_orders',
    'update_orders',
    'view_customers',
    'manage_settings',
    'view_financial_reports',
    'manage_marketing',
  ],
  admin: [
    'view_analytics',
    'manage_products',
    'manage_categories',
    'view_all_orders',
    'update_orders',
    'view_customers',
    'view_financial_reports',
    'manage_marketing',
  ],
  product_staff: [
    'manage_products',
    'manage_categories',
  ],
  order_fulfillment: [
    'view_all_orders',
    'update_orders',
  ],
  customer_support: [
    'view_all_orders',
    'view_customers',
  ],
  finance: [
    'view_all_orders',
    'view_financial_reports',
    'view_analytics',
  ],
  marketing: [
    'manage_products',
    'manage_marketing',
    'view_analytics',
  ],
  customer: [],
};

export const STAFF_ROLES: AppRole[] = [
  'super_admin',
  'admin',
  'product_staff',
  'order_fulfillment',
  'customer_support',
  'finance',
  'marketing',
];

export function hasPermission(role: AppRole | null, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isStaffRole(role: AppRole | null): boolean {
  if (!role) return false;
  return STAFF_ROLES.includes(role);
}
