
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import SettlementDetail from "./pages/SettlementDetail";
import SubmitSettlement from "./pages/SubmitSettlement";
import PaymentSelection from "./pages/PaymentSelection";
import PaymentProcessing from "./pages/PaymentProcessing";
import SubmissionConfirmation from "./pages/SubmissionConfirmation";
import ManageSettlements from "./pages/ManageSettlements";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/settlements" element={<Gallery />} />
          <Route path="/settlements/:id" element={<SettlementDetail />} />
          <Route path="/submit" element={<SubmitSettlement />} />
          <Route path="/payment-plans" element={<PaymentSelection />} />
          <Route path="/checkout" element={<PaymentProcessing />} />
          <Route path="/confirmation" element={<SubmissionConfirmation />} />
          <Route path="/manage" element={<ManageSettlements />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
