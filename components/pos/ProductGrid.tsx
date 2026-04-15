

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product, Settings } from '../../types';
import { ICONS } from '../../constants';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const MotionDiv = motion.div;

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
    <MotionDiv 
        layout
        whileHover={{ y: -4, scale: 1.015, boxShadow: '0 0 0 1px rgba(245,158,11,0.18), 0 0 22px rgba(245,158,11,0.12), 10px 10px 22px rgba(0,0,0,0.55)' }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/5 bg-[linear-gradient(145deg,#15181f,#0e1015)] shadow-[8px_8px_20px_rgba(0,0,0,0.48),-6px_-6px_16px_rgba(255,255,255,0.02)]"
        onClick={() => onAddToCart(product)}
    >
        <div className="relative">
            <img src={product.imageUrl || `https://placehold.co/300x300/e2e8f0/475569?text=${product.name.charAt(0)}`} alt={product.name} className="w-full h-32 object-cover"/>
            {product.stock <= 0 && product.productType === 'Inventory' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-danger px-2 py-1 rounded">OUT OF STOCK</span>
                </div>
            )}
        </div>
        <div className="p-3 flex flex-col flex-grow">
            <h3 className="flex-grow text-sm font-bold text-white">{product.name}</h3>
            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-white/50">{product.category}</p>
                <p className="font-bold text-amber-300">Ksh {product.price.toFixed(2)}</p>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 self-start rounded-full border border-amber-500/15 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white/80 transition-colors group-hover:text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                Add To Cart
            </div>
        </div>
    </MotionDiv>
);

const CubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const ProductListItem: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
    <MotionDiv
        layout
        whileHover={{
            borderColor: 'rgba(245,158,11,0.22)',
            y: -2,
            boxShadow: '0 0 0 1px rgba(245,158,11,0.18), 0 0 20px rgba(245,158,11,0.12), 10px 10px 22px rgba(0,0,0,0.5)'
        }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="flex w-full cursor-pointer items-center space-x-4 overflow-hidden rounded-2xl border border-white/5 bg-[linear-gradient(145deg,#15181f,#0e1015)] p-3 shadow-[8px_8px_20px_rgba(0,0,0,0.44),-6px_-6px_14px_rgba(255,255,255,0.02)]"
        onClick={() => onAddToCart(product)}
    >
        <div className="rounded-xl bg-[#191c23] p-2 flex-shrink-0">
            <CubeIcon />
        </div>
        <div className="flex-grow min-w-0">
            <p className="truncate font-bold text-white" title={product.name}>{product.name}</p>
            <p className="font-mono text-xs text-white/45">SKU: {product.inventoryCode}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
             <p className="text-base font-bold text-amber-300">KES {product.price.toFixed(2)}</p>
             <div className="mt-1 inline-block rounded bg-black px-2 py-0.5 text-xs font-bold text-white">
                Stock: {product.stock}
             </div>
        </div>
    </MotionDiv>
);


interface ProductGridProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
    settings: Settings;
}

const ProductGrid = ({ products, onAddToCart, settings }: ProductGridProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Automatically focus the search input for barcode scanning when the component mounts.
        searchInputRef.current?.focus();
    }, []);

    const categories = useMemo(() => {
        const topLevelCategories = new Set<string>();
        products.forEach(p => {
            if (p.category) {
                topLevelCategories.add(p.category.split(' > ')[0]);
            }
        });
        return ['All', ...Array.from(topLevelCategories).sort()];
    }, [products]);


    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const isCategoryMatch = selectedCategory === 'All' 
                || product.category === selectedCategory 
                || product.category.startsWith(selectedCategory + ' > ');
            
            if (!isCategoryMatch) return false;

            const searchTermLower = searchTerm.toLowerCase();
            const isSearchMatch = product.name.toLowerCase().includes(searchTermLower) || 
                                  product.inventoryCode.toLowerCase().includes(searchTermLower) ||
                                  (product.upc && product.upc.toLowerCase().includes(searchTermLower));
            
            return isSearchMatch;
        });
    }, [products, searchTerm, selectedCategory]);
    
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const searchTermTrimmed = searchTerm.trim().toLowerCase();
            // Attempt to find a product by Inventory Code or UPC when enter is pressed
            const foundProduct = products.find(p => 
                p.inventoryCode.trim().toLowerCase() === searchTermTrimmed ||
                (p.upc && p.upc.trim().toLowerCase() === searchTermTrimmed)
            );
            if (foundProduct) {
                e.preventDefault(); // Prevent any default form submission behavior
                onAddToCart(foundProduct);
                setSearchTerm(''); // Clear the search bar after adding
            }
        }
    };


    const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-grow">
                         <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search products..."
                            className="w-full rounded-2xl border border-white/8 bg-[#121419] py-3 pl-12 pr-4 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                     <div className="flex self-end rounded-2xl border border-white/6 bg-[#121419] p-1 shadow-[6px_6px_16px_rgba(0,0,0,0.35),-4px_-4px_12px_rgba(255,255,255,0.02)] sm:self-auto">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-xl p-2 transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-black shadow-[0_0_18px_rgba(245,158,11,0.25)]' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}
                            aria-label="Grid view"
                        >
                           <GridIcon/>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded-xl p-2 transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-black shadow-[0_0_18px_rgba(245,158,11,0.25)]' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}
                            aria-label="List view"
                        >
                            <ListIcon/>
                        </button>
                    </div>
                </div>
                 <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                                selectedCategory === category 
                                ? 'bg-amber-500 text-black shadow-[0_0_16px_rgba(245,158,11,0.24)]' 
                                : 'bg-[#121419] text-white/65 hover:bg-[#1a1d24] hover:text-white'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
             <div className="mt-4 flex-grow pr-1">
                 {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                         {filteredProducts.map(product => (
                            <ProductListItem key={product.id} product={product} onAddToCart={onAddToCart} />
                        ))}
                    </div>
                )}
                 {filteredProducts.length === 0 && (
                    <div className="py-10 text-center text-white/45">
                        <p>No products found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
