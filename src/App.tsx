import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetail from "./pages/PropertyDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminPhotos from "./pages/admin/AdminPhotos";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminClients from "./pages/admin/AdminClients";
import AdminContent from "./pages/admin/AdminContent";
import { useWebflowEffects } from "@/hooks/use-webflow-effects";
import IntroSlides from "@/components/IntroSlides";
import { SettingsProvider } from "@/contexts/SettingsContext";

const queryClient = new QueryClient();

function PublicShell() {
  useWebflowEffects();

  return (
    <ErrorBoundary>
      <IntroSlides />
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/venda" element={<Navigate to="/aluguel" replace />} />
          <Route path="/aluguel" element={<PropertiesPage listing="aluguel" />} />
          <Route path="/imovel/:id" element={<PropertyDetail />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <SettingsProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Admin routes — own layout, no Navbar/Footer */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="propriedades" element={<AdminProperties />} />
                <Route path="fotos" element={<AdminPhotos />} />
                <Route path="clientes" element={<AdminClients />} />
                <Route path="reservas" element={<AdminReservations />} />
                <Route path="conteudo" element={<AdminContent />} />
                <Route path="config" element={<AdminSettings />} />
              </Route>
              {/* Public routes */}
              <Route path="/*" element={<PublicShell />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
