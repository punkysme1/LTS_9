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

  // Mengambil sesi pengguna saat aplikasi dimuat dan memantau perubahan status autentikasi
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Membersihkan langganan saat komponen tidak lagi digunakan
    return () => subscription.unsubscribe();
  }, []);

  // Menentukan apakah pengguna adalah admin (berdasarkan adanya sesi)
  // Logika otorisasi lebih lanjut harus ditangani di dalam AdminPage
  const isAdmin = !!session;

  return (
    <Layout session={session}>
      <Routes>
        {/* Rute publik yang selalu tersedia */}
        <Route path="/" element={<HomePage />} />
        <Route path="/katalog" element={<CatalogPage />} />
        <Route path="/katalog/:id" element={<ManuscriptDetailPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/buku-tamu" element={<GuestbookPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/kontak" element={<ContactPage />} />
        <Route path="/donasi" element={<DonationPage />} />

        {/* Rute admin: Sekarang selalu dirender.
            Logika untuk memeriksa apakah pengguna benar-benar admin
            dan mengalihkan jika tidak, harus ada di dalam komponen AdminPage. */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
