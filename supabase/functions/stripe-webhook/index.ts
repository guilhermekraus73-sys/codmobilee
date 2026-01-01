import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// UTMify Pixel ID
const UTMIFY_PIXEL_ID = "69541e567c5e5c96cc8e701a";
const SOURCE_URL = "https://codpointsmobile.online/success";

// Retry function with exponential backoff
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      logStep(`UTMify attempt ${attempt} failed with status ${response.status}`);
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logStep(`UTMify attempt ${attempt} failed: ${lastError.message}`);
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// Send Purchase event to UTMify with retry
async function sendPurchaseToUtmify(data: {
  orderId: string;
  value: number;
  currency: string;
  email?: string;
  utmData?: Record<string, string>;
}): Promise<boolean> {
  try {
    const utmifyApiKey = Deno.env.get("UTMIFY_API_KEY");
    if (!utmifyApiKey) {
      logStep("WARNING: UTMIFY_API_KEY not set");
    }
    
    const payload = {
      type: "Purchase",
      lead: {
        pixelId: UTMIFY_PIXEL_ID,
        email: data.email,
        parameters: data.utmData ? new URLSearchParams(data.utmData).toString() : "",
      },
      event: {
        sourceUrl: SOURCE_URL,
        pageTitle: "Compra COD Mobile CP",
        value: data.value,
        currency: data.currency,
        orderId: data.orderId,
      },
    };

    logStep("Sending to UTMify", payload);

    const response = await fetchWithRetry(
      "https://tracking.utmify.com.br/tracking/v1/events",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(utmifyApiKey ? { "Authorization": `Bearer ${utmifyApiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      },
      3 // Max retries
    );

    const responseData = await response.text();
    logStep("UTMify response", { status: response.status, data: responseData });

    return response.ok;
  } catch (error) {
    logStep("UTMify error after retries", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // If we have a webhook secret, verify the signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        // Use constructEventAsync for Deno environment
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Signature verified");
      } catch (err) {
        logStep("Signature verification failed", { error: err instanceof Error ? err.message : String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
      logStep("Processing without signature verification (testing mode)");
    }

    logStep("Event type", { type: event.type });

    // Handle the payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      logStep("Payment succeeded", {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      });

      // Process both COD Mobile and Free Fire payments
      const isCodPayment = paymentIntent.metadata.packageId !== undefined;
      const isFreeFire = paymentIntent.metadata.diamonds !== undefined;
      
      if (!isCodPayment && !isFreeFire) {
        logStep("Skipping unrecognized product");
        return new Response(
          JSON.stringify({ received: true, skipped: true, reason: "Not a COD or Free Fire payment" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      const productType = isCodPayment ? "COD Mobile" : "Free Fire";

      logStep(`Processing ${productType} payment`);

      // Extract UTM data from metadata - capture all possible params
      const utmData: Record<string, string> = {};
      const utmKeys = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
        'fbclid', 'gclid', 'ttclid', 'kwai_click_id'
      ];
      
      for (const key of utmKeys) {
        if (paymentIntent.metadata[key]) {
          utmData[key] = paymentIntent.metadata[key];
        }
      }

      // Get email from metadata (check both COD and Free Fire field names)
      let customerEmail = paymentIntent.metadata.email || paymentIntent.metadata.customer_email;
      
      // If no email in metadata, try to get from Stripe customer
      if (!customerEmail && paymentIntent.customer) {
        try {
          const customer = await stripe.customers.retrieve(paymentIntent.customer as string);
          if (customer && !customer.deleted && 'email' in customer) {
            customerEmail = customer.email || undefined;
            logStep("Email retrieved from Stripe customer", { email: customerEmail });
          }
        } catch (e) {
          logStep("Could not retrieve customer email", { error: e instanceof Error ? e.message : String(e) });
        }
      }

      // Send to UTMify with retry
      const utmifySuccess = await sendPurchaseToUtmify({
        orderId: paymentIntent.id,
        value: paymentIntent.amount / 100, // Convert from cents to dollars
        currency: paymentIntent.currency.toUpperCase(),
        email: customerEmail,
        utmData,
      });

      logStep("UTMify tracking result", { success: utmifySuccess, email: customerEmail });

      return new Response(
        JSON.stringify({ 
          received: true,
          paymentIntentId: paymentIntent.id,
          utmifyTracked: utmifySuccess,
          email: customerEmail || 'not_available',
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Handle other events we might want to track
    if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;
      logStep("Charge succeeded", { id: charge.id, amount: charge.amount });
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      logStep("Charge refunded", { id: charge.id, amount_refunded: charge.amount_refunded });
    }

    return new Response(
      JSON.stringify({ received: true }),
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
