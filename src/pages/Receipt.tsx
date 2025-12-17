import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/database';

const Receipt = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      const [orderRes, itemsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single(),
        supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId),
      ]);

      if (orderRes.data) setOrder(orderRes.data);
      if (itemsRes.data) setOrderItems(itemsRes.data);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
            <div className="h-16 w-16 bg-secondary rounded-full mx-auto" />
            <div className="h-8 bg-secondary rounded w-48 mx-auto" />
            <div className="h-64 bg-secondary rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Link to="/">
            <Button className="btn-primary">Go Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been received.
            </p>
          </div>

          {/* Receipt Card */}
          <div className="bg-card rounded-xl border border-border overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-primary/5 p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-mono font-bold text-foreground">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.product_price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-muted-foreground">
                {order.shipping_address}<br />
                {order.shipping_city}, {order.shipping_postal_code}<br />
                {order.shipping_country}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="p-6">
              <h3 className="font-semibold mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize">{order.payment_method}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Payment Status</span>
                  <span className="text-success font-medium capitalize">{order.payment_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
            <Link to="/orders" className="flex-1">
              <Button className="w-full btn-primary">
                <Package className="mr-2 h-4 w-4" />
                View All Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Receipt;
