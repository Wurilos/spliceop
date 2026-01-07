import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contracts from "./pages/Contracts";
import Employees from "./pages/Employees";
import Equipment from "./pages/Equipment";
import Vehicles from "./pages/Vehicles";
import Fuel from "./pages/Fuel";
import Maintenance from "./pages/Maintenance";
import Calibrations from "./pages/Calibrations";
import ServiceCalls from "./pages/ServiceCalls";
import Invoices from "./pages/Invoices";
import Inventory from "./pages/Inventory";
import MapPage from "./pages/Map";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/fuel" element={<Fuel />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/calibrations" element={<Calibrations />} />
            <Route path="/service-calls" element={<ServiceCalls />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;