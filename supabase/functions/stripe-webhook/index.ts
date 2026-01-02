import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[STRIPE-WEBHOOK][${timestamp}] ${step}`, data ? JSON.stringify(data) : "");
};

// UTMify config - SAME as track-purchase (this one works!)
const UTMIFY_PIXEL_ID = "69541e567c5e5c96cc8e701a";
const SOURCE_URL = "https://codpointsmobile.online/success";
const UTMIFY_API_URL = "https://tracking.utmify.com.br/tracking/v1/events";

serve(async (req) => {
  log("=== WEBHOOK CALLED ===", { 
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === "OPTIONS") {
    log("CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const UTMIFY_API_KEY = Deno.env.get("UTMIFY_API_KEY");

    log("Environment check", {
      hasStripeKey: !!STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix: STRIPE_WEBHOOK_SECRET?.substring(0, 10) + "...",
      hasUtmifyKey: !!UTMIFY_API_KEY,
    });

    if (!STRIPE_SECRET_KEY) {
      log("ERROR: Missing STRIPE_SECRET_KEY");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    log("Request details", { 
      bodyLength: body.length, 
      hasSignature: !!signature,
      signaturePrefix: signature?.substring(0, 20) + "..."
    });

    let event: Stripe.Event;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
        log("✅ Signature verification SUCCESS", { eventType: event.type, eventId: event.id });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        log("❌ SIGNATURE VERIFICATION FAILED", { 
          error: errorMsg,
          webhookSecretUsed: STRIPE_WEBHOOK_SECRET?.substring(0, 15) + "..."
        });
        return new Response(JSON.stringify({ 
          error: "Webhook signature verification failed",
          details: errorMsg 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      log("⚠️ No signature verification (missing secret or signature)");
      event = JSON.parse(body);
    }

    log("Event received", { type: event.type, id: event.id });

    // Only process payment_intent.succeeded
    if (event.type !== "payment_intent.succeeded") {
      log("Ignoring event type", { type: event.type });
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata || {};
    
    // Get email from multiple sources (metadata OR top-level receipt_email)
    const customerEmail = meta.customer_email || (pi as any).receipt_email || meta.email;

    log("PaymentIntent details", {
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      customer_email: customerEmail,
      packageId: meta.packageId,
      cpAmount: meta.cpAmount,
      packageName: meta.packageName,
      receipt_email: (pi as any).receipt_email,
      metadata_keys: Object.keys(meta),
    });

    // COD MOBILE SPECIFIC detection:
    // COD uses: packageId (starts with "cp-") and cpAmount in metadata
    // This is set by create-payment-intent for COD products
    const hasCpPackageId = meta.packageId && meta.packageId.startsWith('cp-');
    const hasCpAmount = !!meta.cpAmount;
    
    const isCodPayment = hasCpPackageId || hasCpAmount;
    
    if (!isCodPayment) {
      log("⚠️ Not a COD Mobile payment (no cp- packageId or cpAmount), skipping", { 
        packageId: meta.packageId,
        cpAmount: meta.cpAmount,
        metadata_keys: Object.keys(meta)
      });
      return new Response(JSON.stringify({ received: true, skipped: "not_cod" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    log("✅ COD Mobile payment detected!", { 
      packageId: meta.packageId,
      cpAmount: meta.cpAmount,
      packageName: meta.packageName,
      customer_email: customerEmail,
      amount: pi.amount
    });

    // Send to UTMify using the SAME format as track-purchase (which works!)
    if (!UTMIFY_API_KEY) {
      log("❌ CRITICAL: UTMIFY_API_KEY not set!");
      return new Response(JSON.stringify({ received: true, error: "no_utmify_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build UTM params from metadata
    const utmParams: Record<string, string> = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'fbclid', 'xcod'];
    for (const key of utmKeys) {
      if (meta[key]) {
        utmParams[key] = meta[key];
      }
    }

    const payload = {
      type: "Purchase",
      lead: {
        pixelId: UTMIFY_PIXEL_ID,
        email: customerEmail || undefined,
        parameters: Object.keys(utmParams).length > 0 ? new URLSearchParams(utmParams).toString() : "",
      },
      event: {
        sourceUrl: SOURCE_URL,
        pageTitle: "Compra COD Mobile CP",
        value: pi.amount / 100,
        currency: pi.currency?.toUpperCase() || "USD",
        orderId: pi.id,
      },
    };

    log("Sending to UTMify", { 
      url: UTMIFY_API_URL,
      payload,
    });

    try {
      const utmRes = await fetch(UTMIFY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${UTMIFY_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const utmText = await utmRes.text();
      log("UTMify response", { 
        status: utmRes.status, 
        ok: utmRes.ok,
        body: utmText,
        orderId: pi.id
      });

      if (utmRes.ok) {
        log("✅ SUCCESS: Purchase tracked to UTMify via webhook!", { orderId: pi.id });
      } else {
        log("❌ UTMify API error", { status: utmRes.status, body: utmText });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log("❌ UTMify fetch error", { error: errorMsg });
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, paymentId: pi.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log("❌ CRITICAL ERROR", { error: errorMsg, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
