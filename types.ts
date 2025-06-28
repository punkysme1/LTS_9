export interface Manuscript {
  id: string; // UUID
  created_at: string;
  title: string;
  author: string;
  inventoryCode: string;
  digitalCode: string;
  status: 'Tersedia' | 'Rusak Sebagian' | 'Rapuh';
  scribe: string;
  copyYear: number;
  pageCount: number;
  ink: string;
  category: 'Sejarah' | 'Fikih' | 'Sastra' | 'Tasawuf' | 'Lainnya';
  language: 'Jawa Kuno' | 'Arab' | 'Melayu' | 'Jawa' | 'Sunda';
  script: 'Pegon' | 'Jawa' | 'Jawi' | 'Arab' | 'Sunda Kuno';
  size: string;
  description: string;
  condition: string;
  readability: 'Baik' | 'Cukup' | 'Sulit Dibaca';
  colophon: string | null;
  thumbnailUrl: string;
  imageUrls: string[];
  googleDriveUrl: string;
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