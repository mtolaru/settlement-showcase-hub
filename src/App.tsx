
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminImport from "./pages/AdminImport";
import SubmitSettlement from "./pages/SubmitSettlement";
import ManageSettlements from "./pages/ManageSettlements";
import SettlementDetail from "./pages/SettlementDetail";
import Leaderboard from "./pages/Leaderboard";
import SubmissionConfirmation from "./pages/SubmissionConfirmation";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Pricing from "./pages/Pricing";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop /> {/* Add the ScrollToTop component here */}
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/import" element={<AdminImport />} />
          <Route path="/submit" element={<SubmitSettlement />} />
          <Route path="/manage" element={<ManageSettlements />} />
          <Route path="/settlements" element={<Leaderboard />} />
          <Route path="/settlements/:id" element={<SettlementDetail />} />
          <Route path="/confirmation" element={<SubmissionConfirmation />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
