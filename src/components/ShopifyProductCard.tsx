import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import type { ShopifyProduct } from "@/stores/cartStore";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
}

export const ShopifyProductCard = ({ product }: ShopifyProductCardProps) => {
  const addItem = useCartStore(state => state.addItem);
  const { node } = product;
  const firstVariant = node.variants.edges[0]?.node;
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const currencyCode = node.priceRange.minVariantPrice.currencyCode;

  const handleAddToCart = () => {
    if (!firstVariant) return;

    const cartItem = {
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success("Added to cart", {
      description: `${node.title} has been added to your cart`,
    });
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-xl">
      <Link to={`/product/${node.handle}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {node.images.edges[0]?.node ? (
            <img
              src={node.images.edges[0].node.url}
              alt={node.images.edges[0].node.altText || node.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/product/${node.handle}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
            {node.title}
          </h3>
        </Link>
        <p className="text-2xl font-bold text-primary">{currencyCode} ${price.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {firstVariant?.availableForSale ? "In stock" : "Out of stock"}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={handleAddToCart}
          disabled={!firstVariant?.availableForSale}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {firstVariant?.availableForSale ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
};
