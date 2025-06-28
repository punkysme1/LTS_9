import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select, Spinner } from '../UI';
import type { Manuscript, BlogArticle, GuestbookEntry } from '../../types';
import { supabase } from '../../services/supabaseClient';

// --- Type Definitions ---
type ManuscriptFormData = Omit<Manuscript, 'id' | 'created_at'>;
type BlogArticleFormData = Omit<BlogArticle, 'id' | 'created_at' | 'publishDate' | 'snippet'>;


// --- Manuscript Form Component ---
const statuses: Manuscript['status'][] = ['Tersedia', 'Rusak Sebagian', 'Rapuh'];
const categories: Manuscript['category'][] = ['Sejarah', 'Fikih', 'Sastra', 'Tasawuf', 'Lainnya'];
const languages: Manuscript['language'][] = ['Jawa Kuno', 'Arab', 'Melayu', 'Jawa', 'Sunda'];
const scripts: Manuscript['script'][] = ['Pegon', 'Jawa', 'Jawi', 'Arab', 'Sunda Kuno'];
const readabilities: Manuscript['readability'][] = ['Baik', 'Cukup', 'Sulit Dibaca'];

const emptyManuscript: ManuscriptFormData = {
  title: '', author: '', inventoryCode: '', digitalCode: '', status: 'Tersedia', scribe: '', 
  copyYear: new Date().getFullYear(), pageCount: 0, ink: '', category: 'Lainnya', language: 'Jawa', 
  script: 'Pegon', size: '', description: '', condition: '', readability: 'Cukup', colophon: '', 
  thumbnailUrl: '', imageUrls: [], googleDriveUrl: ''
};

