import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Manuscript, BlogArticle, GuestbookEntry } from '../types';
import { supabase } from '../../services/supabaseClient';
import * as XLSX from 'xlsx';
import {
    FaTachometerAlt, FaBook, FaNewspaper, FaComments, FaUserCircle,
    FaBars, FaPlus, FaUpload, FaDownload, FaPen, FaTrash
} from 'react-icons/fa';
// Pastikan ini mengimpor komponen yang sudah di-memoize dari UI.tsx
import { Button, Input, Select, Spinner } from '../UI';

// --- TYPE DEFINITIONS ---
type ManuscriptFormData = Omit<Manuscript, 'id' | 'created_at'>;
type BlogArticleFormData = Omit<BlogArticle, 'id' | 'created_at' | 'publishDate' | 'snippet'>;
type View = 'dashboard' | 'manuscripts' | 'manuscript_form' | 'blog' | 'blog_form' | 'guestbook';

// --- CONSTANTS & DEFAULTS ---
const KATEGORI_KAILANI_OPTIONS = ['Keilmuan Islam Umum', 'Alquran dan Ilmu yang Berkaitan', 'Akaid dan Ilmu Kalam', 'Fiqih', 'Akhlaq dan Tasawwuf', 'Sosial dan Budaya', 'Filsafat dan Perkembangannya', 'Aliran dan Sekte dalam Islam', 'Hadits dan Ilmu yang berkaitan', 'Sejarah Islam dan Bibliografi'];

