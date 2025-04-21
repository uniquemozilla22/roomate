import React from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import MobileMenu from "./MobileMenu";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, loading } = useFirebaseAuth();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user && !location.startsWith("/login") && !location.startsWith("/register")) {
      navigate("/login");
    }
  }, [user, loading, location, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-neutral-light">
      {/* Sidebar (desktop only) */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation (Mobile) */}
        <MobileHeader toggleMobileMenu={toggleMobileMenu} />

        {/* Mobile Menu (hidden by default) */}
        <MobileMenu isOpen={mobileMenuOpen} user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-neutral-light">
          {children}
        </main>
      </div>
    </div>
  );
}
