import React, { useState, useEffect, useMemo } from 'react';
import { ManuscriptCard, Input, Select, Button, Spinner } from '../UI';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import type { Manuscript } from '../../types';
import { supabase } from '../../services/supabaseClient';

const ITEMS_PER_PAGE = 8;

const CatalogPage: React.FC = () => {
    const [allManuscripts, setAllManuscripts] = useState<Manuscript[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
        language: 'All',
    });
    const [currentPage, setCurrentPage] = useState(1);
    
    useEffect(() => {
        const fetchManuscripts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('manuscripts')
                .select('*')
                .order('title', { ascending: true });
            
            if (error) {
                console.error("Error fetching manuscripts", error);
            } else {
                const formattedData = data.map((item: any) => ({
                    ...item,
                    inventoryCode: item.inventory_code,
                    digitalCode: item.digital_code,
                    copyYear: item.copy_year,
                    pageCount: item.page_count,
                    thumbnailUrl: item.thumbnail_url,
                    imageUrls: item.image_urls,
                    googleDriveUrl: item.google_drive_url,
                }));
                setAllManuscripts(formattedData);
            }
            setLoading(false);
        };
        fetchManuscripts();
    }, []);

    const uniqueCategories = ['All', ...Array.from(new Set(allManuscripts.map(m => m.category)))];
    const uniqueLanguages = ['All', ...Array.from(new Set(allManuscripts.map(m => m.language)))];

    const filteredManuscripts = useMemo(() => {
        return allManuscripts
            .filter(ms => {
                const searchLower = searchQuery.toLowerCase();
                return ms.title.toLowerCase().includes(searchLower) ||
                       (ms.author && ms.author.toLowerCase().includes(searchLower)) ||
                       (ms.inventoryCode && ms.inventoryCode.toLowerCase().includes(searchLower));
            })
            .filter(ms => filters.category === 'All' || ms.category === filters.category)
            .filter(ms => filters.language === 'All' || ms.language === filters.language);
    }, [searchQuery, filters, allManuscripts]);

    const totalPages = Math.ceil(filteredManuscripts.length / ITEMS_PER_PAGE);
    const paginatedManuscripts = filteredManuscripts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-dark">Katalog Manuskrip</h1>
                <p className="mt-2 text-lg text-gray-600">Jelajahi koleksi naskah kuno kami yang berharga.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 sticky top-20 z-30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative lg:col-span-1">
                        <Input 
                            type="text" 
                            placeholder="Cari berdasarkan Judul, Pengarang..." 
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="pl-10"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                     <Select name="category" value={filters.category} onChange={handleFilterChange}>
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'Semua Kategori' : cat}</option>)}
                    </Select>
                    <Select name="language" value={filters.language} onChange={handleFilterChange}>
                        {uniqueLanguages.map(lang => <option key={lang} value={lang}>{lang === 'All' ? 'Semua Bahasa' : lang}</option>)}
                    </Select>
                </div>
            </div>

            {loading ? <Spinner /> : paginatedManuscripts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {paginatedManuscripts.map(ms => <ManuscriptCard key={ms.id} manuscript={ms} />)}
                    </div>
                    
                    <div className="flex justify-center items-center mt-12 space-x-2">
                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="secondary" className="!px-4">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </Button>
                        <span className="text-gray-700">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                         <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="secondary" className="!px-4">
                            <ChevronRightIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-xl">Tidak ada manuskrip yang cocok dengan kriteria Anda.</p>
                </div>
            )}
        </div>
    );
};

export default CatalogPage;