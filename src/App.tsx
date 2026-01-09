import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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

import Seals from "./pages/Seals";
import AuditLog from "./pages/AuditLog";
import Infrastructure from "./pages/Infrastructure";
import Alerts from "./pages/Alerts";
import Kanban from "./pages/Kanban";
import KanbanItems from "./pages/KanbanItems";
import PhoneLines from "./pages/PhoneLines";
import IssuesDashboard from "./pages/IssuesDashboard";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />
            <Route path="/kanban-items" element={<ProtectedRoute><KanbanItems /></ProtectedRoute>} />
            <Route path="/issues-dashboard" element={<ProtectedRoute><IssuesDashboard /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
            <Route path="/fuel" element={<ProtectedRoute><Fuel /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
            <Route path="/calibrations" element={<ProtectedRoute><Calibrations /></ProtectedRoute>} />
            <Route path="/service-calls" element={<ProtectedRoute><ServiceCalls /></ProtectedRoute>} />
            <Route path="/infrastructure" element={<ProtectedRoute><Infrastructure /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/mileage" element={<ProtectedRoute><Mileage /></ProtectedRoute>} />
            <Route path="/energy" element={<ProtectedRoute><Energy /></ProtectedRoute>} />
            <Route path="/internet" element={<ProtectedRoute><Internet /></ProtectedRoute>} />
            <Route path="/advances" element={<ProtectedRoute><Advances /></ProtectedRoute>} />
            <Route path="/tolls" element={<ProtectedRoute><Tolls /></ProtectedRoute>} />
            <Route path="/image-metrics" element={<ProtectedRoute><ImageMetrics /></ProtectedRoute>} />
            <Route path="/infractions" element={<ProtectedRoute><Infractions /></ProtectedRoute>} />
            <Route path="/satisfaction" element={<ProtectedRoute><Satisfaction /></ProtectedRoute>} />
            <Route path="/sla" element={<ProtectedRoute><Sla /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            
            <Route path="/seals" element={<ProtectedRoute><Seals /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
            <Route path="/phone-lines" element={<ProtectedRoute><PhoneLines /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;