import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from '@/pages/LandingPage';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <div className="min-h-screen">
          <LandingPage />
          <Toaster />
        </div>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;