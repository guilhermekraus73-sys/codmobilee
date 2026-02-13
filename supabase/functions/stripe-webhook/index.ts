import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[STRIPE-WEBHOOK][${timestamp}] ${step}`, data ? JSON.stringify(data) : "");
};

serve(async (req) => {
  log("=== WEBHOOK CALLED ===", { method: req.method, url: req.url });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    log("Environment check", { hasStripeKey: !!STRIPE_SECRET_KEY, hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET });

    if (!STRIPE_SECRET_KEY) {
      log("ERROR: Missing STRIPE_SECRET_KEY");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    log("Request details", { bodyLength: body.length, hasSignature: !!signature });

    let event: Stripe.Event;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
        log("✅ Signature verification SUCCESS", { eventType: event.type, eventId: event.id });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        log("❌ SIGNATURE VERIFICATION FAILED", { error: errorMsg });
        return new Response(JSON.stringify({ error: "Webhook signature verification failed", details: errorMsg }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
    } else {
      log("⚠️ No signature verification");
      event = JSON.parse(body);
    }

    log("Event received", { type: event.type, id: event.id });

    if (event.type !== "payment_intent.succeeded") {
      log("Ignoring event type", { type: event.type });
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata || {};

    log("PaymentIntent received", {
      id: pi.id, amount: pi.amount, currency: pi.currency, metadata_keys: Object.keys(meta),
    });

    // Save order to database
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const orderData = {
        payment_intent_id: pi.id,
        email: meta.email || meta.customer_email || null,
        customer_name: meta.fullName || meta.customer_name || null,
        package_id: meta.packageId || meta.product || null,
        package_name: meta.packageName || meta.product_name || null,
        amount_cents: pi.amount,
        currency: pi.currency?.toUpperCase() || 'USD',
        country: meta.country || meta.billing_country || (pi.shipping?.address?.country) || null,
        city: meta.billing_city || null,
        utm_source: meta.utm_source || meta.src || null,
        utm_medium: meta.utm_medium || meta.sck || null,
        utm_campaign: meta.utm_campaign || null,
        utm_content: meta.utm_content || null,
      };

      log("Order data to insert", orderData);

      const { error: insertError } = await supabaseAdmin.from('orders').insert(orderData);
      
      if (insertError) {
        log("⚠️ Order insert error (may be duplicate)", { error: insertError.message });
      } else {
        log("✅ Order saved to database", { paymentId: pi.id });
      }
    } catch (dbErr) {
      log("⚠️ DB error saving order", { error: dbErr instanceof Error ? dbErr.message : String(dbErr) });
    }

    log("ℹ️ UTMify tracking delegated to Success Page (track-purchase)", { paymentId: pi.id });

    return new Response(
      JSON.stringify({ received: true, processed: true, paymentId: pi.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log("❌ CRITICAL ERROR", { error: errorMsg });
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
