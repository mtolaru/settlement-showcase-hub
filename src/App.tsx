import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SubmitSettlement from "./pages/SubmitSettlement";
import Settlements from "./pages/Settlements";
import SettlementDetail from "./pages/SettlementDetail";
import Confirmation from "./pages/Confirmation";
import Manage from "./pages/Manage";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";

// Import the AdminImport component
import AdminImport from "./pages/AdminImport";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/submit" element={<SubmitSettlement />} />
          <Route path="/settlements" element={<Settlements />} />
          <Route path="/settlements/:id" element={<SettlementDetail />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/account" element={<Account />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/admin/import" element={<AdminImport />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
