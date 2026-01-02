import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useUtmifyStripePixel, storeUtmParams } from "@/hooks/useUtmifyStripePixel";
import Index from "./pages/Index";
import Identificar from "./pages/Identificar";
import Recharge from "./pages/Recharge";
import Checkout from "./pages/Checkout";
import Checkout1 from "./pages/Checkout1";
import Checkout2 from "./pages/Checkout2";
import Checkout3 from "./pages/Checkout3";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to initialize UTMify - must be inside Router to access URL
const UtmifyInit = () => {
  useUtmifyStripePixel();
  
  useEffect(() => {
    // Store UTM params when user lands on page
    // This runs on every page load to capture params from ads
    const captured = storeUtmParams();
    if (captured) {
      console.log('[UTMify] ✅ Tracking params captured from URL');
    }
  }, []);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UtmifyInit />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/identificar" element={<Identificar />} />
          <Route path="/recharge" element={<Recharge />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout1" element={<Checkout1 />} />
          <Route path="/checkout2" element={<Checkout2 />} />
          <Route path="/checkout3" element={<Checkout3 />} />
          <Route path="/success" element={<Success />} />
          <Route path="/quiz" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
