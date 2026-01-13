import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import KabupatenWizard from "./pages/KabupatenWizard";
import KecamatanWizard from "./pages/KecamatanWizard";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

// === AUTO-EXPIRE CACHE (12 hours) ===
const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 jam dalam milliseconds
const LAST_UPDATE_KEY = 'skpg-last-update';

// Cek saat app pertama kali load
const checkAndClearExpiredCache = () => {
  const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
  
  if (lastUpdate) {
    const timeSinceLastUpdate = Date.now() - Number(lastUpdate);
    
    if (timeSinceLastUpdate > TWELVE_HOURS) {
      // Data sudah lebih dari 12 jam, hapus semua
      console.log('Cache expired (>12 hours), clearing localStorage...');
      localStorage.clear();
    }
  }
  
  // Update timestamp (untuk tracking kapan terakhir app digunakan)
  localStorage.setItem(LAST_UPDATE_KEY, String(Date.now()));
};

// Jalankan pengecekan saat app load
checkAndClearExpiredCache();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page without Layout */}
          <Route path="/" element={<Landing />} />
          
          {/* Main routes with Layout */}
          <Route element={<Layout />}>
            <Route path="/kabupaten" element={<KabupatenWizard />} />
            <Route path="/kecamatan" element={<KecamatanWizard />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
