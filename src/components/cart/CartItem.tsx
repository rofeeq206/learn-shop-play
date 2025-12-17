import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem as CartItemType, Product } from '@/types/database';
import { useCart } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType & { product: Product };
}

export function CartItemCard({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-border">
      <img
        src={item.product.image_url || '/placeholder.svg'}
        alt={item.product.name}
        className="w-20 h-20 object-cover rounded-lg bg-secondary"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{item.product.name}</h3>
        <p className="text-primary font-semibold">${item.product.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-right min-w-[80px]">
        <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => removeFromCart(item.product_id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
