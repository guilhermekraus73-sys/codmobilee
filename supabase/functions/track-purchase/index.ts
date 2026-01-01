import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-PURCHASE] ${step}${detailsStr}`);
};

// UTMify Pixel ID for COD Mobile
const UTMIFY_PIXEL_ID = "69541e567c5e5c96cc8e701a";
const SOURCE_URL = "https://codpointsmobile.online/success";

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
      // If not ok, log and retry
      logStep(`Attempt ${attempt} failed with status ${response.status}`);
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logStep(`Attempt ${attempt} failed with error: ${lastError.message}`);
    }
    
    // Wait before retry (exponential backoff: 1s, 2s, 4s)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { orderId, value, currency, email, utmData } = await req.json();
    logStep("Request data", { orderId, value, currency, email, utmData });

    // Validate required fields
    if (!orderId || value === undefined || value === null) {
      throw new Error("Missing required fields: orderId or value");
    }

    const utmifyApiKey = Deno.env.get("UTMIFY_API_KEY");
    if (!utmifyApiKey) {
      logStep("WARNING: UTMIFY_API_KEY not set");
    }
    
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

    logStep("Sending to UTMify", payload);

    const response = await fetchWithRetry(
      "https://tracking.utmify.com.br/tracking/v1/events",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(utmifyApiKey ? { "Authorization": `Bearer ${utmifyApiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      },
      3 // Max retries
    );

    const responseData = await response.text();
    logStep("UTMify response", { status: response.status, data: responseData });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Purchase tracked successfully",
        utmifyResponse: JSON.parse(responseData)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
