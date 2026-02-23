import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import SplashScreen from "./components/SplashScreen";
import Explore from "./pages/Explore";
import TripDetail from "./pages/TripDetail";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import LoyaltyCard from "./pages/LoyaltyCard";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Explore} />
      <Route path="/trip/:id" component={TripDetail} />
      <Route path="/book/:id" component={Booking} />
      <Route path="/bookings" component={MyBookings} />
      <Route path="/community" component={Community} />
      <Route path="/profile" component={Profile} />
      <Route path="/loyalty" component={LoyaltyCard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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
          <SplashScreen show={showSplash} />
          <AppLayout>
            <Router />
          </AppLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
