import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types/database';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from('products').select('*');

      if (categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data } = await query;
      if (data) setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, [categorySlug, searchQuery, sortBy]);

  const handleSortChange = (value: string) => {
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const activeFiltersCount = [categorySlug, searchQuery].filter(Boolean).length;

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">
              {categorySlug 
                ? categories.find(c => c.slug === categorySlug)?.name || 'Products'
                : searchQuery 
                  ? `Search: "${searchQuery}"`
                  : 'All Products'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {products.length} products found
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Categories</h4>
                <div className="space-y-2">
                  <Link
                    to="/products"
                    className={`block py-1.5 px-3 rounded-lg text-sm transition-colors ${
                      !categorySlug 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    All Categories
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/products?category=${category.slug}`}
                      className={`block py-1.5 px-3 rounded-lg text-sm transition-colors ${
                        categorySlug === category.slug
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-background md:hidden animate-fade-in">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Filters</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-60px)]">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Categories</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSearchParams({});
                        setShowFilters(false);
                      }}
                      className={`block w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                        !categorySlug 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          searchParams.set('category', category.slug);
                          setSearchParams(searchParams);
                          setShowFilters(false);
                        }}
                        className={`block w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                          categorySlug === category.slug
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {(categorySlug || searchQuery) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchQuery && (
                  <span className="inline-flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                    Search: {searchQuery}
                    <button
                      onClick={() => {
                        searchParams.delete('search');
                        setSearchParams(searchParams);
                      }}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {categorySlug && (
                  <span className="inline-flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                    {categories.find(c => c.slug === categorySlug)?.name}
                    <button
                      onClick={() => {
                        searchParams.delete('category');
                        setSearchParams(searchParams);
                      }}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            <ProductGrid products={products} loading={loading} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
