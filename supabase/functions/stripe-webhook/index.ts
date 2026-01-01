import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK][${timestamp}] ${step}${detailsStr}`);
};

// UTMify Pixel ID for COD Mobile
const UTMIFY_PIXEL_ID = "69541e567c5e5c96cc8e701a";
const SOURCE_URL = "https://codpointsmobile.online/success";
const UTMIFY_API_URL = "https://tracking.utmify.com.br/tracking/v1/events";

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
  logStep("STARTING UTMify tracking", { orderId: data.orderId, value: data.value, email: data.email });
  
  try {
    const utmifyApiKey = Deno.env.get("UTMIFY_API_KEY");
    if (!utmifyApiKey) {
      logStep("CRITICAL ERROR: UTMIFY_API_KEY not set - tracking will fail!");
      return false;
    }
    logStep("UTMIFY_API_KEY verified");
    
    const payload = {
      type: "Purchase",
      lead: {
        pixelId: UTMIFY_PIXEL_ID,
        email: data.email || undefined,
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

    logStep("Sending PURCHASE to UTMify", { 
      url: UTMIFY_API_URL,
      pixelId: UTMIFY_PIXEL_ID,
      payload 
    });

    const response = await fetchWithRetry(
      UTMIFY_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${utmifyApiKey}`,
        },
        body: JSON.stringify(payload),
      },
      3 // Max retries
    );

    const responseData = await response.text();
    logStep("UTMify RESPONSE", { 
      status: response.status, 
      ok: response.ok,
      data: responseData,
      orderId: data.orderId 
    });

    if (response.ok) {
      logStep("SUCCESS: Purchase tracked to UTMify!", { orderId: data.orderId });
    } else {
      logStep("FAILED: UTMify returned non-OK status", { status: response.status });
    }

    return response.ok;
  } catch (error) {
    logStep("CRITICAL ERROR: UTMify tracking failed after all retries", { 
      error: error instanceof Error ? error.message : String(error),
      orderId: data.orderId 
    });
    return false;
  }
}

serve(async (req) => {
  logStep("=== WEBHOOK INVOKED ===", { method: req.method, url: req.url });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    logStep("CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Processing webhook request");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("CRITICAL: STRIPE_SECRET_KEY not configured");
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    logStep("Request body received", { bodyLength: body.length, hasSignature: !!signature });

    let event: Stripe.Event;

    // If we have a webhook secret, verify the signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        // Use constructEventAsync for Deno environment
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Signature verified successfully");
      } catch (err) {
        logStep("SIGNATURE VERIFICATION FAILED", { error: err instanceof Error ? err.message : String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
      logStep("Processing WITHOUT signature verification (testing mode)", { hasWebhookSecret: !!webhookSecret });
    }

    logStep("=== EVENT RECEIVED ===", { type: event.type, id: event.id });

    // Handle the payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      logStep("Payment succeeded", {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      });

      // Only process COD Mobile payments (has packageId in metadata)
      // Skip Free Fire payments (has diamonds in metadata) - handled by separate webhook
      const isCodPayment = paymentIntent.metadata.packageId !== undefined;
      
      if (!isCodPayment) {
        logStep("Skipping non-COD payment (handled by other webhook)");
        return new Response(
          JSON.stringify({ received: true, skipped: true, reason: "Not a COD payment" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      logStep("Processing COD payment");

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

      // Get email from metadata or customer
      let customerEmail = paymentIntent.metadata.email;
      
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
