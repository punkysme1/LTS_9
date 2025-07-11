import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Manuscript, BlogArticle, GuestbookEntry } from '../../types';
import { supabase } from '../../services/supabaseClient';
import * as XLSX from 'xlsx';

// --- UI & ICONS ---
// Pastikan Anda sudah menginstal react-icons: npm install react-icons
import { 
    FaTachometerAlt, FaBook, FaNewspaper, FaComments, FaUserCircle, 
    FaBars, FaPlus, FaUpload, FaDownload, FaPen, FaTrash
} from 'react-icons/fa';

// Asumsi komponen UI ini ada di direktori ../UI
import { Button, Input, Select, Spinner } from '../UI';

// --- TYPE DEFINITIONS ---
type ManuscriptFormData = Omit<Manuscript, 'id' | 'created_at'>;
type BlogArticleFormData = Omit<BlogArticle, 'id' | 'created_at' | 'publishDate' | 'snippet'>;
type View = 'dashboard' | 'manuscripts' | 'manuscript_form' | 'blog' | 'blog_form' | 'guestbook';

// --- FORM DEFAULTS & OPTIONS ---
const statuses: Manuscript['status'][] = ['Tersedia', 'Rusak Sebagian', 'Rapuh'];
const categories: Manuscript['category'][] = ['Keilmuan Islam Umum', 'Alquran dan Ilmu yang Berkaitan', 'Akaid dan Ilmu Kalam', 'Fiqih', 'Akhlaq dan Tasawwuf', 'Sosial dan Budaya', 'Filsafat dan Perkembangannya', 'Aliran dan Sekte dalam Islam', 'Hadits dan Ilmu yang berkaitan', 'Sejarah Islam dan Bibliografi'];
const readabilities: Manuscript['readability'][] = ['Baik', 'Cukup', 'Sulit Dibaca'];

const emptyManuscript: ManuscriptFormData = {
  title: '', author: '', inventoryCode: '', digitalCode: '', status: 'Tersedia', scribe: '', 
  copyYear: new Date().getFullYear(), pageCount: 0, ink: '', category: 'Fiqih', language: '', 
  script: '', size: '', description: '', condition: '', readability: 'Cukup', colophon: '', 
  thumbnailUrl: '', imageUrls: [], googleDriveUrl: ''
};

const emptyBlogArticle: BlogArticleFormData = {
    title: '', author: '', content: '', imageUrl: ''
};

// --- REUSABLE LAYOUT COMPONENTS ---
const Card: React.FC<{ title: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode; }> = ({ title, children, actions }) => (
    <div className="card bg-white shadow-md rounded-lg w-full">
        <div className="card-header bg-gray-50 p-4 border-b rounded-t-lg flex justify-between items-center flex-wrap gap-2">
            <h3 className="card-title text-lg font-semibold text-gray-800">{title}</h3>
            {actions && <div className="card-tools flex items-center space-x-2">{actions}</div>}
        </div>
        <div className="card-body p-6">{children}</div>
    </div>
);

const InfoBox: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`small-box ${color} shadow-sm rounded-lg flex p-4 items-center text-white`}>
        <div className="inner flex-grow">
            <h3 className="text-3xl font-bold">{value}</h3>
            <p className="text-sm">{title}</p>
        </div>
        <div className="icon text-white/50 text-5xl flex items-center justify-center">
            {icon}
        </div>
    </div>
);

