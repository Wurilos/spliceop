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
import Mileage from "./pages/Mileage";
import Energy from "./pages/Energy";
import Internet from "./pages/Internet";
import Advances from "./pages/Advances";
import Tolls from "./pages/Tolls";
import ImageMetrics from "./pages/ImageMetrics";
import Infractions from "./pages/Infractions";
import Satisfaction from "./pages/Satisfaction";
import Sla from "./pages/Sla";
import Goals from "./pages/Goals";
import Issues from "./pages/Issues";
import Seals from "./pages/Seals";
import AuditLog from "./pages/AuditLog";
import Infrastructure from "./pages/Infrastructure";
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
            <Route path="/infrastructure" element={<Infrastructure />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/mileage" element={<Mileage />} />
            <Route path="/energy" element={<Energy />} />
            <Route path="/internet" element={<Internet />} />
            <Route path="/advances" element={<Advances />} />
            <Route path="/tolls" element={<Tolls />} />
            <Route path="/image-metrics" element={<ImageMetrics />} />
            <Route path="/infractions" element={<Infractions />} />
            <Route path="/satisfaction" element={<Satisfaction />} />
            <Route path="/sla" element={<Sla />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/seals" element={<Seals />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;