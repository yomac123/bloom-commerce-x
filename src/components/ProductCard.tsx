import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock: number;
}

export const ProductCard = ({ id, name, price, image_url, stock }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-xl">
      <Link to={`/products/${id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
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
        <Link to={`/products/${id}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        <p className="text-2xl font-bold text-primary">${price.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {stock > 0 ? `${stock} in stock` : "Out of stock"}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/products/${id}`} className="w-full">
          <Button className="w-full" disabled={stock === 0}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {stock > 0 ? "View Details" : "Out of Stock"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
