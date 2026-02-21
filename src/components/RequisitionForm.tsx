import React, { useState, useEffect } from 'react';
import { Requisition, InventoryItem, Department, RequisitionItem } from '../types';
import { Plus, Minus, Trash2, CheckCircle2, XCircle, ChevronDown, Lock, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface RequisitionFormProps {
  onSubmit: (requisition: Requisition) => void;
  inventory: InventoryItem[];
  defaultDepartment: Department | null;
  requisitions: Requisition[];
}

const RequisitionForm: React.FC<RequisitionFormProps> = ({ onSubmit, inventory, defaultDepartment, requisitions }) => {
  const [requester, setRequester] = useState('');
  const [department, setDepartment] = useState<Department | null>(defaultDepartment);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [selectedItems, setSelectedItems] = useState<RequisitionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState(''); // New state for additional info

  useEffect(() => {
    setDepartment(defaultDepartment);
  }, [defaultDepartment]);

  const availableDepartments: Department[] = ['Housekeeping', 'Front Office', 'Food & Beverage', 'Maintenance', 'Security', 'Spa', 'P&R Stock', 'General'];

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (item: InventoryItem) => {
    const existingItem = selectedItems.find(si => si.id === item.id);
    if (existingItem) {
      setSelectedItems(prev =>
        prev.map(si => si.id === item.id ? { ...si, quantity: si.quantity + 1 } : si)
      );
    } else {
      setSelectedItems(prev => [...prev, { id: item.id, name: item.name, quantity: 1, unit: item.unit }]);
    }
    setSearchTerm('');
  };

  const handleUpdateItemQuantity = (id: string, quantity: number) => {
    setSelectedItems(prev =>
      prev.map(si => si.id === id ? { ...si, quantity: Math.max(1, quantity) } : si)
    );
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(si => si.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requester || !department || selectedItems.length === 0) {
      toast.error('Please fill in all required fields and add at least one item.');
      return;
    }

    const newRequisition: Requisition = {
      id: `REQ-${Math.floor(Math.random() * 100000)}`,
      requester,
      department,
      priority,
      items: selectedItems,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      additionalInfo, // Include additional info
    };

    onSubmit(newRequisition);
    setRequester('');
    setPriority('Medium');
    setSelectedItems([]);
    setSearchTerm('');
    setAdditionalInfo(''); // Clear additional info after submission
    toast.success('Requisition submitted!');
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl border border-zinc-100 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-zinc-800 mb-6">Create New Requisition</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Requester and Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="requester" className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">Staff ID / Name</label>
            <input
              type="text"
              id="requester"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none transition-all text-sm font-medium"
              placeholder="Enter Staff Identifier"
              required
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">Department</label>
            <div className="relative">
              <select
                id="department"
                value={department || ''}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className={`w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none appearance-none transition-all text-sm font-medium ${!department ? 'text-zinc-400' : 'text-zinc-800'}`}
                disabled={!!defaultDepartment} // Disable if default department is set
                required
              >
                <option value="" disabled>Set in Settings</option>
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {!!defaultDepartment && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Lock size={16} className="text-zinc-400" />
                </div>
              )}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown size={16} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="priority" className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">Priority</label>
            <div className="relative">
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Urgent')}
                className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none appearance-none transition-all text-sm font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown size={16} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div>
          <label htmlFor="additionalInfo" className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">Additional Info / Details</label>
          <textarea
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
            className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none transition-all text-sm font-medium resize-y"
            placeholder="Any additional information or special requests..."
          ></textarea>
        </div>

        {/* Resource Selection */}
        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">Resource Selection</h3>
          <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-maroon-bg/10 focus-within:border-maroon-bg/20 transition-all">
            <Search size={14} className="text-zinc-400" />
            <input
              type="text"
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:outline-none ml-2 text-sm w-full text-zinc-800 placeholder:text-zinc-400 font-medium"
            />
          </div>
          {searchTerm && (
            <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-lg">
              {filteredInventory.length > 0 ? (
                filteredInventory.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer transition-colors"
                    onClick={() => handleAddItem(item)}
                  >
                    <span className="text-sm font-medium text-zinc-800">{item.name}</span>
                    <span className="text-xs text-zinc-500">Stock: {item.currentStock}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-zinc-400 text-sm">No items found.</div>
              )}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {selectedItems.length > 0 ? (
              selectedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-800">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-600">
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value))}
                      className="w-12 text-center border-none focus:outline-none text-sm font-medium"
                    />
                    <button type="button" onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-600">
                      <Plus size={14} />
                    </button>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="ml-3 p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-400 text-sm italic">List Empty</div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-maroon-bg text-yellow-400 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-900 transition-colors shadow-lg flex items-center justify-center gap-3"
        >
          Submit Requisition
          <ArrowRight size={16} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};

export default RequisitionForm;
