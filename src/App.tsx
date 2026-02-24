import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load all other pages for better initial bundle size
const Contracts = lazy(() => import("./pages/Contracts"));
const Employees = lazy(() => import("./pages/Employees"));
const Equipment = lazy(() => import("./pages/Equipment"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const Fuel = lazy(() => import("./pages/Fuel"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Calibrations = lazy(() => import("./pages/Calibrations"));
const ServiceCalls = lazy(() => import("./pages/ServiceCalls"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Inventory = lazy(() => import("./pages/Inventory"));
const MapPage = lazy(() => import("./pages/Map"));
const Mileage = lazy(() => import("./pages/Mileage"));
const Energy = lazy(() => import("./pages/Energy"));
const Internet = lazy(() => import("./pages/Internet"));
const Advances = lazy(() => import("./pages/Advances"));
const Tolls = lazy(() => import("./pages/Tolls"));
const ImageMetrics = lazy(() => import("./pages/ImageMetrics"));
const Infractions = lazy(() => import("./pages/Infractions"));
const Satisfaction = lazy(() => import("./pages/Satisfaction"));
const Sla = lazy(() => import("./pages/Sla"));
const Goals = lazy(() => import("./pages/Goals"));
const Teams = lazy(() => import("./pages/Teams"));
const Seals = lazy(() => import("./pages/Seals"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Infrastructure = lazy(() => import("./pages/Infrastructure"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Kanban = lazy(() => import("./pages/Kanban"));
const KanbanItems = lazy(() => import("./pages/KanbanItems"));
const PhoneLines = lazy(() => import("./pages/PhoneLines"));
const IssuesDashboard = lazy(() => import("./pages/IssuesDashboard"));
const Epi = lazy(() => import("./pages/Epi"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Optimized QueryClient with tiered caching strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      retry: 1,
    },
  },
});

function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[GlobalErrorHandler] Unhandled rejection:", event.reason);
      event.preventDefault();
      toast.error("Ocorreu um erro de conexão. Tente novamente.");
    };

    const handleError = (event: ErrorEvent) => {
      console.error("[GlobalErrorHandler] Unhandled error:", event.error);
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <GlobalErrorHandler>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                  <Route path="/kanban" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />
                  <Route path="/kanban-items" element={<ProtectedRoute><KanbanItems /></ProtectedRoute>} />
                  <Route path="/issues-dashboard" element={<ProtectedRoute><IssuesDashboard /></ProtectedRoute>} />
                  <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
                  <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                  <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
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
                  <Route path="/epi" element={<ProtectedRoute><Epi /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </GlobalErrorHandler>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
