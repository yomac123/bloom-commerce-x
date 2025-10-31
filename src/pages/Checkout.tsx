import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { z } from "zod";

const checkoutSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  zipCode: z.string().min(3).max(20),
});

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchCart(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCart = async (userId: string) => {
    const { data, error } = await supabase
      .from("cart")
      .select(`
        *,
        products (
          id,
          name,
          price
        )
      `)
      .eq("user_id", userId);

    if (!error && data) {
      setCartItems(data as CartItem[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session || cartItems.length === 0) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const shippingData = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      zipCode: formData.get("zipCode") as string,
    };

    try {
      checkoutSchema.parse(shippingData);

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          cartItems,
          shippingInfo: shippingData
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to initiate checkout");
      }
      setLoading(false);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity,
    0
  );

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-bold mb-4">Shipping Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" required />
                    </div>
                    
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input id="zipCode" name="zipCode" required />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Processing..." : "Continue to Stripe Checkout"}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card p-6 rounded-lg border sticky top-20">
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.products.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      ${(item.products.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
