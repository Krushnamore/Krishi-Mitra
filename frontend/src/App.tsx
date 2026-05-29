import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import Weather from "./pages/Weather";
import FarmerChatbot from "./pages/FarmerChatbot";
import YojnaSchemes from "./pages/YojnaSchemes";
import NearbyRetailers from "./pages/NearbyRetailers";
import CropDiagnosis from "./pages/CropDiagnosis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "farmer" | "retailer";
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole)
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/about" element={<About />} />

    {/* Protected: both roles */}
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />

    {/* Protected: retailer only */}
    <Route path="/inventory" element={<ProtectedRoute requiredRole="retailer"><Inventory /></ProtectedRoute>} />
    <Route path="/alerts" element={<ProtectedRoute requiredRole="retailer"><Alerts /></ProtectedRoute>} />

    {/* Protected: farmer only */}
    <Route path="/farmer/chatbot" element={<ProtectedRoute requiredRole="farmer"><FarmerChatbot /></ProtectedRoute>} />
    <Route path="/farmer/yojna" element={<ProtectedRoute requiredRole="farmer"><YojnaSchemes /></ProtectedRoute>} />
    <Route path="/farmer/retailers" element={<ProtectedRoute requiredRole="farmer"><NearbyRetailers /></ProtectedRoute>} />
    <Route path="/farmer/crop-diagnosis" element={<ProtectedRoute requiredRole="farmer"><CropDiagnosis /></ProtectedRoute>} />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;