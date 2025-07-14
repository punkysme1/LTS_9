import React from 'react';
import type { Manuscript } from '../types';
import { NavLink } from 'react-router-dom';

export const Spinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}
export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'px-6 py-2 rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-md';
  const variantClasses = variant === 'primary' 
    ? 'bg-brand-accent text-brand-dark hover:bg-brand-accent-dark'
    : 'bg-gray-200 text-brand-dark hover:bg-gray-300';
  
  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ## PERBAIKAN DI SINI: Menggunakan skema data Manuscript yang baru ##
interface CardProps {
  // Menggunakan Partial<Manuscript> agar lebih fleksibel jika hanya sebagian data yang di-fetch
  manuscript: Partial<Manuscript>;
}
export const ManuscriptCard: React.FC<CardProps> = ({ manuscript }) => (
    <NavLink to={`/katalog/${manuscript.id}`} className="block bg-white rounded-lg shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300">
        <div className="relative h-64 bg-gray-200">
            <img 
              src={manuscript.link_kover || 'https://via.placeholder.com/400x300?text=No+Image'} 
              alt={manuscript.judul_dari_tim || 'Manuskrip'} 
              className="w-full h-full object-cover" 
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-300"></div>
        </div>
        <div className="p-4">
            <h3 className="font-serif text-lg font-bold text-brand-dark group-hover:text-brand-accent transition-colors truncate">{manuscript.judul_dari_tim}</h3>
            <p className="text-sm text-gray-600 truncate">{manuscript.pengarang || 'Pengarang tidak diketahui'}</p>
            <p className="text-xs text-gray-500 mt-2 truncate">{manuscript.kode_inventarisasi || 'Kode tidak tersedia'}</p>
        </div>
    </NavLink>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input: React.FC<InputProps> = ({ className, ...props }) => (
  <input className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition ${className}`} {...props} />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
}
export const Select: React.FC<SelectProps> = ({ className, children, ...props }) => (
  <select className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition bg-white ${className}`} {...props}>
    {children}
  </select>
);