import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { NAV_LINKS } from '../constants';
import { BookOpenIcon, MenuIcon, XIcon } from './Icons';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Button, Input } from './UI';

const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            onClose();
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="font-serif text-2xl font-bold text-brand-dark mb-4">Login Admin</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-4">
                         <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                         <Button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Login'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface LayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

const Header: React.FC<Pick<LayoutProps, 'session'>> = ({ session }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeLinkClass = 'text-brand-accent';
  const inactiveLinkClass = 'hover:text-brand-accent transition-colors duration-300';

  const allNavLinks = session ? [...NAV_LINKS, { name: 'Admin', path: '/admin' }] : NAV_LINKS;

  return (
    <header className="bg-brand-dark/90 backdrop-blur-sm text-white sticky top-0 z-40 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <NavLink to="/" className="flex items-center space-x-3 group">
            <BookOpenIcon className="w-8 h-8 text-brand-accent group-hover:rotate-6 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-wider">Galeri Manuskrip</span>
              <span className="text-xs text-brand-accent">SAMPURNAN</span>
            </div>
          </NavLink>
          
          <nav className="hidden md:flex items-center space-x-6">
            {allNavLinks.map((link) => (
              <NavLink key={link.name} to={link.path} className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>
                {link.name}
              </NavLink>
            ))}
          </nav>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden bg-brand-dark pb-4">
          <nav className="flex flex-col items-center space-y-4">
             {allNavLinks.map((link) => (
              <NavLink key={link.name} to={link.path} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>
                {link.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

interface FooterProps {
    session: Session | null;
}

const Footer: React.FC<FooterProps> = ({ session }) => {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <footer className="bg-brand-dark text-brand-light mt-16">
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
            <div className="flex justify-center space-x-4 mb-6">
                <a href="#" className="hover:text-brand-accent">Facebook</a>
                <a href="#" className="hover:text-brand-accent">Twitter</a>
                <a href="#" className="hover:text-brand-accent">Instagram</a>
            </div>
             <div className="mb-6 pt-6 border-t border-gray-700/50">
                <p className="text-sm text-gray-400 mb-3">Akses Panel Admin</p>
                <button
                    onClick={() => session ? handleLogout() : setShowLogin(true)}
                    className="bg-brand-accent text-brand-dark px-6 py-2 rounded-md text-sm font-semibold hover:bg-brand-accent-dark transition-colors duration-300"
                >
                    {session ? 'Logout Admin' : 'Login sebagai Admin'}
                </button>
            </div>
          <p>&copy; {new Date().getFullYear()} Galeri Manuskrip Sampurnan. All Rights Reserved.</p>
          <p className="text-sm text-gray-400 mt-2">Menjaga Warisan, Membuka Jendela Pengetahuan Masa Lalu.</p>
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, session }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />
      <main className="flex-grow">{children}</main>
      <Footer session={session} />
    </div>
  );
};