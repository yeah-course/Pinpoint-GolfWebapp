import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, AuthGuard } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import GameOverview from "./pages/GameOverview";
import Rounds from "./pages/Rounds";
import RoundNew from "./pages/RoundNew";
import RoundPlay from "./pages/RoundPlay";
import RoundDetail from "./pages/RoundDetail";
import RoundShare from "./pages/RoundShare";
import Courses from "./pages/Courses";
import CourseNew from "./pages/CourseNew";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/rounds/:id/share" element={<RoundShare />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/rounds" element={<AuthGuard><Rounds /></AuthGuard>} />
            <Route path="/rounds/new" element={<AuthGuard><RoundNew /></AuthGuard>} />
            <Route path="/rounds/:id/play" element={<AuthGuard><RoundPlay /></AuthGuard>} />
            <Route path="/rounds/:id" element={<AuthGuard><RoundDetail /></AuthGuard>} />
            <Route path="/courses" element={<AuthGuard><Courses /></AuthGuard>} />
            <Route path="/courses/new" element={<AuthGuard><CourseNew /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
