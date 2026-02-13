import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dashboard-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple auth via header
    const dashKey = req.headers.get("x-dashboard-key");
    const expectedKey = Deno.env.get("DASHBOARD_SECRET_KEY");
    
    if (!expectedKey || dashKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "today";

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    const startISO = startDate.toISOString();

    // Fetch page views
    const { data: pageViews, error: pvError } = await supabaseAdmin
      .from("page_views")
      .select("*")
      .gte("created_at", startISO)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (pvError) console.error("Page views error:", pvError);

    // Fetch orders
    const { data: orders, error: ordError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .gte("created_at", startISO)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (ordError) console.error("Orders error:", ordError);

    // Process funnel data
    const funnelSteps = ["quiz", "identify", "recharge", "checkout", "success"];
    const funnel: Record<string, number> = {};
    funnelSteps.forEach(step => {
      funnel[step] = (pageViews || []).filter((pv: any) => pv.page === step).length;
    });

    // Process orders by country
    const countryCounts: Record<string, { count: number; revenue: number }> = {};
    (orders || []).forEach((order: any) => {
      const country = order.country || "Unknown";
      if (!countryCounts[country]) countryCounts[country] = { count: 0, revenue: 0 };
      countryCounts[country].count++;
      countryCounts[country].revenue += (order.amount_cents || 0) / 100;
    });

    // Total revenue
    const totalRevenue = (orders || []).reduce((sum: number, o: any) => sum + (o.amount_cents || 0) / 100, 0);
    const totalOrders = (orders || []).length;

    // Orders by hour (for chart)
    const ordersByHour: Record<string, number> = {};
    (orders || []).forEach((order: any) => {
      const hour = new Date(order.created_at).toISOString().substring(0, 13) + ":00";
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
    });

    // UTM source breakdown
    const utmSources: Record<string, number> = {};
    (pageViews || []).forEach((pv: any) => {
      const src = pv.utm_source || "direct";
      utmSources[src] = (utmSources[src] || 0) + 1;
    });

    // Unique sessions
    const uniqueSessions = new Set((pageViews || []).map((pv: any) => pv.session_id).filter(Boolean)).size;

    return new Response(
      JSON.stringify({
        funnel,
        totalRevenue,
        totalOrders,
        countryCounts,
        ordersByHour,
        utmSources,
        uniqueSessions,
        totalPageViews: (pageViews || []).length,
        recentOrders: (orders || []).slice(0, 20).map((o: any) => ({
          id: o.id,
          created_at: o.created_at,
          email: o.email,
          package_name: o.package_name,
          amount: (o.amount_cents || 0) / 100,
          country: o.country,
          utm_source: o.utm_source,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
