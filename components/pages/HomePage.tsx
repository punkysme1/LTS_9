import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ManuscriptCard, Button, Spinner } from '../UI';
import { supabase } from '../../services/supabaseClient';
import type { Manuscript, BlogArticle, GuestbookEntry } from '../../types';

const HeroSection: React.FC = () => (
    <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: "url('https://picsum.photos/seed/hero/1600/900')" }}>
        <div className="absolute inset-0 bg-brand-dark bg-opacity-60"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center text-white">
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight">Galeri Manuskrip Sampurnan</h1>
            <p className="mt-4 text-lg md:text-xl max-w-3xl">Menjaga Warisan, Membuka Jendela Pengetahuan Masa Lalu.</p>
            <div className="mt-8">
                <NavLink to="/katalog">
                    <Button>Jelajahi Katalog</Button>
                </NavLink>
            </div>
        </div>
    </div>
);

const Section: React.FC<{title: string, subtitle?: string, children: React.ReactNode, className?: string}> = ({title, subtitle, children, className}) => (
    <section className={`py-12 md:py-20 ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">{title}</h2>
                {subtitle && <p className="mt-2 text-lg text-gray-600">{subtitle}</p>}
            </div>
            {children}
        </div>
    </section>
);


const HomePage: React.FC = () => {
    const [latestManuscripts, setLatestManuscripts] = useState<Manuscript[]>([]);
    const [latestBlogArticles, setLatestBlogArticles] = useState<BlogArticle[]>([]);
    const [guestbookQuotes, setGuestbookQuotes] = useState<GuestbookEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [manuscriptsRes, blogRes, guestbookRes] = await Promise.all([
                    supabase.from('manuscripts').select('*').order('created_at', { ascending: false }).limit(4),
                    supabase.from('blog_articles').select('*').order('created_at', { ascending: false }).limit(3),
                    supabase.from('guestbook_entries').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(2)
                ]);

                if (manuscriptsRes.error) throw manuscriptsRes.error;
                if (blogRes.error) throw blogRes.error;
                if (guestbookRes.error) throw guestbookRes.error;
                
                setLatestManuscripts(manuscriptsRes.data.map((item: any) => ({ ...item, inventoryCode: item.inventory_code, thumbnailUrl: item.thumbnail_url })) || []);
                setLatestBlogArticles(blogRes.data.map((item: any) => ({ ...item, imageUrl: item.image_url, publishDate: new Date(item.created_at).toLocaleDateString() })) || []);
                setGuestbookQuotes(guestbookRes.data || []);

            } catch (error) {
                console.error("Error fetching homepage data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            <HeroSection />
            
            <Section title="Manuskrip Terbaru" subtitle="Koleksi yang baru kami tambahkan">
                 {loading ? <Spinner/> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {latestManuscripts.map(ms => <ManuscriptCard key={ms.id} manuscript={ms} />)}
                    </div>
                )}
                <div className="text-center mt-12">
                     <NavLink to="/katalog"><Button variant="secondary">Lihat Semua Katalog</Button></NavLink>
                </div>
            </Section>

            <Section title="Tentang Kami" className="bg-white">
                 <div className="max-w-3xl mx-auto text-center text-gray-700 leading-relaxed">
                    <p>Galeri Manuskrip Sampurnan adalah sebuah inisiatif digital untuk melestarikan, mendokumentasikan, dan membagikan kekayaan warisan tertulis Nusantara. Misi kami adalah membuat naskah-naskah kuno dapat diakses oleh para peneliti, akademisi, dan masyarakat luas untuk membuka jendela pengetahuan masa lalu.</p>
                     <div className="mt-8">
                        <NavLink to="/profil"><Button>Pelajari Lebih Lanjut</Button></NavLink>
                    </div>
                </div>
            </Section>

            <Section title="Kabar Terkini" subtitle="Wawasan dari para peneliti kami">
                {loading ? <Spinner /> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {latestBlogArticles.map(article => (
                            <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                 <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover"/>
                                 <div className="p-6">
                                    <h3 className="font-serif text-xl font-bold text-brand-dark">{article.title}</h3>
                                    <p className="text-sm text-gray-500 mt-2">{article.publishDate}</p>
                                    <p className="mt-4 text-gray-700">{article.snippet}</p>
                                    <NavLink to={`/blog`} className="text-brand-accent hover:text-brand-accent-dark font-semibold mt-4 inline-block">Baca Selengkapnya &rarr;</NavLink>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="text-center mt-12">
                    <NavLink to="/blog"><Button variant="secondary">Baca Blog Selengkapnya</Button></NavLink>
                </div>
            </Section>

            <Section title="Pesan dari Pengunjung" className="bg-brand-dark text-white">
                 {loading ? <Spinner /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {guestbookQuotes.map(entry => (
                            <blockquote key={entry.id} className="bg-white/10 p-6 rounded-lg">
                                <p className="font-serif italic text-lg">"{entry.message}"</p>
                                <footer className="mt-4 font-semibold">{entry.name}, <span className="font-normal text-gray-300">{entry.origin}</span></footer>
                            </blockquote>
                        ))}
                    </div>
                 )}
            </Section>

            <Section title="Dukung Misi Kami">
                <div className="text-center max-w-3xl mx-auto">
                    <p className="text-lg text-gray-700">Setiap kontribusi Anda sangat berarti untuk perawatan, digitalisasi, dan riset naskah-naskah berharga ini. Bergabunglah dengan kami dalam melestarikan warisan Nusantara.</p>
                    <div className="mt-8">
                        <NavLink to="/donasi"><Button>Berdonasi Sekarang</Button></NavLink>
                    </div>
                </div>
            </Section>

        </div>
    );
};

export default HomePage;