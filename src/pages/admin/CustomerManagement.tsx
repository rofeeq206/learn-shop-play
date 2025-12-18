import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Profile, Order } from '@/types/database';

interface CustomerWithOrders extends Profile {
  order_count: number;
  total_spent: number;
}

const CustomerManagement = () => {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOrders | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !hasPermission('view_customers'))) {
      navigate('/admin');
    }
  }, [user, hasPermission, authLoading, navigate]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profiles) {
      // Get order summaries for each customer
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total');

      const customersWithOrders = profiles.map(profile => {
        const customerOrders = orders?.filter(o => o.user_id === profile.id) || [];
        return {
          ...profile,
          order_count: customerOrders.length,
          total_spent: customerOrders.reduce((sum, o) => sum + Number(o.total), 0),
        };
      });

      setCustomers(customersWithOrders);
    }
    setLoading(false);
  };

  const handleViewCustomer = async (customer: CustomerWithOrders) => {
    setSelectedCustomer(customer);
    
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false });

    setCustomerOrders(data || []);
  };

  const filteredCustomers = customers.filter(c =>
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-64 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">Customers</h1>
            <p className="text-muted-foreground">{customers.length} total customers</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-card rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.full_name || 'N/A'}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || 'N/A'}</TableCell>
                  <TableCell>{customer.order_count}</TableCell>
                  <TableCell>${customer.total_spent.toFixed(2)}</TableCell>
                  <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedCustomer.full_name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </p>
                    <p className="font-medium">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Address
                    </p>
                    <p className="font-medium">
                      {selectedCustomer.address ? (
                        <>
                          {selectedCustomer.address}<br />
                          {selectedCustomer.city}, {selectedCustomer.postal_code}<br />
                          {selectedCustomer.country}
                        </>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Order History ({customerOrders.length})</h3>
                  {customerOrders.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {customerOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div>
                            <p className="font-mono text-sm">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                            <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No orders yet</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CustomerManagement;
