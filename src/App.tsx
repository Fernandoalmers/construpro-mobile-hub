
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./hooks/use-cart";
import PublicRoutes from "./routes/PublicRoutes";
import AuthRoutes from "./routes/AuthRoutes";
import UserRoutes from "./routes/UserRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import VendorRoutes from "./routes/VendorRoutes";
import AutoFixRoutes from "./routes/AutoFixRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Public Routes */}
            <PublicRoutes />
            
            {/* Auth Routes */}
            <AuthRoutes />
            
            {/* User Routes */}
            <UserRoutes />
            
            {/* Admin Routes */}
            <AdminRoutes />
            
            {/* Vendor Routes */}
            <VendorRoutes />
            
            {/* Auto Fix Routes */}
            <AutoFixRoutes />
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
