import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[TRACK-PURCHASE][${timestamp}] ${step}${detailsStr}`);
};

// UTMify API - ENDPOINT CORRETO!
const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";

serve(async (req) => {
  log("=== TRACK-PURCHASE INVOKED ===", { method: req.method });
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, value, currency, email, name, productName, trackingParams, source } = await req.json();
    log("Request data", { orderId, value, currency, email, name, productName, hasTrackingParams: !!trackingParams, source });

    // Validate required fields
    if (!orderId || value === undefined || value === null) {
      log("VALIDATION ERROR: Missing required fields");
      throw new Error("Missing required fields: orderId or value");
    }

    const utmifyApiToken = Deno.env.get("UTMIFY_API_KEY");
    if (!utmifyApiToken) {
      log("CRITICAL ERROR: UTMIFY_API_KEY not set");
      throw new Error("UTMIFY_API_KEY not configured");
    }

    // Format date correctly: YYYY-MM-DD HH:MM:SS
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    log("Formatted date", { formattedDate });

    // Convert value to cents (UTMify expects centavos/cents)
    const priceInCents = Math.round(value * 100);
    log("Price conversion", { originalValue: value, priceInCents });

    // Build tracking parameters
    const tracking = trackingParams || {};
    
    // Build UTMify payload with CORRECT FORMAT
    const utmifyPayload = {
      orderId: orderId,
      platform: "Stripe",
      paymentMethod: "credit_card",
      status: "paid",
      createdAt: formattedDate,
      approvedDate: formattedDate,
      refundedAt: null,
      customer: {
        name: name || "Cliente",
        email: email || "",
        phone: null,
        document: null,
        country: "US",
      },
      products: [{
        id: orderId,
        name: productName || "COD Mobile CP",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: priceInCents,
      }],
      trackingParameters: {
        src: tracking.src || null,
        sck: tracking.sck || null,
        utm_source: tracking.utm_source || null,
        utm_medium: tracking.utm_medium || null,
        utm_campaign: tracking.utm_campaign || null,
        utm_content: tracking.utm_content || null,
        utm_term: tracking.utm_term || null,
      },
      commission: {
        totalPriceInCents: priceInCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: priceInCents,
        currency: currency || "USD",
      },
      isTest: false,
    };

    log("Sending to UTMify", { payload: utmifyPayload });

    // Send with retries
    let success = false;
    let lastError = "";
    let responseData = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        log(`Attempt ${attempt}/3`);
        
        const response = await fetch(UTMIFY_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": utmifyApiToken, // HEADER CORRETO!
          },
          body: JSON.stringify(utmifyPayload),
        });

        responseData = await response.text();
        log("UTMify response", { status: response.status, ok: response.ok, body: responseData, attempt });

        if (response.ok) {
          log("✅ SUCCESS: Purchase tracked!", { orderId });
          success = true;
          break;
        } else {
          lastError = `HTTP ${response.status}: ${responseData}`;
          log("UTMify error response", { status: response.status, body: responseData });
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        log("Fetch error", { error: lastError, attempt });
      }
      
      // Wait before retry
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }

    if (!success) {
      log("❌ FAILED after 3 attempts", { orderId, lastError });
    }

    return new Response(
      JSON.stringify({ 
        success, 
        message: success ? "Purchase tracked successfully" : "Failed after retries",
        orderId,
        utmifyResponse: responseData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("CRITICAL ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
