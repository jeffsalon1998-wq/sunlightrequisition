
import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Search, Filter, Layers, X, Check } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
}

const Inventory: React.FC<InventoryProps> = ({ inventory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Available Stocks</h2>
          <p className="text-[10px] md:text-[11px] text-zinc-500 italic font-medium">Global hotel resource tracking</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Search and Filter Header */}
        <div className="p-3 border-b border-zinc-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
              <input 
                type="text" 
                placeholder="Search resources by name..." 
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-maroon-bg/5 placeholder:text-zinc-300 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 border rounded-lg transition-all flex items-center gap-2 ${
                isFilterOpen || selectedCategory !== 'All' 
                ? 'bg-maroon-bg text-yellow-400 border-maroon-bg shadow-sm' 
                : 'text-zinc-400 bg-zinc-50 border-zinc-200 hover:text-maroon-bg'
              }`}
            >
              <Filter size={16} />
              <span className="text-[10px] font-bold uppercase hidden md:inline">Filter</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          {isFilterOpen && (
            <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-1 duration-200">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                    selectedCategory === cat 
                    ? 'maroon-bg text-yellow-400 border-maroon-bg shadow-sm' 
                    : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr className="text-[9px] uppercase font-black text-zinc-400 tracking-widest">
                <th className="px-5 py-3">Resource Description</th>
                <th className="px-5 py-3">Dept. Origin</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-[11px] font-bold text-zinc-800">{item.name}</div>
                    <div className="text-[8px] text-zinc-300 font-mono">ID: {item.id}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[8px] font-black bg-zinc-100 px-1.5 py-0.5 rounded-md text-zinc-500 uppercase tracking-tight">{item.category}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-black text-zinc-900">{item.stock}</span>
                      <span className="text-[8px] text-zinc-400 font-bold uppercase">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest bg-zinc-50 text-zinc-500">
                      Available
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-xs text-zinc-400 font-medium italic">No items found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filteredInventory.map((item) => (
            <div key={item.id} className="p-3 flex items-center justify-between active:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-400">
                  <Layers size={14} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-800 line-clamp-1">{item.name}</h3>
                  <p className="text-[8px] text-zinc-400 font-black uppercase tracking-tight">{item.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs font-black text-zinc-900">{item.stock}</span>
                  <span className="text-[8px] font-bold text-zinc-400 uppercase">{item.unit}</span>
                </div>
                <div className="text-[7px] text-zinc-300 font-black uppercase tracking-widest mt-0.5">Available</div>
              </div>
            </div>
          ))}
          {filteredInventory.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-xs text-zinc-400 font-medium italic">No items found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
