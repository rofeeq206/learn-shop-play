import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/database';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.original_price!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  return (
    <Link to={`/products/${product.slug}`} className="card-product group">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 badge-sale">
            -{discountPercent}%
          </span>
        )}
        {product.is_featured && !hasDiscount && (
          <span className="absolute top-2 left-2 badge-new">
            Featured
          </span>
        )}
        <Button
          size="icon"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary hover:bg-primary/90"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center space-x-1 mb-2">
          <Star className="h-4 w-4 fill-rating text-rating" />
          <span className="text-sm text-muted-foreground">
            {product.rating} ({product.review_count})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="price-current">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="price-original">${product.original_price!.toFixed(2)}</span>
          )}
        </div>
        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <p className="text-xs text-warning mt-1">Only {product.stock_quantity} left</p>
        )}
        {product.stock_quantity === 0 && (
          <p className="text-xs text-destructive mt-1">Out of stock</p>
        )}
      </div>
    </Link>
  );
}
