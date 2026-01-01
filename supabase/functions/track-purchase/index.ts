import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-PURCHASE][${timestamp}] ${step}${detailsStr}`);
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
      logStep(`Attempt ${attempt}/${maxRetries}`, { url });
      const response = await fetch(url, options);
      if (response.ok) {
        logStep(`Attempt ${attempt} succeeded`, { status: response.status });
        return response;
      }
      // If not ok, log and retry
      logStep(`Attempt ${attempt} failed with status ${response.status}`);
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logStep(`Attempt ${attempt} failed with error: ${lastError.message}`);
    }
    
    // Wait before retry (exponential backoff: 1s, 2s, 4s)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      logStep(`Waiting ${waitTime}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

serve(async (req) => {
  logStep("=== TRACK-PURCHASE INVOKED ===", { method: req.method });
  
  if (req.method === "OPTIONS") {
    logStep("CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Processing tracking request");
    
    const { orderId, value, currency, email, utmData } = await req.json();
    logStep("Request data received", { orderId, value, currency, email, hasUtmData: !!utmData });

    // Validate required fields
    if (!orderId || value === undefined || value === null) {
      logStep("VALIDATION ERROR: Missing required fields", { orderId, value });
      throw new Error("Missing required fields: orderId or value");
    }

    const utmifyApiKey = Deno.env.get("UTMIFY_API_KEY");
    if (!utmifyApiKey) {
      logStep("CRITICAL ERROR: UTMIFY_API_KEY not set - tracking will fail!");
      throw new Error("UTMIFY_API_KEY not configured");
    }
    logStep("UTMIFY_API_KEY verified");
    
    // Build UTM parameters string - capture all possible UTM and click ID params
    const utmParams: Record<string, string> = {};
    const utmKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
      'fbclid', 'gclid', 'ttclid', 'kwai_click_id'
    ];
    
    if (utmData) {
      for (const key of utmKeys) {
        if (utmData[key]) {
          utmParams[key] = utmData[key];
        }
      }
    }
    logStep("UTM params extracted", { count: Object.keys(utmParams).length, params: utmParams });

    const payload = {
      type: "Purchase",
      lead: {
        pixelId: UTMIFY_PIXEL_ID,
        email: email || undefined,
        parameters: Object.keys(utmParams).length > 0 ? new URLSearchParams(utmParams).toString() : "",
      },
      event: {
        sourceUrl: SOURCE_URL,
        pageTitle: "Compra COD Mobile CP",
        value: value,
        currency: currency || "USD",
        orderId: orderId,
      },
    };

    logStep("Sending PURCHASE to UTMify", { 
      url: UTMIFY_API_URL,
      pixelId: UTMIFY_PIXEL_ID,
      orderId,
      value,
      email 
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
      orderId 
    });

    if (response.ok) {
      logStep("SUCCESS: Purchase tracked to UTMify!", { orderId, value, email });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Purchase tracked successfully",
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
    logStep("CRITICAL ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
