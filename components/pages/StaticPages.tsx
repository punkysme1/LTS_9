import React, { useState, useEffect } from 'react';
import { MOCK_TEAM } from '../../constants';
import { Button, Input, Spinner } from '../UI';
import { supabase } from '../../services/supabaseClient';
import type { BlogArticle, GuestbookEntry } from '../../types';

const PageHeader: React.FC<{title: string, subtitle: string}> = ({title, subtitle}) => (
    <div className="bg-brand-dark text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold">{title}</h1>
            <p className="mt-2 text-lg text-brand-light">{subtitle}</p>
        </div>
    </div>
);

export const BlogPage: React.FC = () => {
    const [articles, setArticles] = useState<BlogArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('blog_articles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching blog articles:", error);
            } else {
                 const formattedData = data.map((item: any) => ({
                    ...item,
                    imageUrl: item.image_url,
                    publishDate: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                }));
                setArticles(formattedData);
            }
            setLoading(false);
        }
        fetchArticles();
    }, []);

    return (
        <div>
            <PageHeader title="Blog" subtitle="Artikel dan wawasan dari tim kami dan para ahli." />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {loading ? <Spinner /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map(article => (
                            <div key={article.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                                <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover"/>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="font-serif text-xl font-bold text-brand-dark">{article.title}</h2>
                                    <p className="text-sm text-gray-500 mt-2">Oleh {article.author} - {article.publishDate}</p>
                                    <p className="mt-4 text-gray-700 flex-grow">{article.snippet}</p>
                                    <Button className="mt-4 self-start" variant="secondary">Baca Selengkapnya</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export const GuestbookPage: React.FC = () => {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [formState, setFormState] = useState({ name: '', origin: '', message: '' });
    const [formError, setFormError] = useState<string | null>(null);

    const fetchEntries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('guestbook_entries')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error fetching guestbook entries:", error);
        } else {
            setEntries(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        const { error } = await supabase
            .from('guestbook_entries')
            .insert([formState]);

        if (error) {
            setFormError("Gagal mengirim pesan. Silakan coba lagi.");
            console.error(error);
        } else {
            setSubmitted(true);
        }
    };

    return (
        <div>
            <PageHeader title="Buku Tamu" subtitle="Bagikan kesan dan pesan Anda tentang galeri kami." />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-6">Tinggalkan Pesan</h2>
                        {submitted ? (
                            <div className="text-center p-8 bg-green-100 text-green-800 rounded-md">
                                <h3 className="font-bold text-xl">Terima Kasih!</h3>
                                <p>Pesan Anda telah terkirim dan akan ditampilkan setelah dimoderasi.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama</label>
                                    <Input type="text" id="name" value={formState.name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700">Asal (Kota/Negara)</label>
                                    <Input type="text" id="origin" value={formState.origin} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Pesan/Kesan</label>
                                    <textarea id="message" rows={5} value={formState.message} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition"></textarea>
                                </div>
                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                                <Button type="submit">Kirim Pesan</Button>
                            </form>
                        )}
                    </div>
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-brand-dark mb-6">Pesan Terbaru</h2>
                        {loading ? <Spinner /> : (
                            <div className="space-y-6">
                                {entries.length > 0 ? entries.map(entry => (
                                    <div key={entry.id} className="bg-white p-6 rounded-lg shadow-md">
                                        <p className="text-gray-700 italic">"{entry.message}"</p>
                                        <p className="text-right mt-4 font-semibold text-brand-dark">- {entry.name}, <span className="font-normal text-gray-500">{entry.origin}</span></p>
                                    </div>
                                )) : <p className="text-gray-500">Belum ada pesan.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProfilePage: React.FC = () => (
    <div>
        <PageHeader title="Profil Galeri" subtitle="Mengenal lebih dekat visi, misi, dan tim di balik layar." />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="font-serif text-3xl font-bold text-brand-dark">Visi & Misi</h2>
                <p className="mt-4 text-lg text-gray-600">Menjadi pusat rujukan digital terkemuka untuk naskah-naskah Nusantara, menjembatani masa lalu dengan masa depan melalui teknologi dan kolaborasi untuk melestarikan dan menyebarluaskan warisan intelektual bangsa.</p>
            </div>
            
            <div>
                 <h2 className="font-serif text-3xl font-bold text-brand-dark text-center mb-12">Tim Kami</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {MOCK_TEAM.map(member => (
                        <div key={member.name} className="text-center">
                            <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto shadow-lg" />
                            <h3 className="mt-4 font-bold text-lg text-brand-dark">{member.name}</h3>
                            <p className="text-brand-accent">{member.role}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    </div>
);

export const ContactPage: React.FC = () => (
    <div>
        <PageHeader title="Hubungi Kami" subtitle="Kami senang mendengar dari Anda." />
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                     <h2 className="font-serif text-2xl font-bold text-brand-dark mb-6">Informasi Kontak</h2>
                     <div className="space-y-4 text-gray-700">
                        <p><strong>Alamat:</strong> Jl. Cendekia No. 1, Yogyakarta, Indonesia</p>
                        <p><strong>Email:</strong> info@galerisampurnan.org</p>
                        <p><strong>Telepon:</strong> +62 274 123 456</p>
                        <p><strong>Jam Operasional:</strong> Senin - Jumat, 09:00 - 16:00 WIB</p>
                     </div>
                      <div className="mt-8">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.172030138947!2d110.37586541527773!3d-7.771543979201534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a584f2850993d%3A0x27435f4961825155!2sUniversitas%20Gadjah%20Mada!5e0!3m2!1sen!2sid!4v1663214567890!5m2!1sen!2sid" 
                            width="100%" 
                            height="300" 
                            style={{border:0}} 
                            allowFullScreen={true}
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-md"
                        ></iframe>
                    </div>
                </div>
                 <div className="bg-white p-8 rounded-lg shadow-lg">
                     <h2 className="font-serif text-2xl font-bold text-brand-dark mb-6">Kirim Pertanyaan</h2>
                     <form className="space-y-4">
                        <Input type="text" placeholder="Nama Anda" required />
                        <Input type="email" placeholder="Email Anda" required />
                        <textarea placeholder="Pesan Anda" rows={6} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition"></textarea>
                        <Button type="submit">Kirim</Button>
                     </form>
                </div>
            </div>
        </div>
    </div>
);

export const DonationPage: React.FC = () => (
    <div>
        <PageHeader title="Dukung Kami" subtitle="Bantu kami melestarikan warisan tak ternilai ini." />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
                <h2 className="font-serif text-3xl font-bold text-brand-dark">Dukung Pelestarian Warisan Nusantara</h2>
                <p className="mt-4 text-gray-700 leading-relaxed">Donasi Anda sangat penting untuk mendukung biaya perawatan naskah, proses digitalisasi beresolusi tinggi, riset mendalam, dan operasional galeri digital ini. Setiap sumbangan, berapapun jumlahnya, akan memberikan dampak besar bagi upaya pelestarian kami.</p>
                
                <div className="mt-8 border-t pt-8">
                    <h3 className="font-serif text-2xl font-bold text-brand-dark">Transfer Bank</h3>
                    <div className="mt-4 text-left inline-block">
                        <p><strong>Bank:</strong> Bank Central Asia (BCA)</p>
                        <p><strong>Nomor Rekening:</strong> 1234 5678 90</p>
                        <p><strong>Atas Nama:</strong> Yayasan Galeri Sampurnan</p>
                    </div>
                </div>

                <div className="mt-8 border-t pt-8">
                    <h3 className="font-serif text-2xl font-bold text-brand-dark">Donasi via QRIS</h3>
                    <p className="mt-2 text-gray-600">Pindai kode QR di bawah ini dengan aplikasi e-wallet Anda.</p>
                    <div className="mt-4 flex justify-center">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DonasiUntukGaleriSampurnan" alt="QRIS Code for Donation" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);