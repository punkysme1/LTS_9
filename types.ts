// types.ts

export interface Manuscript {
  id: string;
  created_at: string;

  // Identitas & Afiliasi
  afiliasi?: string;
  link_digital_afiliasi?: string;
  nama_koleksi?: string;
  nomor_digitalisasi?: string;
  kode_inventarisasi?: string;
  link_kover?: string;
  link_konten?: string[];
  link_digital_tppkp?: string;
  nomor_koleksi?: string;
  judul_dari_afiliasi?: string;
  judul_dari_tim: string;

  // Klasifikasi
  halaman_pemisah?: string;
  kategori_kailani?: string;
  kategori_ilmu_pesantren?: string;

  // Kepengarangan
  pengarang?: string;
  penyalin?: string;
  tahun_penulisan_teks?: string;
  konversi_masehi?: number;
  lokasi_penyalinan?: string;
  asal_usul_naskah?: string;

  // Bahasa & Aksara
  bahasa?: string;
  aksara?: string;

  // Bahan & Kertas
  watermark?: string;
  countermark?: string;
  kover?: string;
  ukuran_kover?: string;
  jilid?: string;
  ukuran_kertas?: string;
  ukuran_dimensi?: string;

  // Halaman & Teks
  jumlah_halaman?: number;
  halaman_kosong?: string;
  jumlah_baris_per_halaman?: string;
  catatan_pinggir?: boolean;
  catatan_makna?: boolean;

  // Seni & Tinta
  rubrikasi?: boolean;
  iluminasi?: boolean;
  ilustrasi?: boolean;
  tinta?: string;

  // Kondisi & Kolofon
  kondisi_fisik_naskah?: string;
  keterbacaan?: string;
  kelengkapan_naskah?: string;
  kolofon?: string;
  catatan_marginal?: string;
  deskripsi_umum?: string;
  catatan_catatan?: string;
}

export interface BlogArticle {
  id: string; // UUID
  created_at: string;
  title: string;
  author: string;
  publishDate: string;
  snippet: string;
  content: string;
  imageUrl: string;
}

export interface GuestbookEntry {
  id: string; // UUID
  created_at: string;
  name: string;
  origin: string;
  message: string;
  is_approved: boolean;
}

export interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
}

export interface NavLink {
  name: string;
  path: string;
}