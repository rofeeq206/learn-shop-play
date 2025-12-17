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
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 badge-sale">
            -{discountPercent}%
          </span>
        )}
        {product.is_featured && !hasDiscount && (
          <span className="absolute top-3 left-3 badge-new">
            Featured
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Button
          size="icon"
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-card hover:bg-card shadow-lg hover:shadow-xl rounded-full"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 text-primary" />
        </Button>
      </div>
      <div className="p-5">
        <h3 className="font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center space-x-1 mb-3">
          <Star className="h-4 w-4 fill-rating text-rating" />
          <span className="text-sm text-muted-foreground">
            {product.rating} ({product.review_count})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="price-original">${product.original_price!.toFixed(2)}</span>
          )}
        </div>
        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <p className="text-xs text-warning mt-2 font-medium">Only {product.stock_quantity} left</p>
        )}
        {product.stock_quantity === 0 && (
          <p className="text-xs text-destructive mt-2 font-medium">Out of stock</p>
        )}
      </div>
    </Link>
  );
}
