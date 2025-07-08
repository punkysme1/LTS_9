// AdminPage.tsx (Updated for Cloudinary)

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
  thumbnailUrl: '', imageUrls: [], googleDriveUrl: '' // googleDriveUrl tidak dipakai lagi, tapi kita biarkan di tipe data agar tidak error
};

const ManuscriptForm: React.FC<{ manuscript: Manuscript | null, onSave: () => void, onCancel: () => void }> = ({ manuscript, onSave, onCancel }) => {
    // Gabungkan imageUrls menjadi string untuk ditampilkan di textarea
    const [formData, setFormData] = useState<any>(manuscript ? { ...manuscript, imageUrls: manuscript.imageUrls?.join(',\n') || '' } : { ...emptyManuscript, imageUrls: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = (name === 'copyYear' || name === 'pageCount') && value !== '';
        setFormData({ ...formData, [name]: isNumber ? parseInt(value, 10) : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Ubah string URL yang dipisahkan koma menjadi array
        const imageUrlsArray = formData.imageUrls.split(/[\s,]+/).map((url:string) => url.trim()).filter(Boolean);

        const dbData = {
            title: formData.title, author: formData.author, inventory_code: formData.inventoryCode, digital_code: formData.digitalCode,
            status: formData.status, scribe: formData.scribe, copy_year: formData.copyYear, page_count: formData.pageCount,
            ink: formData.ink, category: formData.category, language: formData.language, script: formData.script, size: formData.size,
            description: formData.description, condition: formData.condition, readability: formData.readability, colophon: formData.colophon,
            thumbnail_url: formData.thumbnailUrl || imageUrlsArray[0] || '', // Gunakan gambar pertama sebagai thumbnail jika kosong
            image_urls: imageUrlsArray,
            google_drive_url: '' // Kosongkan
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
                    {/* ... Input lainnya tetap sama ... */}
                 </div>
                <Input name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} placeholder="URL Gambar Thumbnail (Opsional)" />
                <textarea
                    name="imageUrls"
                    value={formData.imageUrls}
                    onChange={handleChange}
                    placeholder="Tempel beberapa URL gambar dari Cloudinary, pisahkan dengan koma atau baris baru"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent"
                    rows={5}
                    required
                ></textarea>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Deskripsi" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" rows={3}></textarea>
                <textarea name="condition" value={formData.condition} onChange={handleChange} placeholder="Kondisi Naskah" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" rows={3}></textarea>
                <textarea name="colophon" value={formData.colophon} onChange={handleChange} placeholder="Kolofon" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent" rows={2}></textarea>
                
                <div className="flex space-x-4 pt-4">
                    <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Batal</Button>
                </div>
            </form>
        </div>
    );
};

// ... (Sisa komponen AdminPage.tsx seperti BlogForm, MassUploadModal, dll, bisa dibiarkan sama atau disesuaikan jika perlu)
// Untuk MassUploadModal, Anda perlu mengubah header dari `googleDriveUrl` menjadi `imageUrls`
// dan instruksikan pengguna untuk memisahkan URL dengan titik koma (;) di dalam sel CSV.

// --- (Sisa kode tidak ditampilkan untuk keringkasan, asumsikan tetap sama) ---