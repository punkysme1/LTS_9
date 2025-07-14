import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient'
import type { Manuscript } from '../types';
import { Spinner } from '../components/UI';

const CategoryCounts: React.FC = () => {
    const [categories, setCategories] = useState<{ kategori_kailani: string; jumlah: number }[]>([]);
    
    useEffect(() => {
        const fetchCounts = async () => {
            const { data, error } = await supabase.rpc('get_kategori_kailani_counts');
            if (error) {
                console.error("Error fetching category counts:", error);
            } else if (data) {
                setCategories(data as any);
            }
        };
        fetchCounts();
    }, []);

    if (!categories.length) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold font-serif text-brand-dark mb-4 text-center">Kategori</h2>
            <div className="flex flex-wrap justify-center gap-3">
                {categories.map(cat => (
                    <div key={cat.kategori_kailani} className="bg-brand-light text-brand-dark px-3 py-1 rounded-full text-sm shadow-sm">
                        <span className="font-semibold">{cat.kategori_kailani}</span>
                        <span className="ml-2 bg-brand-accent text-white rounded-full px-2 py-0.5 text-xs font-bold">{cat.jumlah}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ManuscriptCard: React.FC<{ manuscript: Partial<Manuscript> }> = ({ manuscript }) => (
    <Link to={`/katalog/${manuscript.id}`} className="block group bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
        <div className="h-48 overflow-hidden bg-gray-200">
            <img 
                src={manuscript.link_kover || 'https://via.placeholder.com/400x300?text=Image+Not+Found'} 
                alt={manuscript.judul_dari_tim} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                loading="lazy"
            />
        </div>
        <div className="p-4">
            <h3 className="font-serif font-bold text-lg text-brand-dark truncate group-hover:text-brand-accent">{manuscript.judul_dari_tim}</h3>
            <p className="text-sm text-gray-600 truncate">{manuscript.pengarang || 'Pengarang tidak diketahui'}</p>
        </div>
    </Link>
);


const CatalogPage: React.FC = () => {
    const [manuscripts, setManuscripts] = useState<Partial<Manuscript>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchManuscripts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('manuscripts')
                .select('id, judul_dari_tim, pengarang, link_kover')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching manuscripts:", error);
            } else {
                setManuscripts(data || []);
            }
            setLoading(false);
        };
        fetchManuscripts();
    }, []);

    return (
        <div className="bg-brand-light min-h-screen">
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                     <h1 className="text-4xl font-bold font-serif text-brand-dark">Katalog Manuskrip</h1>
                     <p className="text-lg text-gray-600 mt-2">Jelajahi koleksi kekayaan intelektual kami</p>
                </div>

                <div className="mb-12">
                     <CategoryCounts />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Spinner /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {manuscripts.map(ms => (
                            <ManuscriptCard key={ms.id} manuscript={ms} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogPage;