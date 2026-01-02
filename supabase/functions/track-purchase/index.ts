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

// UTMify config
const UTMIFY_PIXEL_ID = "69541e567c5e5c96cc8e701a";
const SOURCE_URL = "https://codpointsmobile.online/success";
const UTMIFY_API_URL = "https://tracking.utmify.com.br/tracking/v1/events";

serve(async (req) => {
  log("=== TRACK-PURCHASE INVOKED ===", { method: req.method });
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, value, currency, email, utmData, source } = await req.json();
    log("Request data", { orderId, value, currency, email, hasUtmData: !!utmData, source });

    // Validate required fields
    if (!orderId || value === undefined || value === null) {
      log("VALIDATION ERROR: Missing required fields");
      throw new Error("Missing required fields: orderId or value");
    }

    const utmifyApiKey = Deno.env.get("UTMIFY_API_KEY");
    if (!utmifyApiKey) {
      log("CRITICAL ERROR: UTMIFY_API_KEY not set");
      throw new Error("UTMIFY_API_KEY not configured");
    }
    
    // Build UTM parameters
    const utmParams: Record<string, string> = {};
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "fbclid", "gclid", "ttclid", "xcod"];
    
    if (utmData) {
      for (const key of utmKeys) {
        if (utmData[key] && typeof utmData[key] === "string" && utmData[key] !== "") {
          utmParams[key] = utmData[key];
        }
      }
    }
    log("UTM params", { count: Object.keys(utmParams).length, params: utmParams });

    // Build lead object - only include email if valid
    const leadObj: Record<string, string> = {
      pixelId: UTMIFY_PIXEL_ID,
      parameters: Object.keys(utmParams).length > 0 ? new URLSearchParams(utmParams).toString() : "",
    };
    
    if (email && typeof email === "string" && email.trim() !== "") {
      leadObj.email = email.trim();
    }

    const payload = {
      type: "Purchase",
      lead: leadObj,
      event: {
        sourceUrl: SOURCE_URL,
        pageTitle: "Compra COD Mobile CP",
        value: value,
        currency: currency || "USD",
        orderId: orderId,
      },
    };

    log("Sending to UTMify", { payload });

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
            "Authorization": `Bearer ${utmifyApiKey}`,
          },
          body: JSON.stringify(payload),
        });

        responseData = await response.text();
        log("UTMify response", { status: response.status, ok: response.ok, body: responseData, attempt });

        if (response.ok) {
          log("✅ SUCCESS: Purchase tracked!", { orderId });
          success = true;
          break;
        } else {
          lastError = `HTTP ${response.status}: ${responseData}`;
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
