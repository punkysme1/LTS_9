import type { TeamMember, NavLink } from './types';

export const NAV_LINKS: NavLink[] = [
  { name: 'Beranda', path: '/' },
  { name: 'Katalog', path: '/katalog' },
  { name: 'Blog', path: '/blog' },
  { name: 'Buku Tamu', path: '/buku-tamu' },
  { name: 'Profil', path: '/profil' },
  { name: 'Kontak', path: '/kontak' },
  { name: 'Donasi', path: '/donasi' },
];

export const MOCK_TEAM: TeamMember[] = [
    { name: 'Dr. Gunawan', role: 'Kepala Peneliti & Pendiri', imageUrl: 'https://picsum.photos/seed/team1/200' },
    { name: 'Rina Kartika, M.Hum.', role: 'Spesialis Konservasi', imageUrl: 'https://picsum.photos/seed/team2/200' },
    { name: 'Agus Setiawan, S.Kom.', role: 'Kepala Digitalisasi', imageUrl: 'https://picsum.photos/seed/team3/200' },
    { name: 'Dewi Lestari', role: 'Kurator & Arsiparis', imageUrl: 'https://picsum.photos/seed/team4/200' },
];