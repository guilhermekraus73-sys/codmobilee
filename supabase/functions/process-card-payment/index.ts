import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-CARD-PAYMENT] ${step}${detailsStr}`);
};

// Rate limiting constants
const MAX_ATTEMPTS_PER_CARD = 2;
const MAX_TOTAL_ATTEMPTS = 5;
const MAX_DIFFERENT_CARDS = 3;

// Preços em centavos USD
const PRODUCTS: Record<string, { name: string; price: number; cp: number }> = {
  'cp-800': { name: '1200 CP + 1200 Bonus', price: 990, cp: 2400 },
  'cp-1600': { name: '2500 CP + 2500 Bonus', price: 1690, cp: 5000 },
  'cp-4000': { name: '5000 CP + 5000 Bonus', price: 1990, cp: 10000 },
  'cp-test': { name: 'Test Package', price: 100, cp: 100 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { packageId, email, cardLast4, utmData, fullName, country, postalCode } = await req.json();
    
    // Get client IP from headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    logStep("Request data", { packageId, email, cardLast4, clientIp, fullName, country, postalCode });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const product = PRODUCTS[packageId];
    if (!product) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }
    logStep("Product found", product);

    // Initialize Supabase admin client for rate limiting
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Clean old attempts first (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Check rate limits
    logStep("Checking rate limits", { clientIp, cardLast4 });
    
    const { data: recentAttempts, error: fetchError } = await supabaseAdmin
      .from('payment_attempts')
      .select('*')
      .eq('ip_address', clientIp)
      .gte('created_at', oneHourAgo);

    if (fetchError) {
      logStep("Error fetching attempts", { error: fetchError.message });
      // Continue anyway, don't block payment if DB query fails
    }

    if (recentAttempts && recentAttempts.length > 0) {
      const totalAttempts = recentAttempts.length;
      const uniqueCards = new Set(recentAttempts.filter(a => a.card_last4).map(a => a.card_last4));
      const attemptsForThisCard = cardLast4 
        ? recentAttempts.filter(a => a.card_last4 === cardLast4).length 
        : 0;

      logStep("Rate limit check", { 
        totalAttempts, 
        uniqueCards: uniqueCards.size, 
        attemptsForThisCard 
      });

      // Check if blocked
      if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
        logStep("BLOCKED: Max total attempts exceeded", { totalAttempts });
        return new Response(
          JSON.stringify({ 
            error: "Has excedido el límite de intentos. Por favor espera 1 hora.",
            blocked: true,
            reason: "max_total_attempts"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }

      if (uniqueCards.size >= MAX_DIFFERENT_CARDS && cardLast4 && !uniqueCards.has(cardLast4)) {
        logStep("BLOCKED: Max different cards exceeded", { uniqueCards: uniqueCards.size });
        return new Response(
          JSON.stringify({ 
            error: "Has usado demasiadas tarjetas diferentes. Por favor espera 1 hora.",
            blocked: true,
            reason: "max_different_cards"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }

      if (cardLast4 && attemptsForThisCard >= MAX_ATTEMPTS_PER_CARD) {
        logStep("BLOCKED: Max attempts for this card exceeded", { attemptsForThisCard });
        return new Response(
          JSON.stringify({ 
            error: "Has excedido el límite de intentos para esta tarjeta. Por favor usa otra tarjeta o espera 1 hora.",
            blocked: true,
            reason: "max_attempts_per_card"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
    }

    // Record this attempt
    const { error: insertError } = await supabaseAdmin
      .from('payment_attempts')
      .insert({
        ip_address: clientIp,
        card_last4: cardLast4 || null,
        email: email || null,
        attempt_type: 'card_payment'
      });

    if (insertError) {
      logStep("Error recording attempt", { error: insertError.message });
      // Continue anyway
    } else {
      logStep("Attempt recorded successfully");
    }

    // Proceed with payment
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Update customer with name if provided
        if (fullName) {
          await stripe.customers.update(customerId, { name: fullName });
        }
        logStep("Existing customer found", { customerId });
      } else {
        const customer = await stripe.customers.create({ 
          email,
          name: fullName || undefined,
        });
        customerId = customer.id;
        logStep("New customer created", { customerId });
      }
    }

    // Create Payment Intent with shipping/billing info for better approval rates
    const paymentIntentData: any = {
      amount: product.price,
      currency: "usd",
      customer: customerId,
      metadata: {
        app: "codmobile",
        packageId,
        packageName: product.name,
        cpAmount: product.cp.toString(),
        email: email || '',
        cardLast4: cardLast4 || '',
        clientIp,
        country: country || '',
        postalCode: postalCode || '',
        fullName: fullName || '',
        ...utmData,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Add shipping info with country and postal code - helps with fraud detection and approval rates
    if (country || fullName || postalCode) {
      paymentIntentData.shipping = {
        name: fullName || 'Customer',
        address: {
          country: country || 'US',
          postal_code: postalCode || undefined,
          line1: 'Digital Product Delivery',
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    logStep("Payment Intent created", { 
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ? "exists" : "missing"
    });

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
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
