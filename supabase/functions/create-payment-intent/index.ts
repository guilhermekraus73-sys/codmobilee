import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
};

// Preços em centavos USD
const PRODUCTS: Record<string, { name: string; price: number; cp: number }> = {
  'cp-800': { name: '800 CP + 600 Bonus', price: 900, cp: 1400 },    // $9.00 USD (checkout1)
  'cp-1600': { name: '1600 CP + 1200 Bonus', price: 1590, cp: 2800 }, // $15.90 USD (checkout2)
  'cp-4000': { name: '4000 CP + 1500 Bonus', price: 1990, cp: 5500 }, // $19.90 USD (checkout3)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { packageId, email, utmData } = await req.json();
    logStep("Request data", { packageId, email, utmData });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const product = PRODUCTS[packageId];
    if (!product) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }
    logStep("Product found", product);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        const customer = await stripe.customers.create({ email });
        customerId = customer.id;
        logStep("New customer created", { customerId });
      }
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: "usd",
      customer: customerId,
      metadata: {
        packageId,
        packageName: product.name,
        cpAmount: product.cp.toString(),
        email: email || '',
        ...utmData,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logStep("Payment Intent created", { 
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ? "exists" : "missing"
    });

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
