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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { orderId, value, currency, email, utmData } = await req.json();
    logStep("Request data", { orderId, value, currency, email, utmData });

    if (!orderId || !value) {
      throw new Error("Missing required fields: orderId or value");
    }

    const utmifyApiKey = Deno.env.get("UTMIFY_API_KEY");
    
    // Build UTM parameters string
    const utmParams: Record<string, string> = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ttclid'];
    
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
        sourceUrl: "https://codmobile.shop/success",
        pageTitle: "Compra COD Mobile CP",
        value: value,
        currency: currency || "USD",
        orderId: orderId,
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

    if (!response.ok) {
      throw new Error(`UTMify API error: ${response.status} - ${responseData}`);
    }

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
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
