import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Search, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
}

const Inventory: React.FC<InventoryProps> = ({ inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-zinc-800">Inventory Management</h1>

      <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-maroon-bg/10 focus-within:border-maroon-bg/20 transition-all max-w-md">
        <Search size={16} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none ml-2 text-sm w-full text-zinc-800 placeholder:text-zinc-400 font-medium"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-black text-zinc-500 uppercase tracking-wider">Item Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-black text-zinc-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-black text-zinc-500 uppercase tracking-wider">Current Stock</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-black text-zinc-500 uppercase tracking-wider">Reorder Point</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-black text-zinc-500 uppercase tracking-wider">Supplier</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-black text-zinc-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {filteredInventory.length > 0 ? (
              filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 flex items-center gap-3">
                    <Package size={16} className="text-zinc-400" /> {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`${item.currentStock <= item.reorderPoint ? 'text-red-600' : 'text-green-600'}`}>
                      {item.currentStock} {item.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{item.reorderPoint} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{item.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.currentStock <= item.reorderPoint ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <AlertCircle size={14} className="inline-block mr-1" /> Low Stock
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle2 size={14} className="inline-block mr-1" /> In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 text-center">
                  No inventory items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
