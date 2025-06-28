import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import HomePage from './components/pages/HomePage';
import CatalogPage from './components/pages/CatalogPage';
import ManuscriptDetailPage from './components/pages/ManuscriptDetailPage';
import { BlogPage, GuestbookPage, ProfilePage, ContactPage, DonationPage } from './components/pages/StaticPages';
import AdminPage from './components/pages/AdminPage';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = !!session;

  return (
    <Layout session={session}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/katalog" element={<CatalogPage />} />
        <Route path="/katalog/:id" element={<ManuscriptDetailPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/buku-tamu" element={<GuestbookPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/kontak" element={<ContactPage />} />
        <Route path="/donasi" element={<DonationPage />} />
        {isAdmin && <Route path="/admin" element={<AdminPage />} />}
      </Routes>
    </Layout>
  );
}

export default App;