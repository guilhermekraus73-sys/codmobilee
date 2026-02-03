import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Log helper for debugging
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Product configuration
const PRODUCTS = {
  1: { name: "800 CP + 600 Bonus", price: 900, cp: 1400, tier: "Start" },
  2: { name: "1600 CP + 1200 Bonus", price: 1590, cp: 2800, tier: "Plus" },
  3: { name: "4000 CP + 1500 Bonus", price: 1990, cp: 5500, tier: "Pro" },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    const { packageId, email, utmData } = await req.json();
    logStep("Request parsed", { packageId, email, hasUtmData: !!utmData });

    // Validate package
    const product = PRODUCTS[packageId as keyof typeof PRODUCTS];
    if (!product) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }
    logStep("Product found", { product });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://lovable.dev";
    logStep("Origin", { origin });

    // Create checkout session with metadata on payment_intent
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
      price_data: {
            currency: "usd",
            product_data: {
              name: `Guía Estratégica del Jugador - ${product.tier}`,
              description: `Edición ${product.tier}`,
              images: ["https://upload.wikimedia.org/wikipedia/en/8/87/Call_of_Duty_Mobile_cover.jpg"],
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout${packageId}`,
      customer_email: email || undefined,
      // IMPORTANT: Use payment_intent_data.metadata to pass data to webhook
      payment_intent_data: {
        metadata: {
          packageId: String(packageId),
          cpAmount: String(product.cp),
          email: email || "",
          utm_source: utmData?.utm_source || "",
          utm_medium: utmData?.utm_medium || "",
          utm_campaign: utmData?.utm_campaign || "",
          utm_content: utmData?.utm_content || "",
          utm_term: utmData?.utm_term || "",
          fbclid: utmData?.fbclid || "",
          gclid: utmData?.gclid || "",
          xcod: utmData?.xcod || "",
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
