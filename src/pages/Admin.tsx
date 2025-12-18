import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Users, ShoppingCart, DollarSign, Eye, 
  BarChart3, Settings, UserCog, Megaphone, Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Order, Product } from '@/types/database';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/types/roles';

const Admin = () => {
  const { user, userRole, isStaff, hasPermission, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isStaff)) {
      navigate('/auth');
    }
  }, [user, isStaff, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isStaff) return;

      // Fetch orders if permitted
      if (hasPermission('view_all_orders')) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setOrders(data);
      }

      // Fetch products if permitted
      if (hasPermission('manage_products')) {
        const { data } = await supabase.from('products').select('*');
        if (data) setProducts(data);
      }

      // Fetch customer count if permitted
      if (hasPermission('view_customers')) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (count !== null) setCustomerCount(count);
      }

      
      setLoading(false);
    };

    if (isStaff) fetchData();
  }, [isStaff, hasPermission]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-secondary rounded-xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isStaff) return null;

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  // Navigation items based on permissions
  const navItems = [
    { 
      href: '/admin/analytics', 
      icon: BarChart3, 
      label: 'Analytics', 
      permission: 'view_analytics',
      description: 'View store performance'
    },
    { 
      href: '/admin/orders', 
      icon: ShoppingCart, 
      label: 'Orders', 
      permission: 'view_all_orders',
      description: 'Manage all orders'
    },
    { 
      href: '/admin/customers', 
      icon: Users, 
      label: 'Customers', 
      permission: 'view_customers',
      description: 'View customer details'
    },
    { 
      href: '/admin/products', 
      icon: Package, 
      label: 'Products', 
      permission: 'manage_products',
      description: 'Manage products'
    },
    { 
      href: '/admin/staff', 
      icon: UserCog, 
      label: 'Staff', 
      permission: 'manage_staff',
      description: 'Manage team members'
    },
  ];

  const allowedNavItems = navItems.filter(item => hasPermission(item.permission));

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! You're logged in as <span className="font-medium text-foreground">{userRole ? ROLE_LABELS[userRole] : 'Staff'}</span>
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {allowedNavItems.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className="bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors group"
            >
              <item.icon className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>

        {/* Stats - Only show if user has view_analytics permission */}
        {hasPermission('view_analytics') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <DollarSign className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <ShoppingCart className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Recent Orders</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <Package className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-muted-foreground">Products</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <Users className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{customerCount}</p>
              <p className="text-sm text-muted-foreground">Customers</p>
            </div>
          </div>
        )}

        {/* Recent Orders - Only show if user has view_all_orders permission */}
        {hasPermission('view_all_orders') && orders.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Recent Orders</h2>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Order</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-border">
                      <td className="py-3 px-2 font-mono">{order.order_number}</td>
                      <td className="py-3 px-2 capitalize">{order.status}</td>
                      <td className="py-3 px-2">${Number(order.total).toFixed(2)}</td>
                      <td className="py-3 px-2">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-right">
                        <Link to={`/receipt/${order.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permission Info Card */}
        <div className="mt-8 bg-secondary/50 rounded-xl p-6">
          <h3 className="font-semibold mb-3">Your Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {userRole && ROLE_PERMISSIONS[userRole].map(permission => (
              <span 
                key={permission} 
                className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                {permission.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
