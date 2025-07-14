import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Manuscript } from '../types';
import { Spinner } from '../UI';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const DetailRow: React.FC<{ label: string; value?: string | number | boolean | string[] | null; }> = ({ label, value }) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        return null;
    }

    let displayValue;
    if (typeof value === 'boolean') {
        displayValue = value ? 'Ya' : 'Tidak';
    } else if (Array.isArray(value)) {
        displayValue = (
            <ul className="list-disc list-inside space-y-1">
                {value.map((item, index) => (
                    <li key={index}>
                        <a href={item} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                            {item}
                        </a>
                    </li>
                ))}
            </ul>
        );
    } else if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'))) {
        displayValue = <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{value}</a>;
    } else {
        displayValue = <div className="whitespace-pre-wrap">{String(value)}</div>;
    }

    return (
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 px-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-600">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{displayValue}</dd>
        </div>
    );
};

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const childArray = React.Children.toArray(children).filter(Boolean);
    if (childArray.length === 0) {
        return null;
    }
    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-b">
                <h3 className="text-lg leading-6 font-semibold text-brand-dark">{title}</h3>
            </div>
            <div className="border-t border-gray-200">
                <dl className="sm:divide-y sm:divide-gray-200">{children}</dl>
            </div>
        </div>
    );
};


const ManuscriptDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [manuscript, setManuscript] = useState<Manuscript | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        const fetchManuscript = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const { data, error: dbError } = await supabase
                    .from('manuscripts')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (dbError) throw dbError;
                if (data) setManuscript(data as Manuscript);
            } catch (err: any) {
                setError(err.message);
                console.error("Error fetching manuscript", err);
            } finally {
                setLoading(false);
            }
        };

        fetchManuscript();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;
    if (!manuscript) return <div className="text-center py-10">Manuskrip tidak ditemukan.</div>;
    
    const galleryImages = manuscript.link_konten?.map(url => ({ src: url })) || [];

    return (
        <div className="bg-brand-light">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold font-serif text-brand-dark">{manuscript.judul_dari_tim}</h1>
                        {manuscript.judul_dari_afiliasi && <p className="text-lg text-gray-600 mt-2">"{manuscript.judul_dari_afiliasi}"</p>}
                    </div>
                    
                    {manuscript.link_kover && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-semibold font-serif text-brand-dark mb-4 border-b pb-2">Kover</h2>
                            <img 
                                src={manuscript.link_kover} 
                                alt={`Kover ${manuscript.judul_dari_tim}`} 
                                className="w-full h-auto max-h-[600px] object-contain rounded-lg shadow-lg bg-gray-100 p-2" 
                            />
                        </div>
                    )}

                    <DetailSection title="Deskripsi Umum">
                        <DetailRow label="Deskripsi" value={manuscript.deskripsi_umum} />
                    </DetailSection>

                    <DetailSection title="Identitas & Afiliasi">
                        <DetailRow label="Judul Dari Tim" value={manuscript.judul_dari_tim} />
                        <DetailRow label="Judul Dari Afiliasi" value={manuscript.judul_dari_afiliasi} />
                        <DetailRow label="Afiliasi" value={manuscript.afiliasi} />
                        <DetailRow label="Link Digital Afiliasi" value={manuscript.link_digital_afiliasi} />
                        <DetailRow label="Nama Koleksi" value={manuscript.nama_koleksi} />
                        <DetailRow label="Nomor Koleksi" value={manuscript.nomor_koleksi} />
                        <DetailRow label="Nomor Digitalisasi" value={manuscript.nomor_digitalisasi} />
                        <DetailRow label="Kode Inventarisasi" value={manuscript.kode_inventarisasi} />
                        <DetailRow label="Link Digital TPPKP" value={manuscript.link_digital_tppkp} />
                    </DetailSection>

                    <DetailSection title="Klasifikasi & Kepengarangan">
                        <DetailRow label="Klasifikasi (Kailani)" value={manuscript.kategori_kailani} />
                        <DetailRow label="Kategori Ilmu Pesantren" value={manuscript.kategori_ilmu_pesantren} />
                        <DetailRow label="Pengarang" value={manuscript.pengarang} />
                        <DetailRow label="Penyalin" value={manuscript.penyalin} />
                        <DetailRow label="Tahun Penulisan (Teks)" value={manuscript.tahun_penulisan_teks} />
                        <DetailRow label="Konversi Masehi" value={manuscript.konversi_masehi} />
                        <DetailRow label="Lokasi Penyalinan" value={manuscript.lokasi_penyalinan} />
                        <DetailRow label="Asal Usul Naskah" value={manuscript.asal_usul_naskah} />
                        <DetailRow label="Bahasa" value={manuscript.bahasa} />
                        <DetailRow label="Aksara" value={manuscript.aksara} />
                    </DetailSection>

                    <DetailSection title="Data Fisik Naskah">
                        <DetailRow label="Kover" value={manuscript.kover} />
                        <DetailRow label="Jilid" value={manuscript.jilid} />
                        <DetailRow label="Ukuran Kover" value={manuscript.ukuran_kover} />
                        <DetailRow label="Ukuran Kertas" value={manuscript.ukuran_kertas} />
                        <DetailRow label="Ukuran Dimensi" value={manuscript.ukuran_dimensi} />
                        <DetailRow label="Watermark" value={manuscript.watermark} />
                        <DetailRow label="Countermark" value={manuscript.countermark} />
                        <DetailRow label="Tinta" value={manuscript.tinta} />
                        <DetailRow label="Jumlah Halaman" value={manuscript.jumlah_halaman} />
                        <DetailRow label="Halaman Kosong" value={manuscript.halaman_kosong} />
                        <DetailRow label="Jumlah Baris Per Halaman" value={manuscript.jumlah_baris_per_halaman} />
                        <DetailRow label="Halaman Pemisah" value={manuscript.halaman_pemisah} />
                    </DetailSection>
                    
                    <DetailSection title="Seni, Tanda & Catatan">
                        <DetailRow label="Rubrikasi" value={manuscript.rubrikasi} />
                        <DetailRow label="Iluminasi" value={manuscript.iluminasi} />
                        <DetailRow label="Ilustrasi" value={manuscript.ilustrasi} />
                        <DetailRow label="Catatan Pinggir" value={manuscript.catatan_pinggir} />
                        <DetailRow label="Catatan Makna" value={manuscript.catatan_makna} />
                        <DetailRow label="Catatan Marginal" value={manuscript.catatan_marginal} />
                    </DetailSection>
                    
                    <DetailSection title="Kondisi & Kelengkapan">
                        <DetailRow label="Kondisi Fisik" value={manuscript.kondisi_fisik_naskah} />
                        <DetailRow label="Keterbacaan" value={manuscript.keterbacaan} />
                        <DetailRow label="Kelengkapan Naskah" value={manuscript.kelengkapan_naskah} />
                        <DetailRow label="Kolofon" value={manuscript.kolofon} />
                        <DetailRow label="Catatan Lainnya" value={manuscript.catatan_catatan} />
                    </DetailSection>

                    {galleryImages.length > 0 && (
                         <DetailSection title="Galeri Konten Digital">
                            <div className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {manuscript.link_konten?.map((url, index) => (
                                    <button key={index} onClick={() => setLightboxOpen(true)} className="block focus:outline-none focus:ring-2 focus:ring-brand-accent rounded-md">
                                        <img 
                                            src={url} 
                                            alt={`Pratinjau ${index + 1}`} 
                                            className="w-full h-48 object-cover rounded-md shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                        />
                                    </button>
                                ))}
                            </div>
                        </DetailSection>
                    )}
                </div>

                <Lightbox
                    open={isLightboxOpen}
                    close={() => setLightboxOpen(false)}
                    slides={galleryImages}
                />
            </div>
        </div>
    );
};

export default ManuscriptDetailPage;