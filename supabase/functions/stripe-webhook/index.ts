import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[STRIPE-WEBHOOK][${timestamp}] ${step}`, data ? JSON.stringify(data) : "");
};

// UTMify config
const UTMIFY_PIXEL_ID = "69541e567c5e5c96cc8e701a";
const SOURCE_URL = "https://codpointsmobile.online/success";
const UTMIFY_API_URL = "https://tracking.utmify.com.br/tracking/v1/events";

serve(async (req) => {
  log("=== WEBHOOK CALLED ===", { 
    method: req.method,
    url: req.url
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const UTMIFY_API_KEY = Deno.env.get("UTMIFY_API_KEY");

    log("Environment check", {
      hasStripeKey: !!STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
      hasUtmifyKey: !!UTMIFY_API_KEY,
    });

    if (!STRIPE_SECRET_KEY) {
      log("ERROR: Missing STRIPE_SECRET_KEY");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!UTMIFY_API_KEY) {
      log("ERROR: Missing UTMIFY_API_KEY");
      return new Response(JSON.stringify({ error: "UTMIFY_API_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    log("Request details", { 
      bodyLength: body.length, 
      hasSignature: !!signature
    });

    let event: Stripe.Event;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
        log("✅ Signature verification SUCCESS", { eventType: event.type, eventId: event.id });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        log("❌ SIGNATURE VERIFICATION FAILED", { error: errorMsg });
        return new Response(JSON.stringify({ 
          error: "Webhook signature verification failed",
          details: errorMsg 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      log("⚠️ No signature verification");
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
    
    // Get email - priority: metadata.email > metadata.customer_email > receipt_email
    let customerEmail = "";
    if (meta.email && typeof meta.email === "string" && meta.email.trim() !== "") {
      customerEmail = meta.email.trim();
    } else if (meta.customer_email && typeof meta.customer_email === "string" && meta.customer_email.trim() !== "") {
      customerEmail = meta.customer_email.trim();
    } else if ((pi as any).receipt_email && typeof (pi as any).receipt_email === "string") {
      customerEmail = (pi as any).receipt_email.trim();
    }

    log("PaymentIntent details", {
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      customer_email: customerEmail,
      packageId: meta.packageId,
      cpAmount: meta.cpAmount,
      packageName: meta.packageName,
      metadata_keys: Object.keys(meta),
    });

    // COD MOBILE detection: packageId starts with "cp-" OR cpAmount exists
    const hasCpPackageId = meta.packageId && typeof meta.packageId === "string" && meta.packageId.startsWith("cp-");
    const hasCpAmount = meta.cpAmount && meta.cpAmount !== "";
    const isCodPayment = hasCpPackageId || hasCpAmount;
    
    if (!isCodPayment) {
      log("⚠️ Not a COD Mobile payment, skipping", { 
        packageId: meta.packageId,
        cpAmount: meta.cpAmount
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

    // Build UTM params from metadata
    const utmParams: Record<string, string> = {};
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "fbclid", "gclid", "ttclid", "xcod"];
    for (const key of utmKeys) {
      if (meta[key] && typeof meta[key] === "string" && meta[key] !== "") {
        utmParams[key] = meta[key];
      }
    }

    // Build lead object
    const leadObj: Record<string, string> = {
      pixelId: UTMIFY_PIXEL_ID,
      parameters: Object.keys(utmParams).length > 0 ? new URLSearchParams(utmParams).toString() : "",
    };
    
    // Only add email if valid
    if (customerEmail !== "") {
      leadObj.email = customerEmail;
    }

    const payload = {
      type: "Purchase",
      lead: leadObj,
      event: {
        sourceUrl: SOURCE_URL,
        pageTitle: "Compra COD Mobile CP",
        value: pi.amount / 100,
        currency: pi.currency?.toUpperCase() || "USD",
        orderId: pi.id,
      },
    };

    log("Sending to UTMify", { payload });

    // Send to UTMify with 3 retries
    let success = false;
    let lastError = "";
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        log(`Attempt ${attempt}/3`);
        
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
          attempt
        });

        if (utmRes.ok) {
          log("✅ SUCCESS: Purchase tracked to UTMify!", { orderId: pi.id });
          success = true;
          break;
        } else {
          lastError = `HTTP ${utmRes.status}: ${utmText}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        log("Fetch error", { error: lastError, attempt });
      }
      
      // Wait before retry
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }
    
    if (!success) {
      log("❌ FAILED after 3 attempts", { orderId: pi.id, lastError });
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, success, paymentId: pi.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log("❌ CRITICAL ERROR", { error: errorMsg });
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
