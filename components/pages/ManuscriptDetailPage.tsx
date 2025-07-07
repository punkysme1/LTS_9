import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Manuscript } from '../../types';
import { Spinner, Button } from '../UI';
import { getCreativeStoryStream } from '../../services/geminiService';
import { SparklesIcon } from '../Icons';
import { supabase } from '../../services/supabaseClient';

// Import library lightbox yang baru diinstal
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css"; // Jangan lupa import CSS-nya

// Helper untuk mengekstrak Folder ID dari URL Google Drive
const getFolderIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

// Komponen DetailItem & GeminiStoryteller tetap sama
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="border-b border-gray-200 py-3">
        <dt className="font-semibold text-brand-dark">{label}</dt>
        <dd className="mt-1 text-gray-700">{value || '-'}</dd>
    </div>
);

const GeminiStoryteller: React.FC<{ manuscript: Manuscript }> = ({ manuscript }) => {
    // ... (kode komponen ini tidak perlu diubah)
    const [story, setStory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateStory = async () => {
        setIsLoading(true);
        setError(null);
        setStory('');
        try {
            const stream = await getCreativeStoryStream(manuscript.title, manuscript.description);
            let fullStory = '';
            for await (const chunk of stream) {
                fullStory += chunk.text;
                setStory(fullStory);
            }
        } catch (e: any) {
            setError(e.message || "Gagal menghasilkan cerita. Pastikan API Key sudah diatur.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!import.meta.env.VITE_API_KEY) {
        return (
             <div className="mt-8 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
                 <p className="font-bold">Fitur AI Dinonaktifkan</p>
                 <p>API Key untuk Gemini tidak ditemukan. Fitur cerita AI tidak tersedia.</p>
             </div>
        );
    }

    return (
        <div className="mt-8 bg-brand-dark/5 p-6 rounded-lg">
            <h3 className="font-serif text-xl font-bold text-brand-dark flex items-center">
                <SparklesIcon className="w-6 h-6 mr-2 text-brand-accent" />
                Biarkan AI Bercerita
            </h3>
            <p className="mt-2 text-gray-600">Klik tombol di bawah untuk meminta AI membuat cerita pendek kreatif berdasarkan manuskrip ini.</p>
            <div className="mt-4">
                <Button onClick={handleGenerateStory} disabled={isLoading}>
                    {isLoading ? 'Menghasilkan...' : 'Buatkan Cerita'}
                </Button>
            </div>
            {isLoading && !story && <Spinner />}
            {error && <p className="mt-4 text-red-600">{error}</p>}
            {story && (
                <div className="mt-4 p-4 bg-white rounded-md shadow-inner">
                    <p className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">{story}</p>
                </div>
            )}
        </div>
    );
};

const ManuscriptDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [manuscript, setManuscript] = useState<Manuscript | null>(null);
    const [loading, setLoading] = useState(true);
    const [gdriveImages, setGdriveImages] = useState<{ id: string; url: string; thumbnail: string }[]>([]);
    const [imageLoading, setImageLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // --- State baru untuk Lightbox ---
    const [isLightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        const fetchManuscript = async () => {
            if (!id) return;
            setLoading(true);
            const { data, error } = await supabase.from('manuscripts').select('*').eq('id', id).single();

            if (error) {
                console.error("Error fetching manuscript", error);
                setManuscript(null);
            } else if (data) {
                const formattedData = {
                    ...data,
                    inventoryCode: data.inventory_code,
                    digitalCode: data.digital_code,
                    copyYear: data.copy_year,
                    pageCount: data.page_count,
                    thumbnailUrl: data.thumbnail_url,
                    imageUrls: [],
                    googleDriveUrl: data.google_drive_url,
                };
                setManuscript(formattedData);
            }
            setLoading(false);
        };
        fetchManuscript();
    }, [id]);

    useEffect(() => {
        if (manuscript?.googleDriveUrl) {
            const folderId = getFolderIdFromUrl(manuscript.googleDriveUrl);
            
            if (folderId) {
                const fetchGdriveImages = async () => {
                    setImageLoading(true);
                    setGdriveImages([]);
                    try {
                        const { data, error } = await supabase.functions.invoke('get-gdrive-images', { body: { folderId } });
                        if (error) throw error;
                        
                        if (data.images && data.images.length > 0) {
                            setGdriveImages(data.images);
                            setSelectedImage(data.images[0].url);
                        }
                    } catch (e: any) {
                        console.error("Error fetching Google Drive images:", e.message);
                    } finally {
                        setImageLoading(false);
                    }
                };
                fetchGdriveImages();
            }
        }
    }, [manuscript]);

    const handleImageClick = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    if (loading) return <Spinner />;
    if (!manuscript) return <div className="text-center py-16 text-xl">Manuskrip tidak ditemukan.</div>;
    
    const mainImageSrc = selectedImage || manuscript.thumbnailUrl;
    const currentImageIndex = gdriveImages.findIndex(img => img.url === selectedImage);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column: Image Gallery */}
                <div className="lg:col-span-2">
                    <div className="sticky top-24">
                       <div 
                           className="bg-white p-4 rounded-lg shadow-lg flex items-center justify-center min-h-[400px] cursor-pointer"
                           onClick={() => handleImageClick(currentImageIndex > -1 ? currentImageIndex : 0)}
                       >
                           {imageLoading ? <Spinner /> : mainImageSrc ? (
                               <img 
                                    src={mainImageSrc} 
                                    alt={`Halaman dari ${manuscript.title}`} 
                                    className="w-full h-auto object-contain rounded-md max-h-[70vh]"
                                />
                           ) : (
                               <p className="text-gray-500">Tidak ada pratinjau gambar.</p>
                           )}
                       </div>
                        {gdriveImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                {gdriveImages.map((image, index) => (
                                    <button 
                                        key={image.id} 
                                        onClick={() => {
                                            setSelectedImage(image.url); // Tetap update gambar utama
                                            handleImageClick(index);      // Buka lightbox di gambar yg diklik
                                        }} 
                                        className={`rounded-md overflow-hidden border-2 ${selectedImage === image.url ? 'border-brand-accent' : 'border-transparent'} hover:border-brand-accent transition`}
                                    >
                                        <img src={image.thumbnail} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">{manuscript.title}</h1>
                        <h2 className="text-xl text-gray-600 mt-1">{manuscript.author}</h2>
                        
                        <dl className="mt-6">
                            <DetailItem label="Deskripsi" value={<p className="whitespace-pre-wrap">{manuscript.description}</p>} />
                            <DetailItem label="Kode Inventarisasi" value={manuscript.inventoryCode} />
                            <DetailItem label="Kode Digital" value={manuscript.digitalCode} />
                            <DetailItem label="Status" value={<span className={`px-2 py-1 text-xs font-semibold rounded-full ${manuscript.status === 'Tersedia' ? 'bg-green-100 text-green-800' : manuscript.status === 'Rusak Sebagian' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{manuscript.status}</span>} />
                            <DetailItem label="Penyalin" value={manuscript.scribe} />
                            <DetailItem label="Tahun Penyalinan" value={manuscript.copyYear} />
                            <DetailItem label="Jumlah Halaman" value={`${manuscript.pageCount} halaman`} />
                            <DetailItem label="Tinta" value={manuscript.ink} />
                            <DetailItem label="Kategori" value={manuscript.category} />
                            <DetailItem label="Bahasa" value={manuscript.language} />
                            <DetailItem label="Aksara" value={manuscript.script} />
                            <DetailItem label="Ukuran" value={manuscript.size} />
                            <DetailItem label="Kondisi Naskah" value={<p className="whitespace-pre-wrap">{manuscript.condition}</p>} />
                            <DetailItem label="Keterbacaan" value={manuscript.readability} />
                            <DetailItem label="Kolofon" value={manuscript.colophon ? <p className="italic">"{manuscript.colophon}"</p> : 'Tidak ada'} />
                        </dl>
                    </div>

                    <GeminiStoryteller manuscript={manuscript} />
                </div>
            </div>

            {/* --- Komponen Lightbox diletakkan di sini --- */}
            <Lightbox
                open={isLightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={gdriveImages.map(img => ({ src: img.url }))}
                index={lightboxIndex}
                on={{
                    view: ({ index }) => setLightboxIndex(index), // Sinkronkan index lightbox
                }}
            />
        </div>
    );
};

export default ManuscriptDetailPage;