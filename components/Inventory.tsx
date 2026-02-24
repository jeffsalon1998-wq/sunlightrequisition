
import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Search, Filter, Layers, X, Check, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InventoryProps {
  inventory: InventoryItem[];
}

const Inventory: React.FC<InventoryProps> = ({ inventory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Derive unique categories from inventory
  const categories = useMemo(() => {
    const cats = new Set(inventory.map(item => item.category));
    return ['All', ...Array.from(cats).sort()];
  }, [inventory]);

  // Filtered inventory based on search and category
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1"
      >
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">Available Stocks</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 italic font-medium mt-1">Global hotel resource tracking</p>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 self-start md:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
            aria-label="List View"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
            aria-label="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-colors"
      >
        {/* Search and Filter Header */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input 
                type="text" 
                placeholder="Search resources by name..." 
                className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-maroon-bg/20 dark:focus:ring-gold-bg/20 placeholder:text-stone-400 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 border rounded-xl transition-all flex items-center gap-2 shadow-sm ${
                isFilterOpen || selectedCategory !== 'All' 
                ? 'bg-maroon-bg text-gold-text border-maroon-bg' 
                : 'text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:text-maroon-bg dark:hover:text-gold-text'
              }`}
            >
              <Filter size={16} />
              <span className="text-[10px] font-bold uppercase hidden md:inline">Filter</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-2 overflow-hidden"
              >
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                      selectedCategory === cat 
                      ? 'maroon-bg text-gold-text border-maroon-bg shadow-md' 
                      : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop View Table */}
        <div className={`hidden md:block overflow-x-auto ${viewMode === 'grid' ? 'hidden' : ''}`}>
          <table className="w-full text-left">
            <thead className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
              <tr className="text-[10px] uppercase font-black text-stone-500 dark:text-stone-400 tracking-widest">
                <th className="px-6 py-4">Resource Description</th>
                <th className="px-6 py-4">Dept. Origin</th>
                <th className="px-6 py-4 text-center">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredInventory.map((item) => {
                return (
                <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                        <Layers size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900 dark:text-stone-100">{item.name}</div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">ID: {item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md text-stone-600 dark:text-stone-400 uppercase tracking-tight">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm font-black text-stone-900 dark:text-stone-100">{item.stock}</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">{item.unit}</span>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div className="p-16 text-center">
              <p className="text-sm text-stone-400 dark:text-stone-500 font-medium italic">No items found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Grid View (Desktop & Mobile) */}
        <div className={`p-4 md:p-6 ${viewMode === 'list' ? 'md:hidden' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredInventory.map((item, index) => {
                return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  className="p-5 rounded-2xl border transition-all hover:shadow-md bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                      <Layers size={20} />
                    </div>
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {item.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1 mb-1">{item.name}</h3>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">ID: {item.id}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-0.5">In Stock</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black leading-none text-stone-900 dark:text-stone-100">{item.stock}</span>
                        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">{item.unit}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )})}
            </AnimatePresence>
          </div>
          {filteredInventory.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-16 text-center"
            >
              <p className="text-sm text-stone-400 dark:text-stone-500 font-medium italic">No items found.</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Inventory;