const emptyManuscript: ManuscriptFormData = {
  judul_dari_tim: '',
  afiliasi: '', link_digital_afiliasi: '', nama_koleksi: '', nomor_digitalisasi: '', kode_inventarisasi: '',
  link_kover: '', link_konten: [], link_digital_tppkp: '', nomor_koleksi: '', judul_dari_afiliasi: '',
  halaman_pemisah: '', kategori_kailani: 'Keilmuan Islam Umum', kategori_ilmu_pesantren: '',
  pengarang: '', penyalin: '', tahun_penulisan_teks: '', konversi_masehi: undefined, lokasi_penyalinan: '', asal_usul_naskah: '',
  bahasa: '', aksara: '',
  watermark: '', countermark: '', kover: '', ukuran_kover: '', jilid: '', ukuran_kertas: '', ukuran_dimensi: '',
  jumlah_halaman: undefined, halaman_kosong: '', jumlah_baris_per_halaman: '', catatan_pinggir: false, catatan_makna: false,
  rubrikasi: false, iluminasi: false, ilustrasi: false, tinta: '',
  kondisi_fisik_naskah: '', keterbacaan: '', kelengkapan_naskah: '', kolofon: '', catatan_marginal: '', deskripsi_umum: '', catatan_catatan: ''
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
        <div className="card-body p-4 sm:p-6">{children}</div>
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
    const [formData, setFormData] = useState<ManuscriptFormData>(() => {
        if (!manuscript) return emptyManuscript;
        const { id, created_at, ...rest } = manuscript;
        return {
            ...emptyManuscript,
            ...rest,
            // Pastikan link_konten adalah string untuk textarea
            link_konten: Array.isArray(rest.link_konten) ? rest.link_konten.join('\n') : '',
            // Pastikan nilai numerik diinisialisasi sebagai number atau undefined
            konversi_masehi: rest.konversi_masehi ?? undefined,
            jumlah_halaman: rest.jumlah_halaman ?? undefined,
        };
    });
    const [loading, setLoading] = useState(false);

    // Menggunakan useCallback untuk handleChange untuk menghindari re-render Input
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => {
            if (type === 'checkbox') {
                const { checked } = e.target as HTMLInputElement;
                return { ...prev, [name]: checked };
            } else if (['konversi_masehi', 'jumlah_halaman'].includes(name)) {
                // Untuk input numerik, simpan sebagai number atau undefined jika kosong
                const numericValue = value === '' ? undefined : parseInt(value, 10);
                return { ...prev, [name]: numericValue };
            } else {
                // Untuk input teks, simpan sebagai string
                return { ...prev, [name]: value };
            }
        });
    }, []); // Dependensi kosong karena tidak bergantung pada props atau state lain

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.judul_dari_tim) {
            alert("Judul Dari Tim wajib diisi.");
            return;
        }
        setLoading(true);

        const linkKontenArray = typeof formData.link_konten === 'string'
            ? formData.link_konten.split(/[\n,]+/).map(url => url.trim()).filter(Boolean)
            : [];

        // Siapkan data untuk Supabase, pastikan undefined numbers menjadi null
        const dbData = {
            ...formData,
            link_konten: linkKontenArray,
            konversi_masehi: formData.konversi_masehi ?? null, // Konversi undefined ke null untuk DB
            jumlah_halaman: formData.jumlah_halaman ?? null // Konversi undefined ke null untuk DB
        };

        const { error } = manuscript
            ? await supabase.from('manuscripts').update(dbData).eq('id', manuscript.id)
            : await supabase.from('manuscripts').insert([dbData]);

        if (error) {
            alert('Error: ' + error.message);
            console.error('Supabase Error:', error); // Log error untuk debugging
        } else {
            alert(`Manuskrip "${formData.judul_dari_tim}" berhasil disimpan.`);
            onSave();
        }
        setLoading(false);
    };

    const renderField = (name: keyof ManuscriptFormData, label: string, type: 'input' | 'textarea' | 'select' | 'checkbox' = 'input', options: string[] = []) => {
        // Pastikan nilai yang ditampilkan di input selalu string, bahkan untuk angka
        const displayValue = (formData[name] ?? '').toString(); // Konversi ke string

        // Tambahkan prop `type` untuk input numerik
        const inputType = ['konversi_masehi', 'jumlah_halaman'].includes(name) ? 'number' : 'text';

        const commonProps = { name, onChange: handleChange, id: name };

        if (type === 'checkbox') {
            return (
                <div className="flex items-center gap-2 col-span-1 pt-2">
                    <input type="checkbox" {...commonProps} checked={!!formData[name]} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</label>
                </div>
            );
        }

        return (
             <div className="col-span-1">
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                {type === 'input' && <Input {...commonProps} type={inputType} value={displayValue} placeholder={label} />}
                {type === 'textarea' && <textarea {...commonProps} value={displayValue} placeholder={label} rows={3} className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>}
                {type === 'select' && (
                    <Select {...commonProps} value={displayValue}>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                )}
            </div>
        );
    };

    const FormSection: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-brand-dark">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection title="Identitas & Afiliasi">{renderField('judul_dari_tim', 'Judul Dari Tim (Wajib)')}{renderField('judul_dari_afiliasi', 'Judul Dari Afiliasi')}{renderField('afiliasi', 'Afiliasi')}{renderField('link_digital_afiliasi', 'Link Digital Afiliasi')}{renderField('nama_koleksi', 'Nama Koleksi')}{renderField('nomor_koleksi', 'Nomor Koleksi')}{renderField('nomor_digitalisasi', 'Nomor Digitalisasi')}{renderField('kode_inventarisasi', 'Kode Inventarisasi')}{renderField('link_digital_tppkp', 'Link Digital TPPKP Qomaruddin')}</FormSection>
            <FormSection title="Link Gambar">{renderField('link_kover', 'Link Kover (Thumbnail)')}{renderField('link_konten', 'Link Konten (URL per baris)', 'textarea')}</FormSection>
            <FormSection title="Klasifikasi & Kepengarangan">{renderField('kategori_kailani', 'Klasifikasi (Kailani)', 'select', KATEGORI_KAILANI_OPTIONS)}{renderField('kategori_ilmu_pesantren', 'Kategori Ilmu Pesantren')}{renderField('pengarang', 'Pengarang')}{renderField('penyalin', 'Penyalin')}{renderField('tahun_penulisan_teks', 'Tahun Penulisan di Teks')}{renderField('konversi_masehi', 'Konversi Masehi', 'input')}{renderField('lokasi_penyalinan', 'Lokasi Penyalinan')}{renderField('asal_usul_naskah', 'Asal Usul Naskah')}{renderField('bahasa', 'Bahasa')}{renderField('aksara', 'Aksara')}</FormSection>
            <FormSection title="Data Fisik Naskah">{renderField('kover', 'Kover')}{renderField('jilid', 'Jilid')}{renderField('ukuran_kover', 'Ukuran Kover')}{renderField('ukuran_kertas', 'Ukuran Kertas')}{renderField('ukuran_dimensi', 'Ukuran Dimensi')}{renderField('watermark', 'Watermark')}{renderField('countermark', 'Countermark')}{renderField('tinta', 'Tinta')}{renderField('jumlah_halaman', 'Jumlah Halaman', 'input')}{renderField('halaman_kosong', 'Halaman Kosong')}{renderField('jumlah_baris_per_halaman', 'Jumlah Baris Per Halaman')}{renderField('halaman_pemisah', 'Halaman Pemisah')}</FormSection>
            <FormSection title="Seni & Rubrikasi">{renderField('rubrikasi', 'Rubrikasi', 'checkbox')}{renderField('iluminasi', 'Iluminasi', 'checkbox')}{renderField('ilustrasi', 'Ilustrasi', 'checkbox')}</FormSection>
            <FormSection title="Catatan Teks & Kondisi">{renderField('catatan_pinggir', 'Catatan Pinggir', 'checkbox')}{renderField('catatan_makna', 'Catatan Makna', 'checkbox')}{renderField('catatan_marginal', 'Catatan Marginal (Koreksi, Komentar)', 'textarea')}{renderField('kondisi_fisik_naskah', 'Kondisi Fisik Naskah', 'textarea')}{renderField('keterbacaan', 'Keterbacaan')}{renderField('kelengkapan_naskah', 'Kelengkapan Naskah')}{renderField('kolofon', 'Kolofon', 'textarea')}</FormSection>
            <FormSection title="Deskripsi & Catatan Umum">{renderField('deskripsi_umum', 'Deskripsi Umum', 'textarea')}{renderField('catatan_catatan', 'Catatan-catatan', 'textarea')}</FormSection>
            <div className="flex space-x-4 pt-6 mt-8 border-t"><Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan Manuskrip"}</Button><Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Batal</Button></div>
        </form>
    );
};

