import { BrowserRouter, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Lenis from '@studio-freight/lenis';
import { AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

import Home from './pages/Home';
import About from './pages/About';
import Domaines from './pages/Domaines';
import Galerie from './pages/Galerie';
import Contact from './pages/Contact';
import Catalogues from './pages/Catalogues';

import Immobilier from './pages/filiales/Immobilier';
import Restauration from './pages/filiales/Restauration';
import Transit from './pages/filiales/Transit';
import Mining from './pages/filiales/Mining';
import Fishing from './pages/filiales/Fishing';
import Print from './pages/filiales/Print';

import Login from './pages/admin/Login';
import DashboardLayout from './pages/admin/DashboardLayout';
import Dashboard from './pages/admin/Dashboard';
import Leads from './pages/admin/Leads';
import GalerieManager from './pages/admin/GalerieManager';
import CataloguesManager from './pages/admin/CataloguesManager';
import FilialesManager from './pages/admin/FilialesManager';
import PagesEditor from './pages/admin/PagesEditor';
import Settings from './pages/admin/Settings';
import StatsManager from './pages/admin/StatsManager';
import PartenairesManager from './pages/admin/PartenairesManager';
import TemoignagesManager from './pages/admin/TemoignagesManager';
import RealisationsManager from './pages/admin/RealisationsManager';

import { AnimatedPage } from './components/layout/AnimatedPage';

gsap.registerPlugin(ScrollTrigger);

// Global GSAP defaults so animations don't disappear while reading
ScrollTrigger.defaults({
  toggleActions: "play none none reverse",
});

function AdminRoute({ children }: { children: React.ReactNode }) {
  // Read token once on mount to avoid premature redirects when the 401
  // interceptor clears localStorage mid-session (e.g. transient server errors).
  // The interceptor itself performs the logout navigation via window.location.
  const [token] = useState(() => localStorage.getItem('admin_token'));
  const location = useLocation();

  // Allow access to login page without token
  if (!token && (location.pathname === '/admin' || location.pathname === '/admin/login')) {
    return <>{children}</>;
  }

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated and on login/index, redirect to dashboard
  if (location.pathname === '/admin' || location.pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}

function AdminLayout() {
  return (
    <AdminRoute>
      <Outlet />
    </AdminRoute>
  );
}

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        ScrollTrigger.refresh();
      }}
    >
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/about" element={<AnimatedPage><About /></AnimatedPage>} />
        <Route path="/domaines" element={<AnimatedPage><Domaines /></AnimatedPage>} />
        <Route path="/galerie" element={<AnimatedPage><Galerie /></AnimatedPage>} />
        <Route path="/catalogues" element={<AnimatedPage><Catalogues /></AnimatedPage>} />
        <Route path="/contact" element={<AnimatedPage><Contact /></AnimatedPage>} />

        {/* Filiales */}
        <Route path="/immobilier" element={<AnimatedPage><Immobilier /></AnimatedPage>} />
        <Route path="/restauration" element={<AnimatedPage><Restauration /></AnimatedPage>} />
        <Route path="/transit" element={<AnimatedPage><Transit /></AnimatedPage>} />
        <Route path="/mining" element={<AnimatedPage><Mining /></AnimatedPage>} />
        <Route path="/fishing" element={<AnimatedPage><Fishing /></AnimatedPage>} />
        <Route path="/print" element={<AnimatedPage><Print /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}

import { useRealtimeSync } from './hooks/useRealtimeSync';
import NotFound from './components/NotFound';

function App() {
  useRealtimeSync();

  useEffect(() => {
    // Initialisation du Smooth Scroll (Lenis)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes with auth protection */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Login />} />
          <Route path="admin/login" element={<Login />} />
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="demandes" element={<Leads />} />
            <Route path="galerie" element={<GalerieManager />} />
            <Route path="catalogues" element={<CataloguesManager />} />
            <Route path="filiales" element={<FilialesManager />} />
            <Route path="pages" element={<PagesEditor />} />
            <Route path="stats" element={<StatsManager />} />
            <Route path="partenaires" element={<PartenairesManager />} />
            <Route path="temoignages" element={<TemoignagesManager />} />
            <Route path="realisations" element={<RealisationsManager />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Public routes with shared layout */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>}  />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