// --- FORM COMPONENTS ---
const ManuscriptForm: React.FC<{ manuscript: Manuscript | null, onSave: () => void, onCancel: () => void }> = ({ manuscript, onSave, onCancel }) => {
    const [formData, setFormData] = useState<any>(manuscript ? { ...manuscript, imageUrls: manuscript.imageUrls?.join(',\n') || '' } : { ...emptyManuscript, imageUrls: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = (name === 'copyYear' || name === 'pageCount') && value !== '';
        setFormData({ ...formData, [name]: isNumber ? parseInt(value, 10) : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const imageUrlsArray = formData.imageUrls.split(/[\s,]+/).map((url:string) => url.trim()).filter(Boolean);

        const dbData = {
            title: formData.title, author: formData.author, inventory_code: formData.inventoryCode, digital_code: formData.digitalCode,
            status: formData.status, scribe: formData.scribe, copy_year: formData.copyYear, page_count: formData.pageCount,
            ink: formData.ink, category: formData.category, language: formData.language, script: formData.script, size: formData.size,
            description: formData.description, condition: formData.condition, readability: formData.readability, colophon: formData.colophon,
            thumbnail_url: formData.thumbnailUrl || imageUrlsArray[0] || '',
            image_urls: imageUrlsArray,
            google_drive_url: formData.googleDriveUrl || '',
        };

        const { error } = manuscript
            ? await supabase.from('manuscripts').update(dbData).eq('id', manuscript.id)
            : await supabase.from('manuscripts').insert([dbData]);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert(`Manuskrip "${formData.title}" berhasil disimpan.`);
            onSave();
        }
        setLoading(false);
    };

    return (
        <Card title={manuscript ? 'Edit Manuskrip' : 'Tambah Manuskrip Baru'}>
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
                    <Input name="language" value={formData.language} onChange={handleChange} placeholder="Bahasa" />
                    <Input name="script" value={formData.script} onChange={handleChange} placeholder="Aksara" />
                    <Input name="size" value={formData.size} onChange={handleChange} placeholder="Ukuran (cth: 25 x 18 cm)" />
                    <Select name="readability" value={formData.readability} onChange={handleChange}>{readabilities.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                </div>
                <Input name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} placeholder="URL Gambar Thumbnail (Opsional)" />
                <textarea name="imageUrls" value={formData.imageUrls} onChange={handleChange} placeholder="Tempel URL gambar, pisahkan dengan koma atau baris baru" className="w-full mt-2 px-3 py-2 border rounded-md" rows={4} required></textarea>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Deskripsi" className="w-full mt-2 px-3 py-2 border rounded-md" rows={3}></textarea>
                <textarea name="condition" value={formData.condition} onChange={handleChange} placeholder="Kondisi Naskah" className="w-full mt-2 px-3 py-2 border rounded-md" rows={3}></textarea>
                <textarea name="colophon" value={formData.colophon} onChange={handleChange} placeholder="Kolofon" className="w-full mt-2 px-3 py-2 border rounded-md" rows={2}></textarea>
                
                <div className="flex space-x-4 pt-4 border-t mt-4">
                    <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Batal</Button>
                </div>
            </form>
        </Card>
    );
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
            alert('Error: ' + error.message);
        } else {
            alert(`Artikel "${formData.title}" berhasil disimpan.`);
            onSave();
        }
        setLoading(false);
    };

    return (
        <Card title={article ? 'Edit Artikel Blog' : 'Tulis Artikel Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="title" value={formData.title} onChange={handleChange} placeholder="Judul Artikel" required />
                <Input name="author" value={formData.author} onChange={handleChange} placeholder="Nama Penulis" required />
                <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="URL Gambar Utama" required />
                <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Isi konten artikel..." className="w-full mt-2 px-3 py-2 border rounded-md" rows={10} required></textarea>
                 <div className="flex space-x-4 pt-4 border-t mt-4">
                    <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Artikel'}</Button>
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Batal</Button>
                </div>
            </form>
        </Card>
    );
};

// --- MODAL COMPONENT ---
const MassUploadModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: () => void }> = ({ isOpen, onClose, onSave }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const headers = ['title', 'author', 'inventoryCode', 'digitalCode', 'status', 'scribe', 'copyYear', 'pageCount', 'ink', 'category', 'language', 'script', 'size', 'description', 'condition', 'readability', 'colophon', 'thumbnailUrl', 'imageUrls'];

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "template_manuskrip.xlsx");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError(null);
            setSuccess(null);
        }
    };

    const handleUpload = () => {
        if (!file) return setError("Silakan pilih file untuk diunggah.");
        setLoading(true);
        setError(null);
        setSuccess(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const json_data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

                if (json_data.length === 0) throw new Error("File Excel kosong atau formatnya salah.");

                const dbData = json_data.map(ms => ({
                    title: ms.title, author: ms.author, inventory_code: ms.inventoryCode, digital_code: ms.digitalCode,
                    status: ms.status, scribe: ms.scribe, copy_year: ms.copyYear ? parseInt(String(ms.copyYear), 10) : null,
                    page_count: ms.pageCount ? parseInt(String(ms.pageCount), 10) : null, ink: ms.ink, category: ms.category,
                    language: ms.language, script: ms.script, size: ms.size, description: ms.description,
                    condition: ms.condition, readability: ms.readability, colophon: ms.colophon,
                    thumbnail_url: ms.thumbnailUrl || (ms.imageUrls ? String(ms.imageUrls).split(';')[0].trim() : ''),
                    image_urls: ms.imageUrls ? String(ms.imageUrls).split(';').map((url: string) => url.trim()).filter(Boolean) : []
                }));

                const { error: insertError } = await supabase.from('manuscripts').insert(dbData);
                if (insertError) throw new Error(`Gagal menyimpan: ${insertError.message}`);
                
                setSuccess(`${json_data.length} manuskrip berhasil diunggah.`);
                onSave();
                setTimeout(() => { onClose(); setFile(null); }, 2000);

            } catch (e: any) {
                setError(e.message || "Gagal memproses file Excel.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Mass Upload Manuskrip (Excel)</h2>
                <div className="space-y-4">
                    <p className="text-gray-600">Gunakan template untuk menambahkan beberapa manuskrip sekaligus.</p>
                    <Button type="button" variant="secondary" onClick={handleDownloadTemplate}><FaDownload className="mr-2"/> Unduh Template</Button>
                    <div>
                        <label htmlFor="xlsx-upload" className="block text-sm font-medium text-gray-700 mb-1">Pilih File (.xlsx)</label>
                        <Input id="xlsx-upload" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                    </div>
                    {loading && <Spinner />}
                    {error && <div className="text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
                    {success && <div className="text-green-800 bg-green-100 p-3 rounded-md">{success}</div>}
                </div>
                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Tutup</Button>
                    <Button type="button" onClick={handleUpload} disabled={loading || !file}><FaUpload className="mr-2"/> Unggah File</Button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE VIEWS ---
const DashboardView: React.FC<{ data: { manuscripts: Manuscript[], blogArticles: BlogArticle[], guestbookEntries: GuestbookEntry[] } }> = ({ data }) => (
    <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <InfoBox title="Total Manuskrip" value={data.manuscripts.length} icon={<FaBook />} color="bg-blue-500" />
            <InfoBox title="Artikel Blog" value={data.blogArticles.length} icon={<FaNewspaper />} color="bg-green-500" />
            <InfoBox title="Pesan Buku Tamu" value={data.guestbookEntries.length} icon={<FaComments />} color="bg-yellow-500" />
            <InfoBox title="Menunggu Persetujuan" value={data.guestbookEntries.filter(e => !e.is_approved).length} icon={<FaComments />} color="bg-red-500" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Manuskrip Terbaru">
                <ul className="divide-y divide-gray-200">
                    {data.manuscripts.slice(0, 5).map((ms) => (
                        <li key={ms.id} className="py-2">{ms.title}</li>
                    ))}
                </ul>
            </Card>
            <Card title="Artikel Blog Terbaru">
                 <ul className="divide-y divide-gray-200">
                    {data.blogArticles.slice(0, 5).map((article) => (
                        <li key={article.id} className="py-2">{article.title}</li>
                    ))}
                </ul>
            </Card>
        </div>
    </section>
);

const ManuscriptView: React.FC<{
    manuscripts: Manuscript[];
    onEdit: (ms: Manuscript) => void;
    onDelete: (id: string, title: string) => void;
    onAddNew: () => void;
    onMassUpload: () => void;
}> = ({ manuscripts, onEdit, onDelete, onAddNew, onMassUpload }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredManuscripts = useMemo(() => manuscripts.filter(ms => 
        ms.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ms.author && ms.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ms.inventoryCode && ms.inventoryCode.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [manuscripts, searchQuery]);

    const paginatedManuscripts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredManuscripts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredManuscripts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredManuscripts.length / itemsPerPage);

    return (
        <Card 
            title={`Total Manuskrip: ${filteredManuscripts.length}`}
            actions={
                <>
                    <Button onClick={onMassUpload} variant="secondary"><FaUpload className="mr-2"/> Mass Upload</Button>
                    <Button onClick={onAddNew}><FaPlus className="mr-2"/> Tambah Baru</Button>
                </>
            }
        >
            <div className="mb-4">
                <Input type="text" placeholder="Cari berdasarkan Judul, Pengarang, Kode..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50"><tr className="border-b"><th className="p-3">Judul</th><th className="p-3 hidden sm:table-cell">Pengarang</th><th className="p-3 hidden md:table-cell">Kode</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedManuscripts.length > 0 ? paginatedManuscripts.map(ms => (
                            <tr key={ms.id} className="hover:bg-gray-50">
                                <td className="p-3 font-semibold">{ms.title}</td>
                                <td className="p-3 hidden sm:table-cell">{ms.author}</td>
                                <td className="p-3 hidden md:table-cell">{ms.inventoryCode}</td>
                                <td className="p-3 space-x-3 whitespace-nowrap">
                                    <button onClick={() => onEdit(ms)} className="text-blue-600 hover:underline"><FaPen/></button>
                                    <button onClick={() => onDelete(ms.id, ms.title)} className="text-red-600 hover:underline"><FaTrash/></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-500">Tidak ada manuskrip yang cocok.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <span className="text-sm text-gray-700">Halaman {currentPage} dari {totalPages}</span>
                    <div className="flex items-center space-x-2">
                        <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} variant="secondary">Sebelumnya</Button>
                        <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} variant="secondary">Selanjutnya</Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

const BlogView: React.FC<{
    articles: BlogArticle[];
    onEdit: (article: BlogArticle) => void;
    onDelete: (id: string, title: string) => void;
    onAddNew: () => void;
}> = ({ articles, onEdit, onDelete, onAddNew }) => {
    return (
         <Card 
            title={`Total Artikel: ${articles.length}`}
            actions={<Button onClick={onAddNew}><FaPlus className="mr-2"/> Tulis Baru</Button>}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50"><tr className="border-b"><th className="p-3">Judul</th><th className="p-3 hidden sm:table-cell">Penulis</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {articles.map(article => (
                             <tr key={article.id} className="hover:bg-gray-50">
                                <td className="p-3 font-semibold">{article.title}</td>
                                <td className="p-3 hidden sm:table-cell">{article.author}</td>
                                <td className="p-3 space-x-3 whitespace-nowrap">
                                    <button onClick={() => onEdit(article)} className="text-blue-600 hover:underline"><FaPen/></button>
                                    <button onClick={() => onDelete(article.id, article.title)} className="text-red-600 hover:underline"><FaTrash/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const GuestbookView: React.FC<{
    entries: GuestbookEntry[];
    onToggleApproval: (entry: GuestbookEntry) => void;
    onDelete: (id: string, name: string) => void;
}> = ({ entries, onToggleApproval, onDelete }) => {
     return (
        <Card title={`Moderasi Buku Tamu (${entries.length})`}>
             <div className="overflow-x-auto">
                 <table className="w-full text-left table-auto">
                     <thead className="bg-gray-50"><tr className="border-b"><th className="p-3">Nama & Asal</th><th className="p-3">Pesan</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
                     <tbody className="divide-y divide-gray-200">
                         {entries.map(entry => (
                             <tr key={entry.id} className="hover:bg-gray-50">
                                 <td className="p-3 align-top">
                                    <span className="font-semibold">{entry.name}</span>
                                    <br/>
                                    <span className="text-sm text-gray-500">{entry.origin}</span>
                                 </td>
                                 <td className="p-3 text-sm align-top">{entry.message}</td>
                                 <td className="p-3 align-top">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${entry.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {entry.is_approved ? 'Disetujui' : 'Menunggu'}
                                    </span>
                                </td>
                                 <td className="p-3 space-x-3 whitespace-nowrap align-top">
                                     <button onClick={() => onToggleApproval(entry)} className="text-blue-600 hover:underline text-sm font-medium">{entry.is_approved ? 'Batalkan' : 'Setujui'}</button>
                                     <button onClick={() => onDelete(entry.id, entry.name)} className="text-red-600 hover:underline text-sm font-medium">Hapus</button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </Card>
    );
}

// --- MAIN ADMIN PAGE COMPONENT ---
const AdminPage: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
    const [editingManuscript, setEditingManuscript] = useState<Manuscript | null>(null);
    
    const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([]);
    const [editingBlogArticle, setEditingBlogArticle] = useState<BlogArticle | null>(null);
    
    const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
    const [showMassUploadModal, setShowMassUploadModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [msRes, blogRes, guestbookRes] = await Promise.all([
            supabase.from('manuscripts').select('*').order('created_at', { ascending: false }),
            supabase.from('blog_articles').select('*').order('created_at', { ascending: false }),
            supabase.from('guestbook_entries').select('*').order('created_at', { ascending: false })
        ]);

        if (msRes.data) setManuscripts(msRes.data);
        if (blogRes.data) setBlogArticles(blogRes.data);
        if (guestbookRes.data) setGuestbookEntries(guestbookRes.data);
        
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = () => {
        fetchData();
        if (view === 'manuscript_form') setView('manuscripts');
        if (view === 'blog_form') setView('blog');
    };
    
    const handleCancel = () => {
        if (view === 'manuscript_form') setView('manuscripts');
        if (view === 'blog_form') setView('blog');
    };

    const handleDelete = async (table: string, id: string, name: string) => {
        if (window.confirm(`Yakin ingin menghapus "${name}"?`)) {
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

    const renderContent = () => {
        if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;

        switch(view) {
            case 'manuscripts':
                return <ManuscriptView manuscripts={manuscripts} onAddNew={() => { setEditingManuscript(null); setView('manuscript_form'); }} onEdit={(ms) => { setEditingManuscript(ms); setView('manuscript_form'); }} onDelete={(id, title) => handleDelete('manuscripts', id, title)} onMassUpload={() => setShowMassUploadModal(true)}/>
            case 'manuscript_form':
                return <ManuscriptForm manuscript={editingManuscript} onSave={handleSave} onCancel={handleCancel} />;
            case 'blog':
                return <BlogView articles={blogArticles} onAddNew={() => { setEditingBlogArticle(null); setView('blog_form'); }} onEdit={(article) => { setEditingBlogArticle(article); setView('blog_form');}} onDelete={(id, title) => handleDelete('blog_articles', id, title)} />
            case 'blog_form':
                return <BlogForm article={editingBlogArticle} onSave={handleSave} onCancel={handleCancel} />;
            case 'guestbook':
                return <GuestbookView entries={guestbookEntries} onToggleApproval={handleToggleGuestbookApproval} onDelete={(id, name) => handleDelete('guestbook_entries', id, name)} />;
            case 'dashboard':
            default:
                return <DashboardView data={{ manuscripts, blogArticles, guestbookEntries }} />;
        }
    };

    const viewTitles: Record<View, string> = {
        dashboard: 'Dashboard',
        manuscripts: 'Manajemen Manuskrip',
        manuscript_form: editingManuscript ? 'Edit Manuskrip' : 'Tambah Manuskrip',
        blog: 'Manajemen Blog',
        blog_form: editingBlogArticle ? 'Edit Artikel' : 'Tulis Artikel',
        guestbook: 'Moderasi Buku Tamu'
    };
    
    // ## INI BAGIAN YANG DIPERBAIKI ##
    const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>, targetView: View) => {
        e.preventDefault(); // Mencegah navigasi default
        setView(targetView);
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md z-20 fixed top-0 left-0 right-0">
                <nav className="main-header px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 mr-4 text-gray-600 hover:text-gray-900">
                            <FaBars size={20}/>
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="text-gray-600 hover:text-gray-900">
                        Logout
                    </button>
                </nav>
            </header>

            <div className="flex pt-16">
                <aside className={`main-sidebar bg-gray-800 text-white shadow-lg fixed inset-y-0 left-0 pt-16 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-10 w-64`}>
                    <div className="sidebar p-4">
                        <div className="user-panel mt-3 pb-3 mb-3 flex items-center border-b border-gray-700">
                            <FaUserCircle size={32} className="text-gray-400"/>
                            <div className="info ml-3">
                                <span className="block font-bold">Admin</span>
                            </div>
                        </div>
                        <nav className="mt-2">
                            <ul className="space-y-2">
                                <li><a href="#" onClick={(e) => handleMenuClick(e, 'dashboard')} className={`flex items-center gap-3 p-2 rounded-md ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><FaTachometerAlt/> <p>Dashboard</p></a></li>
                                <li><a href="#" onClick={(e) => handleMenuClick(e, 'manuscripts')} className={`flex items-center gap-3 p-2 rounded-md ${view.includes('manuscript') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><FaBook/> <p>Manuskrip</p></a></li>
                                <li><a href="#" onClick={(e) => handleMenuClick(e, 'blog')} className={`flex items-center gap-3 p-2 rounded-md ${view.includes('blog') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><FaNewspaper/> <p>Blog</p></a></li>
                                <li><a href="#" onClick={(e) => handleMenuClick(e, 'guestbook')} className={`flex items-center gap-3 p-2 rounded-md ${view.includes('guestbook') ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><FaComments/> <p>Buku Tamu</p></a></li>
                            </ul>
                        </nav>
                    </div>
                </aside>

                <main className={`content-wrapper p-4 sm:p-8 w-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                    <div className="content-header mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{viewTitles[view]}</h1>
                        <p className="text-gray-500">Selamat datang di panel admin.</p>
                    </div>
                    {renderContent()}
                </main>
            </div>
            
            <MassUploadModal 
                isOpen={showMassUploadModal}
                onClose={() => setShowMassUploadModal(false)}
                onSave={() => { fetchData(); }}
            />
        </div>
    );
};

export default AdminPage;