const BlogForm: React.FC<{ article: BlogArticle | null, onSave: () => void, onCancel: () => void }> = ({ article, onSave, onCancel }) => {
    const [formData, setFormData] = useState<BlogArticleFormData>(article ? { ...article } : emptyBlogArticle);
    const [loading, setLoading] = useState(false);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Perbaikan: Gunakan format ISO 8601 untuk publish_date
        // Perbaikan: Gunakan 'imageUrl' agar sesuai dengan nama kolom di database Anda
        const dbData = {
            title: formData.title,
            author: formData.author,
            content: formData.content,
            imageUrl: formData.imageUrl, // Diubah dari 'image_url' menjadi 'imageUrl'
            snippet: formData.content.substring(0, 150) + '...',
            publish_date: new Date().toISOString(), // Menggunakan ISO string untuk kompatibilitas DB
        };

        const { error } = article
            ? await supabase.from('blog_articles').update(dbData).eq('id', article.id)
            : await supabase.from('blog_articles').insert([dbData]);

        if (error) {
            // Tampilkan pesan error yang lebih detail dari Supabase
            alert('Error saving article: ' + error.message + (error.details ? '\nDetails: ' + error.details : ''));
            console.error('Supabase Error:', error); // Log error ke konsol untuk debugging lebih lanjut
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
                <div className="flex space-x-4 pt-4 border-t mt-4"><Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Artikel'}</Button><Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Batal</Button></div>
            </form>
        </Card>
    );
};

const MassUploadModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: () => void }> = ({ isOpen, onClose, onSave }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const headers = Object.keys(emptyManuscript);
    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "template_manuskrip_lengkap.xlsx");
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setFile(e.target.files[0]); setError(null); setSuccess(null); } };
    const handleUpload = () => {
        if (!file) return setError("Silakan pilih file untuk diunggah.");
        setLoading(true); setError(null); setSuccess(null);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const json_data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                if (json_data.length === 0) throw new Error("File Excel kosong atau formatnya salah.");
                const dbData = json_data.map(row => {
                    const newRow: { [key: string]: any } = {};
                    for (const key of headers) {
                        if (row[key] !== undefined && row[key] !== null) {
                             if (key === 'link_konten' && typeof row[key] === 'string') { newRow[key] = row[key].split(';').map((s: string) => s.trim()).filter(Boolean); } else if (['catatan_pinggir', 'catatan_makna', 'rubrikasi', 'iluminasi', 'ilustrasi'].includes(key)) { newRow[key] = Boolean(row[key]); } else { newRow[key] = row[key]; }
                        }
                    }
                    return newRow;
                });
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
                        <li key={ms.id} className="py-2 truncate">{ms.judul_dari_tim}</li>
                    ))}
                </ul>
            </Card>
            <Card title="Artikel Blog Terbaru">
                 <ul className="divide-y divide-gray-200">
                    {data.blogArticles.slice(0, 5).map((article) => (
                        <li key={article.id} className="py-2 truncate">{article.title}</li>
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
        ms.judul_dari_tim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ms.pengarang && ms.pengarang.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ms.kode_inventarisasi && ms.kode_inventarisasi.toLowerCase().includes(searchQuery.toLowerCase()))
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
                    <thead className="bg-gray-50"><tr className="border-b"><th className="p-3">Judul</th><th className="p-3 hidden sm:table-cell">Pengarang</th><th className="p-3 hidden md:table-cell">Kode Inventarisasi</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedManuscripts.length > 0 ? paginatedManuscripts.map(ms => (
                            <tr key={ms.id} className="hover:bg-gray-50">
                                <td className="p-3 font-semibold">{ms.judul_dari_tim}</td>
                                <td className="p-3 hidden sm:table-cell">{ms.pengarang}</td>
                                <td className="p-3 hidden md:table-cell">{ms.kode_inventarisasi}</td>
                                <td className="p-3 space-x-3 whitespace-nowrap">
                                    <button onClick={() => onEdit(ms)} className="text-blue-600 hover:underline"><FaPen/></button>
                                    <button onClick={() => onDelete(ms.id, ms.judul_dari_tim)} className="text-red-600 hover:underline"><FaTrash/></button>
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
};

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
        if (msRes.data) setManuscripts(msRes.data as Manuscript[]);
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
            else { alert(`"${name}" berhasil dihapus.`); fetchData(); }
        }
    };

    const handleToggleGuestbookApproval = async (entry: GuestbookEntry) => {
        const { error } = await supabase.from('guestbook_entries').update({ is_approved: !entry.is_approved }).eq('id', entry.id);
        if(error) alert('Gagal mengubah status: ' + error.message);
        else fetchData();
    };

    const renderContent = () => {
        if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;

        switch(view) {
            case 'manuscripts':
                return <ManuscriptView manuscripts={manuscripts} onAddNew={() => { setEditingManuscript(null); setView('manuskrip_form'); }} onEdit={(ms) => { setEditingManuscript(ms); setView('manuskrip_form'); }} onDelete={(id, title) => handleDelete('manuscripts', id, title)} onMassUpload={() => setShowMassUploadModal(true)}/>;

            case 'manuscript_form':
                // Pastikan TIDAK ADA prop 'key' di sini, agar komponen tidak di-unmount/remount
                return <ManuscriptForm manuscript={editingManuscript} onSave={handleSave} onCancel={handleCancel} />;

            case 'blog':
                return <BlogView articles={blogArticles} onAddNew={() => { setEditingBlogArticle(null); setView('blog_form'); }} onEdit={(article) => { setEditingBlogArticle(article); setView('blog_form');}} onDelete={(id, title) => handleDelete('blog_articles', id, title)} />;

            case 'blog_form':
                // Pastikan TIDAK ADA prop 'key' di sini, agar komponen tidak di-unmount/remount
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

    const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>, targetView: View) => {
        e.preventDefault();
        setView(targetView);
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md z-20 fixed top-0 left-0 right-0">
                <nav className="main-header px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 mr-4 text-gray-600 hover:text-gray-900"><FaBars size={20}/></button>
                        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="text-gray-600 hover:text-gray-900">Logout</button>
                </nav>
            </header>
            <div className="flex pt-16">
                <aside className={`main-sidebar bg-gray-800 text-white shadow-lg fixed inset-y-0 left-0 pt-16 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-10 w-64`}>
                    <div className="sidebar p-4">
                        <div className="user-panel mt-3 pb-3 mb-3 flex items-center border-b border-gray-700">
                            <FaUserCircle size={32} className="text-gray-400"/><div className="info ml-3"><span className="block font-bold">Admin</span></div>
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
            <MassUploadModal isOpen={showMassUploadModal} onClose={() => setShowMassUploadModal(false)} onSave={() => { fetchData(); }}/>
        </div>
    );
};

export default AdminPage;