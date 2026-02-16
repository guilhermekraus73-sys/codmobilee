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

    // Build tracking parameters - NEVER let empty/null UTMs cause failures
    const tracking = trackingParams || {};
    
    // Sanitize: convert null/undefined/unresolved macros to empty string
    const safeStr = (val: unknown): string => {
      if (val === null || val === undefined || val === "null" || val === "undefined") return "";
      const str = String(val).trim();
      // Strip unresolved Facebook/ad platform macros like {{campaign.name}}, {{adset.id}}, etc.
      if (str.includes("{{") && str.includes("}}")) {
        log("Stripping unresolved macro", { original: str });
        return "";
      }
      return str;
    };
    
    const sanitizedTracking = {
      src: safeStr(tracking.src),
      sck: safeStr(tracking.sck),
      utm_source: safeStr(tracking.utm_source),
      utm_medium: safeStr(tracking.utm_medium),
      utm_campaign: safeStr(tracking.utm_campaign),
      utm_content: safeStr(tracking.utm_content),
      utm_term: safeStr(tracking.utm_term),
      fbclid: safeStr(tracking.fbclid),
      gclid: safeStr(tracking.gclid),
      ttclid: safeStr(tracking.ttclid),
    };
    
    const hasAnyTracking = Object.values(sanitizedTracking).some(v => v !== "");
    log("Tracking params sanitized", { sanitizedTracking, hasAnyTracking });
    
    // Build UTMify payload - send even with empty UTMs (UTMify will still record the sale)
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
        id: "produto-02",
        name: "Produto 02",
        planId: "produto-02",
        planName: "Produto 02",
        quantity: 1,
        priceInCents: priceInCents,
      }],
      trackingParameters: {
        src: sanitizedTracking.src || null,
        sck: sanitizedTracking.sck || null,
        utm_source: sanitizedTracking.utm_source || null,
        utm_campaign: sanitizedTracking.utm_campaign || null,
        utm_medium: sanitizedTracking.utm_medium || null,
        utm_content: sanitizedTracking.utm_content || null,
        utm_term: sanitizedTracking.utm_term || null,
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
    log("CRITICAL ERROR (returning 200 to prevent webhook retry failures)", { message: errorMessage });
    // IMPORTANT: Always return 200 so the webhook doesn't retry and we don't lose the sale record
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