const ManuscriptForm: React.FC<{ manuscript: Manuscript | null, onSave: () => void, onCancel: () => void }> = ({ manuscript, onSave, onCancel }) => {
    const [formData, setFormData] = useState<any>(manuscript ? { ...manuscript, imageUrls: manuscript.imageUrls?.join(', ') || '' } : { ...emptyManuscript, imageUrls: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = (name === 'copyYear' || name === 'pageCount') && value !== '';
        setFormData({ ...formData, [name]: isNumber ? parseInt(value, 10) : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const dbData = {
            title: formData.title, author: formData.author, inventory_code: formData.inventoryCode, digital_code: formData.digitalCode,
            status: formData.status, scribe: formData.scribe, copy_year: formData.copyYear, page_count: formData.pageCount,
            ink: formData.ink, category: formData.category, language: formData.language, script: formData.script, size: formData.size,
            description: formData.description, condition: formData.condition, readability: formData.readability, colophon: formData.colophon,
            thumbnail_url: formData.thumbnailUrl || `https://picsum.photos/seed/${Date.now()}/400/500`,
            image_urls: formData.imageUrls.split(',').map((url:string) => url.trim()).filter(Boolean),
            google_drive_url: formData.googleDriveUrl
        };

        let result;
        if (manuscript) {
            result = await supabase.from('manuscripts').update(dbData).eq('id', manuscript.id);
        } else {
            result = await supabase.from('manuscripts').insert([dbData]);
        }

        if (result.error) {
            alert('Error saving manuscript: ' + result.error.message);
        } else {
            alert(`Manuskrip "${formData.title}" berhasil disimpan.`);
            onSave();
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg mt-8">
            <h2 className="font-serif text-2xl font-bold text-brand-dark mb-6">{manuscript ? 'Edit Manuskrip' : 'Tambah Manuskrip Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="title" value={formData.title} onChange={handleChange} placeholder="Judul" required />
                    <Input name="author" value={formData.author} onChange={handleChange} placeholder="Pengarang" />
                    <Input name="inventoryCode" value={formData.inventoryCode} onChange={handleChange} placeholder="Kode Inventaris" />
                    <Input name="digitalCode" value={formData.digitalCode} onChange={handleChange} placeholder="Kode Digital" />
                    <Select name="status" value={formData.status} onChange={handleChange}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    <Select name="category" value={formData.category} onChange={handleChange}>{categories.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    <Input name="scribe" value={formData.scribe} onChange={handleChange} placeholder="Penyalin" />
                    <Input name="copyYear" type="number" value={formData.copyYear} onChange={handleChange} placeholder="Tahun Penyalinan" />
                    <Input name="pageCount" type="number" value={formData.pageCount} onChange={handleChange} placeholder="Jumlah Halaman" />
                    <Input name="ink" value={formData.ink} onChange={handleChange} placeholder="Tinta" />
                    <Select name="language" value={formData.language} onChange={handleChange}>{languages.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    <Select name="script" value={formData.script} onChange={handleChange}>{scripts.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    <Input name="size" value={formData.size} onChange={handleChange} placeholder="Ukuran (cth: 25 x 18 cm)" />
                    <Select name="readability" value={formData.readability} onChange={handleChange}>{readabilities.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                </div>
                <Input name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} placeholder="URL Gambar Thumbnail" />
                <Input name="googleDriveUrl" value={formData.googleDriveUrl} onChange={handleChange} placeholder="URL Folder Google Drive" />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Deskripsi" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" rows={3}></textarea>
                <textarea name="condition" value={formData.condition} onChange={handleChange} placeholder="Kondisi Naskah" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" rows={3}></textarea>
                <textarea name="colophon" value={formData.colophon} onChange={handleChange} placeholder="Kolofon" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" rows={2}></textarea>
                <textarea name="imageUrls" value={formData.imageUrls} onChange={handleChange} placeholder="URL Gambar (pisahkan dengan koma)" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" rows={2}></textarea>
                
                <div className="flex space-x-4 pt-4">
                    <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Batal</Button>
                </div>
            </form>
        </div>
    );
};


// --- Blog Form Component ---
const emptyBlogArticle: BlogArticleFormData = {
    title: '', author: '', content: '', imageUrl: ''
};

const BlogForm: React.FC<{ article: BlogArticle | null, onSave: () => void, onCancel: () => void }> = ({ article, onSave, onCancel }) => {
    const [formData, setFormData] = useState<BlogArticleFormData>(article || emptyBlogArticle);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dbData = {
            ...formData,
            snippet: formData.content.substring(0, 150) + '...',
            publish_date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            image_url: formData.imageUrl,
        };

        const { error } = article
            ? await supabase.from('blog_articles').update(dbData).eq('id', article.id)
            : await supabase.from('blog_articles').insert([dbData]);

        if (error) {
            alert('Error saving article: ' + error.message);
        } else {
            alert(`Artikel "${formData.title}" berhasil disimpan.`);
            onSave();
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg mt-8">
            <h2 className="font-serif text-2xl font-bold text-brand-dark mb-6">{article ? 'Edit Artikel Blog' : 'Tulis Artikel Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="title" value={formData.title} onChange={handleChange} placeholder="Judul Artikel" required />
                <Input name="author" value={formData.author} onChange={handleChange} placeholder="Nama Penulis" required />
                <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="URL Gambar Utama" required />
                <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Isi konten artikel..." 
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" 
                    rows={10} required></textarea>
                 <div className="flex space-x-4 pt-4">
                    <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Artikel'}</Button>
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Batal</Button>
                </div>
            </form>
        </div>
    );
};


// --- Main Admin Page Component ---
const AdminPage: React.FC = () => {
    type View = 'dashboard' | 'manuscript_form' | 'blog_form' | 'guestbook_moderation';
    const [view, setView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);

    const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
    const [editingManuscript, setEditingManuscript] = useState<Manuscript | null>(null);
    
    const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([]);
    const [editingBlogArticle, setEditingBlogArticle] = useState<BlogArticle | null>(null);
    
    const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);


    const fetchData = useCallback(async () => {
        setLoading(true);
        const [msRes, blogRes, guestbookRes] = await Promise.all([
            supabase.from('manuscripts').select('*').order('created_at', { ascending: false }),
            supabase.from('blog_articles').select('*').order('created_at', { ascending: false }),
            supabase.from('guestbook_entries').select('*').order('created_at', { ascending: false })
        ]);

        if(msRes.data) setManuscripts(msRes.data.map((item: any) => ({ ...item, inventoryCode: item.inventory_code, thumbnailUrl: item.thumbnail_url, imageUrls: item.image_urls })));
        if(blogRes.data) setBlogArticles(blogRes.data.map((item: any) => ({ ...item, imageUrl: item.image_url, publishDate: item.publish_date })));
        if(guestbookRes.data) setGuestbookEntries(guestbookRes.data);
        
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers ---
    const handleDelete = async (table: string, id: string, name: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if(error) alert('Gagal menghapus: ' + error.message);
            else {
                alert(`"${name}" berhasil dihapus.`);
                fetchData();
            }
        }
    };
    
    const handleToggleGuestbookApproval = async (entry: GuestbookEntry) => {
        const { error } = await supabase.from('guestbook_entries').update({ is_approved: !entry.is_approved }).eq('id', entry.id);
        if(error) alert('Gagal mengubah status: ' + error.message);
        else fetchData();
    }


    // --- Render Logic ---
    const renderContent = () => {
        if (loading && view === 'dashboard') return <Spinner />;

        switch(view) {
            case 'manuscript_form':
                return <ManuscriptForm manuscript={editingManuscript} onSave={() => { setView('dashboard'); fetchData(); }} onCancel={() => setView('dashboard')} />;
            case 'blog_form':
                return <BlogForm article={editingBlogArticle} onSave={() => { setView('dashboard'); fetchData(); }} onCancel={() => setView('dashboard')} />;
            case 'guestbook_moderation':
                return (
                     <div className="bg-white p-8 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-serif text-2xl font-bold text-brand-dark">Moderasi Buku Tamu ({guestbookEntries.length})</h2>
                            <Button variant="secondary" onClick={() => setView('dashboard')}>Kembali ke Dasbor</Button>
                        </div>
                         <div className="overflow-x-auto">
                             <table className="w-full text-left">
                                 <thead>
                                     <tr className="border-b">
                                         <th className="p-2">Nama & Asal</th>
                                         <th className="p-2">Pesan</th>
                                         <th className="p-2">Status</th>
                                         <th className="p-2">Aksi</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {guestbookEntries.map(entry => (
                                         <tr key={entry.id} className="border-b hover:bg-gray-50">
                                             <td className="p-2 font-semibold">{entry.name} <br/><span className="font-normal text-sm text-gray-500">{entry.origin}</span></td>
                                             <td className="p-2 text-sm">{entry.message}</td>
                                             <td className="p-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${entry.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{entry.is_approved ? 'Disetujui' : 'Menunggu'}</span></td>
                                             <td className="p-2 space-x-2 whitespace-nowrap">
                                                 <button onClick={() => handleToggleGuestbookApproval(entry)} className="text-blue-600 hover:underline text-sm font-medium">{entry.is_approved ? 'Batalkan' : 'Setujui'}</button>
                                                 <button onClick={() => handleDelete('guestbook_entries', entry.id, entry.name)} className="text-red-600 hover:underline text-sm font-medium">Hapus</button>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                );
            case 'dashboard':
            default:
                return (
                    <div className="space-y-12">
                        {/* Manuscript Management */}
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-serif text-2xl font-bold text-brand-dark">Manajemen Manuskrip ({manuscripts.length})</h2>
                                <Button onClick={() => { setEditingManuscript(null); setView('manuscript_form'); }}>Tambah Baru</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="border-b"><th className="p-2">Judul</th><th className="p-2 hidden sm:table-cell">Pengarang</th><th className="p-2 hidden md:table-cell">Kode</th><th className="p-2">Aksi</th></tr></thead>
                                    <tbody>
                                        {manuscripts.slice(0, 5).map(ms => (
                                            <tr key={ms.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 font-semibold">{ms.title}</td>
                                                <td className="p-2 hidden sm:table-cell">{ms.author}</td>
                                                <td className="p-2 hidden md:table-cell">{ms.inventoryCode}</td>
                                                <td className="p-2 space-x-2 whitespace-nowrap">
                                                    <button onClick={() => { setEditingManuscript(ms); setView('manuscript_form'); }} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                                                    <button onClick={() => handleDelete('manuscripts', ms.id, ms.title)} className="text-red-600 hover:underline text-sm font-medium">Hapus</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {manuscripts.length > 5 && <p className="text-center mt-4 text-sm text-gray-500">Menampilkan 5 dari {manuscripts.length} manuskrip...</p>}
                            </div>
                        </div>

                         {/* Blog Management */}
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-serif text-2xl font-bold text-brand-dark">Manajemen Blog ({blogArticles.length})</h2>
                                <Button onClick={() => { setEditingBlogArticle(null); setView('blog_form'); }}>Tulis Artikel Baru</Button>
                            </div>
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="border-b"><th className="p-2">Judul Artikel</th><th className="p-2 hidden sm:table-cell">Penulis</th><th className="p-2">Aksi</th></tr></thead>
                                    <tbody>
                                        {blogArticles.slice(0, 5).map(article => (
                                            <tr key={article.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 font-semibold">{article.title}</td>
                                                <td className="p-2 hidden sm:table-cell">{article.author}</td>
                                                <td className="p-2 space-x-2 whitespace-nowrap">
                                                    <button onClick={() => { setEditingBlogArticle(article); setView('blog_form');}} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                                                    <button onClick={() => handleDelete('blog_articles', article.id, article.title)} className="text-red-600 hover:underline text-sm font-medium">Hapus</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {blogArticles.length > 5 && <p className="text-center mt-4 text-sm text-gray-500">Menampilkan 5 dari {blogArticles.length} artikel...</p>}
                            </div>
                        </div>
                        
                        {/* Guestbook Management */}
                         <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Manajemen Buku Tamu</h2>
                            <p className="text-sm text-gray-600 mb-4">Moderasi pesan pengunjung yang masuk. ({guestbookEntries.filter(e => !e.is_approved).length} pesan menunggu persetujuan)</p>
                            <Button variant="secondary" onClick={() => setView('guestbook_moderation')}>Kelola Buku Tamu</Button>
                        </div>
                    </div>
                );
        }
    }
    
    return (
        <div>
            <div className="bg-brand-dark text-white py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold">Dasbor Admin</h1>
                     <p className="mt-2 text-lg text-brand-light">
                        {view === 'dashboard' ? 'Selamat datang, Admin!' : `Mode: ${view.replace('_', ' ')}`}
                    </p>
                </div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPage;