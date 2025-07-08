// ManuscriptDetailPage.tsx (Updated for Cloudinary)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Manuscript } from '../../types';
import { Spinner, Button } from '../UI';
import { getCreativeStoryStream } from '../../services/geminiService';
import { SparklesIcon } from '../Icons';
import { supabase } from '../../services/supabaseClient';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Komponen DetailItem & GeminiStoryteller tidak perlu diubah
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="border-b border-gray-200 py-3">
        <dt className="font-semibold text-brand-dark">{label}</dt>
        <dd className="mt-1 text-gray-700">{value || '-'}</dd>
    </div>
);

const GeminiStoryteller: React.FC<{ manuscript: Manuscript }> = ({ manuscript }) => {
    // ... (kode komponen ini tidak perlu diubah)
};

const ManuscriptDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [manuscript, setManuscript] = useState<Manuscript | null>(null);
    const [loading, setLoading] = useState(true);

    // State untuk lightbox
    const [isLightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [selectedImage, setSelectedImage] = useState<string>('');

    useEffect(() => {
        const fetchManuscript = async () => {
            if (!id) return;
            setLoading(true);
            const { data, error } = await supabase.from('manuscripts').select('*').eq('id', id).single();

            if (error) {
                console.error("Error fetching manuscript", error);
                setManuscript(null);
            } else if (data) {
                // Formatting data langsung dari database
                const formattedData: Manuscript = {
                    ...data,
                    inventoryCode: data.inventory_code,
                    digitalCode: data.digital_code,
                    copyYear: data.copy_year,
                    pageCount: data.page_count,
                    thumbnailUrl: data.thumbnail_url || (data.image_urls && data.image_urls[0]) || '',
                    imageUrls: data.image_urls || [], // Langsung gunakan array URL
                    googleDriveUrl: data.google_drive_url,
                };
                setManuscript(formattedData);
                // Set gambar utama saat data dimuat
                setSelectedImage(formattedData.thumbnailUrl || (formattedData.imageUrls.length > 0 ? formattedData.imageUrls[0] : ''));
            }
            setLoading(false);
        };
        fetchManuscript();
    }, [id]);

    const handleImageClick = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    if (loading) return <Spinner />;
    if (!manuscript) return <div className="text-center py-16 text-xl">Manuskrip tidak ditemukan.</div>;

    const images = manuscript.imageUrls;
    const currentImageIndex = images.findIndex(img => img === selectedImage);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Kolom Kiri: Galeri Gambar */}
                <div className="lg:col-span-2">
                    <div className="sticky top-24">
                       <div 
                           className="bg-white p-4 rounded-lg shadow-lg flex items-center justify-center min-h-[400px] cursor-pointer"
                           onClick={() => images.length > 0 && handleImageClick(currentImageIndex > -1 ? currentImageIndex : 0)}
                       >
                           {selectedImage ? (
                               <img 
                                    src={selectedImage} 
                                    alt={`Halaman dari ${manuscript.title}`} 
                                    className="w-full h-auto object-contain rounded-md max-h-[70vh]"
                                />
                           ) : (
                               <p className="text-gray-500">Tidak ada gambar untuk manuskrip ini.</p>
                           )}
                       </div>
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                {images.map((url, index) => (
                                    <button 
                                        key={index} 
                                        onClick={() => setSelectedImage(url)} 
                                        className={`rounded-md overflow-hidden border-2 ${selectedImage === url ? 'border-brand-accent' : 'border-transparent'} hover:border-brand-accent transition`}
                                    >
                                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-20 object-cover"/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Kolom Kanan: Detail Manuskrip */}
                <div className="lg:col-span-3">
                    {/* ... (Isi detail manuskrip tidak berubah, kode DetailItem, GeminiStoryteller, dll) ... */}
                </div>
            </div>

            {/* Komponen Lightbox */}
            <Lightbox
                open={isLightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={images.map(url => ({ src: url }))}
                index={lightboxIndex}
                on={{ view: ({ index }) => setLightboxIndex(index) }}
            />
        </div>
    );
};

export default ManuscriptDetailPage;