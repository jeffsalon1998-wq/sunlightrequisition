
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryItem, Requisition, Department, RequisitionItem, RemarkType } from '../types';
import { Plus, Trash2, Send, Search, X, Layers, Lock, AlertTriangle, ChevronDown, CalendarDays, CheckCircle2 } from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { z } from 'zod';
import { toast } from 'sonner';

const requisitionSchema = z.object({
  requester: z.string().min(2, "Requester name must be at least 2 characters"),
  department: z.string().min(1, "Please select a department in settings"),
  remarks: z.enum(['Urgent', 'PAR Stock', 'Event Stock']),
  eventDate: z.string().optional().refine((date) => {
    if (!date) return true;
    return new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "Event date cannot be in the past"),
  items: z.array(z.any()).min(1, "At least one item is required")
});

interface RequisitionFormProps {
  onSubmit: (requisition: Requisition) => void;
  inventory: InventoryItem[];
  defaultDepartment?: Department | null;
  requisitions: Requisition[];
}

const RequisitionForm: React.FC<RequisitionFormProps> = ({ onSubmit, inventory, defaultDepartment = null, requisitions = [] }) => {
  const [department, setDepartment] = useState<Department | "">(defaultDepartment || "");
  const [requester, setRequester] = useState('');
  const [remarks, setRemarks] = useState<RemarkType>('PAR Stock');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [eventDate, setEventDate] = useState('');
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<number | string>('');
  const [newItemUnit, setNewItemUnit] = useState('UNITS');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const formEndRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    setDepartment(defaultDepartment || "");
  }, [defaultDepartment]);

  const selectedInventoryItem = inventory.find(i => i.name.toLowerCase() === newItemName.toLowerCase());
  const availableStock = selectedInventoryItem ? selectedInventoryItem.stock : Infinity;
  const currentQty = typeof newItemQty === 'number' ? newItemQty : 0;
  const isOverStock = newItemName && currentQty > availableStock;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const addItem = () => {
    const qty = typeof newItemQty === 'number' ? newItemQty : parseInt(String(newItemQty));
    if (!newItemName || !qty || qty <= 0) return;
    
    const isInStockList = inventory.some(i => i.name.toLowerCase() === newItemName.toLowerCase());
    const inventoryItem = inventory.find(i => i.name.toLowerCase() === newItemName.toLowerCase());
    const unitPrice = inventoryItem ? inventoryItem.pricePerUnit : 0;

    const upperName = newItemName.toUpperCase();
    const upperUnit = newItemUnit.toUpperCase();
    const source = isInStockList ? 'Warehouse' : 'Purchase';
    const estimatedCost = unitPrice * qty;

    // Merge duplicates if item with same name and unit exists
    const existingIndex = items.findIndex(i => i.name === upperName && i.unit === upperUnit);

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += qty;
      // Add the cost of the new quantity to the existing cost
      updatedItems[existingIndex].estimatedCost = (updatedItems[existingIndex].estimatedCost || 0) + estimatedCost;
      setItems(updatedItems);
    } else {
      const item: RequisitionItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: upperName,
        quantity: qty,
        unit: upperUnit,
        estimatedCost: estimatedCost,
        source: source
      };
      setItems([...items, item]);
    }
    
    setNewItemName('');
    setNewItemUnit('UNITS');
    setNewItemQty('');
    setSearchQuery('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const selectInventoryItem = (item: InventoryItem | { name: string; unit: string }) => {
    setNewItemName(item.name.toUpperCase());
    setNewItemUnit(item.unit.toUpperCase());
    setSearchQuery('');
    setNewItemQty('');
  };

  const getDepartmentCode = (dept: string): string => {
    const codes: Record<string, string> = {
      'Admin': 'ADM',
      'Cafeteria': 'CAF',
      'Finance': 'FIN',
      'F&B Service': 'FNB',
      'Front Office': 'FRO',
      'Front Office-Airport Lounge': 'FAL',
      'Front Office-Kanaten': 'FOK',
      'Housekeeping': 'HOU',
      'Human Resource': 'HRM',
      'Laundry': 'LAU',
      'Kitchen': 'MK',
      'POMEC': 'POM',
      'Purchasing': 'PUR',
      'Reservation': 'RES',
      'Security': 'SEC',
      'Sports & Recreations': 'SNR',
      'Information Technology': 'IT'
    };
    return codes[dept] || dept.substring(0, 3).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = requisitionSchema.safeParse({
      requester,
      department,
      remarks,
      eventDate: remarks === 'Event Stock' ? eventDate : undefined,
      items
    });

    if (!validation.success) {
      const errorMsg = validation.error.issues[0].message;
      toast.error(errorMsg);
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);
    
    try {
      // Filter items by source to split them if necessary
      const warehouseItems = items.filter(i => i.source === 'Warehouse');
      const purchaseItems = items.filter(i => i.source === 'Purchase');
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const deptCode = getDepartmentCode(department);
      
      // Count existing requisitions for this department in this month
      const existingCount = requisitions.filter(r => {
        if (r.department !== department) return false;
        const rDate = new Date(r.date);
        return rDate.getFullYear() === year && rDate.getMonth() === now.getMonth();
      }).length;

      let offset = 1;

      // Helper to generate and submit
      const createAndSubmit = (reqItems: RequisitionItem[]) => {
        const sequence = String(existingCount + offset).padStart(4, '0');
        const newId = `SGHC ${deptCode}-${year}-${month}-${sequence}`;

        const requisition: Requisition = {
          id: newId,
          department: department as Department,
          requester: requester.toUpperCase(),
          date: now.toISOString().split('T')[0],
          items: reqItems,
          status: 'Pending',
          remarks,
          description,
          eventDate: remarks === 'Event Stock' ? eventDate : undefined
        };

        onSubmit(requisition);
        offset++;
      };

      if (warehouseItems.length > 0) {
        createAndSubmit(warehouseItems);
      }

      if (purchaseItems.length > 0) {
        createAndSubmit(purchaseItems);
      }
    } catch (error) {
      toast.error("Failed to submit requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasExactMatch = inventory.some(i => i.name.toLowerCase() === searchQuery.toLowerCase());
  const shouldShowResults = searchQuery.trim().length > 0;

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-48 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col px-1">
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Create Request</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="bg-white rounded-[24px] border border-zinc-200 shadow-sm overflow-hidden">
          {/* Top Section: Core Info */}
          <div className="p-4 md:p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[8px] font-black text-zinc-400 uppercase mb-1 ml-1 tracking-[0.1em]">Staff ID / Name</label>
                <input 
                  required
                  type="text" 
                  value={requester} 
                  onChange={e => setRequester(e.target.value.toUpperCase())}
                  onFocus={handleFocus}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-maroon-bg/5 focus:border-maroon-bg/10 focus:bg-white outline-none text-xs font-bold text-zinc-900 transition-all placeholder:text-zinc-300 uppercase"
                  placeholder="ENTER STAFF IDENTIFIER"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-black text-zinc-400 uppercase mb-1 ml-1 tracking-[0.1em]">Department</label>
                  <div className="w-full bg-zinc-100 border border-zinc-200 px-4 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center cursor-not-allowed">
                    <span className={department ? "text-zinc-500" : "text-zinc-400 italic"}>
                      {department || "Set in Settings"}
                    </span>
                    <Lock size={12} className="text-zinc-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-zinc-400 uppercase mb-1 ml-1 tracking-[0.1em]">Priority</label>
                  <select 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value as RemarkType)}
                    onFocus={handleFocus}
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-maroon-bg/5 focus:border-maroon-bg/10 focus:bg-white outline-none appearance-none transition-all"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="PAR Stock">PAR Stock</option>
                    <option value="Event Stock">Event Stock</option>
                  </select>
                </div>
              </div>

              {remarks === 'Event Stock' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[8px] font-black text-amber-600 uppercase mb-1 ml-1 tracking-[0.1em] flex items-center gap-1">
                    <CalendarDays size={10} /> Event Date
                  </label>
                  <input 
                    required
                    type="date"
                    min={today}
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    onFocus={handleFocus}
                    className="w-full bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-zinc-100"></div>

          {/* Bottom Section: Resource Selection */}
          <div className="p-4 md:p-6 bg-zinc-50/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 yellow-bg rounded-full"></div>
              <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Resource Selection</h3>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
              <div className="relative">
                <label className="block text-[8px] font-black text-zinc-400 uppercase mb-1.5 ml-1 tracking-widest">Catalog Search</label>
                <div className="relative">
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    value={searchQuery || newItemName}
                    onFocus={handleFocus}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setSearchQuery(val);
                      setNewItemName(val);
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 pl-4 pr-10 py-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-maroon-bg/5 focus:bg-white transition-all shadow-sm placeholder:text-zinc-300 uppercase"
                    placeholder="SEARCH FOR ITEMS..."
                  />
                  {(searchQuery || newItemName) && (
                    <button 
                    type="button" 
                    onClick={() => { setSearchQuery(''); setNewItemName(''); }} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-red-500"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                  )}
                </div>

                {shouldShowResults && (
                  <div ref={resultsRef} className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 flex flex-col max-h-[200px] overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="overflow-y-auto custom-scrollbar">
                      {!hasExactMatch && (
                        <button type="button" onClick={() => selectInventoryItem({ name: searchQuery, unit: 'UNITS' })} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 group text-left">
                          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors group-hover:bg-maroon-bg group-hover:text-yellow-400"><Plus size={14} strokeWidth={3} /></div>
                          <div className="flex-1">
                            <p className="text-[7px] font-black text-red-700 uppercase tracking-widest">Custom Entry</p>
                            <p className="text-xs font-bold maroon-text italic leading-none">"{searchQuery}"</p>
                          </div>
                        </button>
                      )}
                      {filteredInventory.map(item => (
                        <button key={item.id} type="button" onClick={() => selectInventoryItem(item)} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 group text-left">
                          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 transition-colors group-hover:bg-maroon-bg group-hover:text-yellow-400"><Layers size={14} /></div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-zinc-800 leading-tight">{item.name}</p>
                            <p className="text-[8px] font-bold text-zinc-400 mt-0.5 uppercase tracking-widest">{item.stock} {item.unit} available</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-[1fr_2fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1.5 ml-1 tracking-widest">QTY</label>
                  <input 
                    type="number" min="0" 
                    onFocus={handleFocus}
                    className={`w-full bg-zinc-50 border ${isOverStock ? 'border-red-500' : 'border-zinc-200'} px-3 py-3 rounded-xl text-center text-sm font-black text-zinc-900 outline-none focus:ring-2 focus:ring-maroon-bg/5 transition-all shadow-sm placeholder:text-zinc-300`} 
                    value={newItemQty}
                    onChange={e => setNewItemQty(parseInt(e.target.value) || '')}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1.5 ml-1 tracking-widest">UNIT</label>
                  <input 
                    type="text" placeholder="UNITS"
                    onFocus={handleFocus}
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-maroon-bg/5 transition-all uppercase shadow-sm"
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value.toUpperCase())}
                  />
                </div>
                <button 
                  type="button" onClick={addItem} disabled={!newItemName || !newItemQty || (typeof newItemQty === 'number' && newItemQty <= 0)}
                  className="w-[46px] h-[46px] bg-yellow-400 border border-yellow-500 hover:bg-yellow-500 text-[#5d0000] rounded-xl active:scale-95 disabled:opacity-50 disabled:bg-zinc-100 disabled:border-zinc-200 disabled:text-zinc-300 transition-all flex items-center justify-center shadow-lg group"
                  aria-label="Add item to list"
                >
                  <Plus size={24} strokeWidth={4} className="transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {isOverStock && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-1">
                  <AlertTriangle size={12} className="text-red-600" />
                  <p className="text-[9px] font-bold text-red-600 uppercase tracking-tight">Warning: Exceeds available stock ({availableStock})</p>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-50">
                {items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 animate-in slide-in-from-right-1 group hover:border-zinc-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-[#eab308] text-[#450a0a] font-black flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                            {item.quantity}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-zinc-800 uppercase">{item.name}</span>
                              <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider border ${
                                item.source === 'Purchase' 
                                  ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]' 
                                  : 'bg-blue-50 text-blue-800 border-blue-100'
                              }`}>
                                {item.source}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">{item.unit}</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeItem(item.id)} 
                          className="text-zinc-300 hover:text-red-500 transition-colors p-2 hover:bg-white rounded-lg"
                          aria-label={`Remove ${item.name}`}
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 opacity-30 border-2 border-dashed border-zinc-200 rounded-xl">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">List Empty</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <button 
            type="submit"
            disabled={!department || isSubmitting}
            className="w-full py-4 bg-[#3d0000] text-[#fbbf24] rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:translate-y-[-1px] active:translate-y-[1px] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} strokeWidth={3} className="rotate-[-10deg]" />
            )}
            {isSubmitting ? 'Processing...' : 'Initialize Requisition'}
          </button>
        )}
      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-2">Confirm Requisition</h3>
              <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                You are about to submit <span className="font-black text-zinc-800">{items.length} items</span> for <span className="font-black text-zinc-800">{department}</span>. This action will notify the purchasing department.
              </p>
            </div>
            <div className="flex border-t border-zinc-100">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-5 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSubmit}
                className="flex-1 py-5 bg-[#3d0000] text-yellow-400 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={formEndRef} />
    </div>
  );
};

export default RequisitionForm;
