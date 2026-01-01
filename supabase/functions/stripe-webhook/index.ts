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

// Send Purchase event to UTMify
async function sendPurchaseToUtmify(data: {
  orderId: string;
  value: number;
  currency: string;
  email?: string;
  utmData?: Record<string, string>;
}) {
  try {
    const utmifyApiKey = Deno.env.get("UTMIFY_API_KEY");
    
    const payload = {
      type: "Purchase",
      lead: {
        pixelId: UTMIFY_PIXEL_ID,
        email: data.email,
        parameters: data.utmData ? new URLSearchParams(data.utmData).toString() : "",
      },
      event: {
        sourceUrl: "https://tracking.codmobile.shop/success",
        pageTitle: "Compra COD Mobile CP",
        value: data.value,
        currency: data.currency,
        orderId: data.orderId,
      },
    };

    logStep("Sending to UTMify", payload);

    const response = await fetch("https://tracking.utmify.com.br/tracking/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(utmifyApiKey ? { "Authorization": `Bearer ${utmifyApiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.text();
    logStep("UTMify response", { status: response.status, data: responseData });

    return response.ok;
  } catch (error) {
    logStep("UTMify error", { error: error instanceof Error ? error.message : String(error) });
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

      // Only process COD Mobile payments (has packageId in metadata)
      // Skip Free Fire payments (has diamonds in metadata)
      const isCodPayment = paymentIntent.metadata.packageId !== undefined;
      
      if (!isCodPayment) {
        logStep("Skipping non-COD payment (Free Fire or other product)");
        return new Response(
          JSON.stringify({ received: true, skipped: true, reason: "Not a COD payment" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      logStep("Processing COD payment");

      // Extract UTM data from metadata
      const utmData: Record<string, string> = {};
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ttclid'];
      
      for (const key of utmKeys) {
        if (paymentIntent.metadata[key]) {
          utmData[key] = paymentIntent.metadata[key];
        }
      }

      // Get email from metadata
      const customerEmail = paymentIntent.metadata.email;

      // Send to UTMify
      const utmifySuccess = await sendPurchaseToUtmify({
        orderId: paymentIntent.id,
        value: paymentIntent.amount / 100, // Convert from cents to dollars
        currency: paymentIntent.currency.toUpperCase(),
        email: customerEmail,
        utmData,
      });

      logStep("UTMify tracking result", { success: utmifySuccess });

      return new Response(
        JSON.stringify({ 
          received: true,
          paymentIntentId: paymentIntent.id,
          utmifyTracked: utmifySuccess,
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
