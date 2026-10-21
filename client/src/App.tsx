import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppearanceProvider } from "./contexts/AppearanceContext";
import AppLayout from "./components/AppLayout";
import SplashScreen from "./components/SplashScreen";
import Explore from "./pages/Explore";
import TripDetail from "./pages/TripDetail";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import LoyaltyCard from "@/pages/LoyaltyCard";
import Schedule from "@/pages/Schedule";
import Trails from "@/pages/Trails";
import TrailDetail from "@/pages/TrailDetail";
import RecordingDetail from "@/pages/RecordingDetail";
import PrivateTrips from "@/pages/PrivateTrips";
import Notifications from "@/pages/Notifications";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminTrips from "./pages/admin/AdminTrips";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLoyalty from "./pages/admin/AdminLoyalty";
import AdminCommunity from "@/pages/admin/AdminCommunity";
import AdminModeration from "@/pages/AdminModeration";
import AdminMissionControl from "./pages/admin/AdminMissionControl";
import AdminNotifications from "./pages/admin/AdminNotifications";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d06]">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public / User routes */}
      <Route path="/" component={Explore} />
      <Route path="/trip/:id" component={TripDetail} />
      <Route path="/book/:id" component={Booking} />
      <Route path="/bookings" component={MyBookings} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/trails" component={Trails} />
      <Route path="/trail/:id" component={TrailDetail} />
      <Route path="/recording/:id" component={RecordingDetail} />
      <Route path="/private-trips" component={PrivateTrips} />
      <Route path="/community" component={Community} />
      <Route path="/profile" component={Profile} />
      <Route path="/loyalty" component={LoyaltyCard} />
      <Route path="/notifications" component={Notifications} />

      {/* Admin routes */}
      <Route path="/admin">
        {() => (
          <AdminGuard>
            <AdminOverview />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/trips">
        {() => (
          <AdminGuard>
            <AdminTrips />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/bookings">
        {() => (
          <AdminGuard>
            <AdminBookings />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <AdminGuard>
            <AdminUsers />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/loyalty">
        {() => (
          <AdminGuard>
            <AdminLoyalty />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/community">
        {() => (
          <AdminGuard>
            <AdminCommunity />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/moderation">
        {() => (
          <AdminGuard>
            <AdminModeration />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/mission-control">
        {() => (
          <AdminGuard>
            <AdminMissionControl />
          </AdminGuard>
        )}
      </Route>
      <Route path="/admin/notifications">
        {() => (
          <AdminGuard>
            <AdminNotifications />
          </AdminGuard>
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [location] = useLocation();

  // Don't show splash on admin pages
  const isAdmin = location.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) {
      setShowSplash(false);
      return;
    }
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, [isAdmin]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppearanceProvider>
        <TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "oklch(0.18 0.01 250)",
                border: "1px solid oklch(1 0 0 / 10%)",
                color: "oklch(0.93 0.005 90)",
              },
            }}
          />
          {!isAdmin && <SplashScreen show={showSplash} />}
          {isAdmin ? (
            <Router />
          ) : (
            <AppLayout>
              <Router />
            </AppLayout>
          )}
        </TooltipProvider>
        </AppearanceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
