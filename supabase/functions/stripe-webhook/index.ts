import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, data?: unknown) => {
  console.log(`[WEBHOOK] ${step}`, data ? JSON.stringify(data) : "");
};

serve(async (req) => {
  log("=== REQUEST ===", { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const UTMIFY_API_KEY = Deno.env.get("UTMIFY_API_KEY");

    log("Config", {
      hasStripeKey: !!STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
      hasUtmifyKey: !!UTMIFY_API_KEY,
    });

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not set");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    log("Request", { bodyLength: body.length, hasSignature: !!signature });

    let event: Stripe.Event;

    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
        log("Signature OK");
      } catch (err) {
        log("SIGNATURE FAIL", { error: String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      event = JSON.parse(body);
      log("No signature check");
    }

    log("Event", { type: event.type, id: event.id });

    if (event.type !== "payment_intent.succeeded") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata || {};

    log("PaymentIntent", {
      id: pi.id,
      amount: pi.amount,
      email: meta.email,
      cpAmount: meta.cpAmount,
    });

    // Check if COD payment
    const isCod = meta.packageId || meta.cpAmount;
    if (!isCod) {
      log("Not COD payment, skip");
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send to UTMify
    if (!UTMIFY_API_KEY) {
      log("ERROR: No UTMIFY_API_KEY");
    } else {
      const utmPayload = {
        orderId: pi.id,
        platform: "Lovable-CODM",
        paymentMethod: "stripe",
        customer: { email: meta.email || "" },
        products: [{ name: "CP Points", price: pi.amount / 100, quantity: 1 }],
        trackingParameters: {
          src: meta.utm_source || null,
          sck: meta.xcod || meta.fbclid || null,
          utm_source: meta.utm_source || null,
          utm_medium: meta.utm_medium || null,
          utm_campaign: meta.utm_campaign || null,
          utm_content: meta.utm_content || null,
          utm_term: meta.utm_term || null,
        },
        currency: "USD",
        value: pi.amount / 100,
        status: "paid",
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        sourceUrl: "https://cpcodm.com",
        pixelId: "684568a9e73dc43ae4aa7a06",
      };

      log("UTMify payload", utmPayload);

      try {
        const utmRes = await fetch("https://api.utmify.com.br/api-credentials/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": UTMIFY_API_KEY,
          },
          body: JSON.stringify(utmPayload),
        });

        const utmText = await utmRes.text();
        log("UTMify response", { status: utmRes.status, body: utmText });
      } catch (err) {
        log("UTMify error", { error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ received: true, paymentId: pi.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    log("ERROR", { error: String(error) });
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
