import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Order {
  id: string;
  order_date: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    product_price: number;
  }>;
}

export default function Profile() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const handlePaymentSuccess = async (sessionIdParam: string, userId: string) => {
      try {
        const { error } = await supabase.functions.invoke('create-order', {
          body: { sessionId: sessionIdParam }
        });
        
        if (!error) {
          toast.success("Order placed successfully!");
          fetchOrders(userId);
        } else {
          toast.error("Failed to process order");
        }
      } catch (error) {
        console.error("Error processing order:", error);
        toast.error("Failed to process order");
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/profile');
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
        fetchOrders(session.user.id);
        
        // Check for payment success callback
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        if (sessionId) {
          handlePaymentSuccess(sessionId, session.user.id);
        }
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

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          product_name,
          quantity,
          product_price
        )
      `)
      .eq("user_id", userId)
      .order("order_date", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
  };

  if (!session || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{profile.full_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{profile.email}</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Order History</h2>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Order #{order.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.order_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={order.order_status === "processing" ? "default" : "secondary"}>
                            {order.order_status}
                          </Badge>
                          <p className="text-lg font-bold text-primary mt-1">
                            ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.order_items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.product_name} x{item.quantity}</span>
                            <span className="font-semibold">
                              ${(item.product_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
