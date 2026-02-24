
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Requisition, RequestStatus, Department, RequisitionItem, InventoryItem } from '../types';
import { Search, ChevronDown, ChevronUp, ArrowRight, Calendar, MapPin, Edit3, Ban, Trash2, Plus, Save, X, ShieldCheck, User, Layers, CalendarDays, AlertTriangle, CheckCircle2, PenTool, MessageSquare } from 'lucide-react';
import OrderTracker from './OrderTracker';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface RequisitionListProps {
  requisitions: Requisition[];
  onStatusUpdate: (id: string, status: RequestStatus, reason?: string) => void;
  onUpdateRequisition: (req: Requisition) => void;
  defaultDept: Department | null;
  availableDepartments: Department[];
  isAdmin?: boolean;
  inventory: InventoryItem[];
}

export default function RequisitionList({ 
  requisitions, 
  onStatusUpdate, 
  onUpdateRequisition, 
  defaultDept, 
  availableDepartments,
  isAdmin,
  inventory
}: RequisitionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>(defaultDept || 'All');
  
  useEffect(() => {
    setDeptFilter(defaultDept || 'All');
  }, [defaultDept]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<RequisitionItem[]>([]);
  const [editDescription, setEditDescription] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string, status: RequestStatus } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionType, setRejectionType] = useState<'Rejected' | 'For Justification'>('Rejected');
  
  // Edit mode add item state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('UNITS');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(id);
    }
  };

  const startEditing = (req: Requisition) => {
    setEditingId(req.id);
    setEditItems([...req.items]);
    setEditDescription(req.description || '');
    setNewItemName('');
    setNewItemQty(1);
    setNewItemUnit('UNITS');
    setShowSearchResults(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditItems([]);
    setEditDescription('');
    setNewItemName('');
    setShowSearchResults(false);
  };

  const saveEdits = async (req: Requisition) => {
    setIsProcessing(true);
    try {
      const newStatus = (req.status === 'Rejected' || req.status === 'For Justification') ? 'Pending' : req.status;
      onUpdateRequisition({
        ...req,
        items: editItems,
        description: editDescription,
        status: newStatus as any,
        rejectionReason: newStatus === 'Pending' ? undefined : req.rejectionReason
      });
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusUpdate = (id: string, status: RequestStatus) => {
    setConfirmAction({ id, status });
  };

  const executeStatusUpdate = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);
    try {
      const reasonToPass = confirmAction.status === 'Pending' ? null : undefined;
      await onStatusUpdate(confirmAction.id, confirmAction.status, reasonToPass as any);
      toast.success(`Requisition moved to ${confirmAction.status}`);
      setConfirmAction(null);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setIsProcessing(true);
    try {
      await onStatusUpdate(rejectId, rejectionType, rejectionReason);
      toast.success(`Requisition marked as ${rejectionType}`);
      setRejectId(null);
      setRejectionReason('');
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setEditItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleUpdateQty = (itemId: string, qty: number) => {
    setEditItems(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, qty);
        // Recalculate cost based on inventory unit price if available
        const invItem = inventory.find(inv => inv.name.toUpperCase() === i.name.toUpperCase());
        let newCost = i.estimatedCost;
        if (invItem && invItem.pricePerUnit) {
           newCost = invItem.pricePerUnit * newQty;
        }
        return { ...i, quantity: newQty, estimatedCost: newCost };
      }
      return i;
    }));
  };

  const handleAddItem = () => {
    if (!newItemName) return;
    
    const isInStockList = inventory.some(i => i.name.toLowerCase() === newItemName.toLowerCase());
    const inventoryItem = inventory.find(i => i.name.toLowerCase() === newItemName.toLowerCase());
    const unitPrice = inventoryItem ? inventoryItem.pricePerUnit : 0;
    
    const item: RequisitionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName.toUpperCase(),
      quantity: newItemQty,
      unit: newItemUnit.toUpperCase(),
      estimatedCost: unitPrice * newItemQty,
      source: isInStockList ? 'Warehouse' : 'Purchase'
    };
    setEditItems([...editItems, item]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemUnit('UNITS');
    setShowSearchResults(false);
  };

  const selectInventoryItem = (item: InventoryItem) => {
    setNewItemName(item.name.toUpperCase());
    setNewItemUnit(item.unit.toUpperCase());
    setShowSearchResults(false);
    setNewItemQty(1);
  };

  const filteredInventoryForEdit = useMemo(() => {
    return inventory.filter(i => 
      i.name.toLowerCase().includes(newItemName.toLowerCase())
    );
  }, [inventory, newItemName]);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'Pending': return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';
      case 'For signing': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'In Progress': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Ready for Pickup': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Rejected': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'For Justification': return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400';
    }
  };

  const getRemarkColor = (remark: string) => {
    switch (remark) {
      case 'Urgent': return 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PAR Stock': return 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Event Stock': return 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';
    }
  };

  const nextStatusMap: Record<RequestStatus, RequestStatus | null> = {
    'Pending': 'For signing',
    'For signing': 'In Progress',
    'In Progress': 'Ready for Pickup',
    'Ready for Pickup': 'Completed',
    'Completed': null,
    'Rejected': 'Pending',
    'For Justification': 'Pending'
  };



  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        req.requester.toLowerCase().includes(query) || 
        req.id.toLowerCase().includes(query) ||
        req.items.some(item => item.name.toLowerCase().includes(query));
      
      const matchesDept = deptFilter === 'All' || req.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [requisitions, searchQuery, deptFilter]);

  // Sorting Logic: Active first, then by Date ASC (Earliest First)
  const sortedRequisitions = useMemo(() => {
    return [...filteredRequisitions].sort((a, b) => {
      const isInactive = (status: RequestStatus) => status === 'Completed' || status === 'Rejected' || status === 'For Justification';
      const aInactive = isInactive(a.status);
      const bInactive = isInactive(b.status);

      if (aInactive !== bInactive) {
        return aInactive ? 1 : -1;
      }

      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredRequisitions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">Supply Tracking</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium italic mt-1">Monitor requisition lifecycle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input 
            type="text" 
            placeholder="SEARCH BY REQUESTER, ID, OR ITEM..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-medium text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-maroon-bg/20 dark:focus:ring-gold-bg/20 placeholder:text-stone-400 uppercase placeholder:normal-case shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
          />
        </div>
        <div className="relative">
          <select 
            className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-medium text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-maroon-bg/20 dark:focus:ring-gold-bg/20 appearance-none shadow-sm transition-all"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value as any)}
          >
            <option value="All">All Departments</option>
            {availableDepartments.map(d => <option key={d} value={d} className="bg-white dark:bg-stone-900">{d}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="space-y-2 pb-6">
        <AnimatePresence mode="popLayout">
          {sortedRequisitions.map((req, index) => {
            // Edit is allowed if:
            // 1. Status is Pending/Rejected/Justification AND (user is Admin OR user belongs to the dept)
            // 2. Status is In Progress AND user is Admin (for quantity adjustments)
            const isEditable = (['Pending', 'Rejected', 'For Justification'].includes(req.status) && (isAdmin || (defaultDept && req.department === defaultDept))) || 
                               (req.status === 'In Progress' && isAdmin);

            const isCurrentlyEditing = editingId === req.id;

            return (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <div className="p-4 active:bg-stone-50 dark:active:bg-stone-800 cursor-pointer" onClick={() => toggleExpand(req.id)}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md text-stone-500 dark:text-stone-400">{req.id}</span>
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                      {isAdmin && (defaultDept === null || req.department !== defaultDept) && req.status === 'Pending' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-[8px] font-black uppercase tracking-widest">
                          <ShieldCheck size={10} /> Admin
                        </div>
                      )}
                    </div>
                    <div className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase ${getRemarkColor(req.remarks)}`}>
                      {req.remarks}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <MapPin size={12} className="text-maroon-bg/60 dark:text-gold-text/80"/> {req.department}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium italic"><User size={10}/> {req.requester}</span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium"><Calendar size={10}/> {req.date}</span>
                        {req.eventDate && (
                           <span className="text-[10px] text-stone-700 dark:text-stone-300 flex items-center gap-1.5 font-bold bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md"><CalendarDays size={10}/> Event: {req.eventDate}</span>
                        )}
                        {req.description && (
                           <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium truncate max-w-[150px]"><PenTool size={10}/> {req.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAdmin && req.status === 'Pending' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setRejectId(req.id); }}
                          className="p-2 text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          aria-label={`Reject requisition ${req.id}`}
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      <div className="text-stone-400 dark:text-stone-500">
                        {expandedId === req.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === req.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-4">
                        <div className="overflow-hidden">
                          <OrderTracker status={req.status} />
                        </div>

                        {req.rejectionReason && (req.status === 'Rejected' || req.status === 'For Justification') && (
                          <div className={`p-3 rounded-lg border animate-in slide-in-from-top-2 duration-300 ${
                            req.status === 'For Justification' 
                              ? 'bg-orange-50 border-orange-100' 
                              : 'bg-red-50 border-red-100'
                          }`}>
                            <h4 className={`text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 ${
                              req.status === 'For Justification' ? 'text-orange-700' : 'text-red-700'
                            }`}>
                              <AlertTriangle size={10} /> {req.status} Reason
                            </h4>
                            <p className={`text-xs font-bold uppercase leading-tight ${
                              req.status === 'For Justification' ? 'text-orange-900' : 'text-red-900'
                            }`}>{req.rejectionReason}</p>
                          </div>
                        )}

                        {isCurrentlyEditing ? (
                          <div className="bg-white p-3 rounded-lg border border-maroon-bg/20 space-y-2 shadow-sm">
                            <h4 className="text-[8px] font-black text-maroon-bg uppercase tracking-widest flex items-center gap-1">
                              <PenTool size={10} /> Edit Details
                            </h4>
                            <input 
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-maroon-bg/5 uppercase"
                              placeholder="ENTER REQUEST DETAILS..."
                            />
                          </div>
                        ) : req.description && (
                          <div className="bg-stone-100/50 p-3 rounded-lg border border-stone-200/50">
                            <h4 className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <PenTool size={10} /> Request Details
                            </h4>
                            <p className="text-xs font-bold text-stone-800 uppercase leading-tight">{req.description}</p>
                          </div>
                        )}

                        <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-2.5 shadow-sm">
                          <div className="flex justify-between items-center mb-0.5">
                            <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Requested Items</h4>
                            {isEditable && !isCurrentlyEditing && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); startEditing(req); }}
                                className="min-h-[32px] px-3 text-[8px] font-bold text-maroon-bg/70 hover:text-maroon-bg flex items-center gap-1 uppercase tracking-tight transition-colors bg-stone-50 rounded-lg"
                                aria-label={`Edit requisition ${req.id}`}
                              >
                                <Edit3 size={10} /> Edit
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {(isCurrentlyEditing ? editItems : req.items).map(i => (
                              <div key={i.id} className="flex items-center justify-between text-[11px] py-2 border-b border-stone-50 last:border-0 group">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-stone-800 font-bold text-xs uppercase">{i.name}</span>
                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter ${
                                      i.source === 'Purchase' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                    }`}>
                                      {i.source || 'Warehouse'}
                                    </span>
                                    {!isCurrentlyEditing && i.source === 'Purchase' && i.bought && (
                                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter bg-green-100 text-green-700 border border-green-200">
                                        BOUGHT
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-stone-400 font-bold uppercase">{i.unit}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {isCurrentlyEditing ? (
                                    <>
                                      <input 
                                        type="number"
                                        min="1"
                                        value={i.quantity}
                                        onChange={(e) => handleUpdateQty(i.id, parseInt(e.target.value) || 1)}
                                        className="w-12 text-center py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-bold outline-none text-[11px] focus:ring-1 focus:ring-maroon-bg/10"
                                      />
                                      <button 
                                        onClick={() => handleRemoveItem(i.id)} 
                                        className="text-stone-300 hover:text-red-600 p-2.5 rounded-lg hover:bg-stone-50 transition-colors"
                                        aria-label={`Remove ${i.name}`}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="font-black maroon-text">x{i.quantity}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {isCurrentlyEditing && (
                            <div className="pt-4 mt-2 space-y-2 border-t border-stone-100">
                               {/* Search/Add Input */}
                              <div className="relative" ref={searchContainerRef}>
                                  <input 
                                      type="text"
                                      placeholder="Search for items..."
                                      value={newItemName}
                                      onFocus={() => setShowSearchResults(true)}
                                      onChange={(e) => {
                                          setNewItemName(e.target.value.toUpperCase());
                                          setShowSearchResults(true);
                                      }}
                                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-900 outline-none focus:ring-2 focus:ring-maroon-bg/5 transition-all uppercase placeholder:normal-case"
                                  />
                                   {showSearchResults && newItemName && (
                                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-2xl z-50 flex flex-col max-h-[160px] overflow-hidden animate-in fade-in slide-in-from-top-1">
                                          <div className="overflow-y-auto custom-scrollbar">
                                              <button 
                                                  type="button" 
                                                  onClick={() => { setShowSearchResults(false); }} 
                                                  className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors border-b border-stone-50 group text-left"
                                              >
                                                  <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors group-hover:bg-maroon-bg group-hover:text-gold-text"><Plus size={12} strokeWidth={3} /></div>
                                                  <div className="flex-1">
                                                      <p className="text-[7px] font-black text-red-700 uppercase tracking-widest">Use Custom</p>
                                                      <p className="text-[10px] font-bold maroon-text italic leading-none">"{newItemName}"</p>
                                                  </div>
                                              </button>
                                              {filteredInventoryForEdit.map(item => (
                                                  <button key={item.id} type="button" onClick={() => selectInventoryItem(item)} className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0 group text-left">
                                                      <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-stone-100 text-stone-400 transition-colors group-hover:bg-maroon-bg group-hover:text-gold-text"><Layers size={12} /></div>
                                                      <div className="flex-1">
                                                          <p className="text-[10px] font-bold text-stone-800 leading-tight">{item.name}</p>
                                                          <p className="text-[8px] font-bold text-stone-400 mt-0.5 uppercase tracking-widest">{item.stock} {item.unit} available</p>
                                                      </div>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>

                              {/* Qty, Unit, Add Button Row */}
                              <div className="flex gap-2">
                                <input 
                                  type="number"
                                  min="1"
                                  value={newItemQty}
                                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                                  className="w-16 px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-center font-bold outline-none focus:ring-2 focus:ring-maroon-bg/5"
                                />
                                <input 
                                  type="text" 
                                  placeholder="UNITS"
                                  value={newItemUnit}
                                  onChange={(e) => setNewItemUnit(e.target.value.toUpperCase())}
                                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-maroon-bg/5 uppercase"
                                />
                                <button 
                                  onClick={handleAddItem} 
                                  disabled={!newItemName} 
                                  className="w-12 h-12 flex items-center justify-center maroon-bg text-white rounded-xl active:scale-95 transition-transform disabled:opacity-50 shadow-md"
                                  aria-label="Add item to edit list"
                                >
                                  <Plus size={18} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {isCurrentlyEditing && (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button 
                              onClick={cancelEditing} 
                              className="py-3 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-stone-50"
                            >
                              <X size={14} /> Cancel
                            </button>
                            <button 
                              onClick={() => saveEdits(req)} 
                              className="py-3 maroon-bg gold-text rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
                            >
                              <Save size={14} /> Save
                            </button>
                          </div>
                        )}

                        {!isCurrentlyEditing && isAdmin && nextStatusMap[req.status] && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, nextStatusMap[req.status]!); }}
                            disabled={isProcessing}
                            className="w-full py-4 maroon-accent-bg gold-text rounded-xl font-black text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg border border-red-900/10 disabled:opacity-50"
                          >
                            {isProcessing ? 'Processing...' : `Process to ${nextStatusMap[req.status]}`} 
                            {!isProcessing && <ArrowRight size={14} strokeWidth={3} />}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredRequisitions.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center bg-white rounded-2xl border border-stone-100 border-dashed"
          >
            <Search className="mx-auto mb-2 text-stone-200" size={32} />
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">No requisitions found</p>
          </motion.div>
        )}
      </div>

      {/* Status Update Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight mb-2">Update Status?</h3>
              <p className="text-stone-500 text-xs font-medium leading-relaxed">
                You are about to move requisition <span className="font-black text-stone-800">{confirmAction.id}</span> to <span className="font-black text-stone-800">{confirmAction.status}</span>.
              </p>
            </div>
            <div className="flex border-t border-stone-100">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-5 text-stone-400 text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeStatusUpdate}
                className="flex-1 py-5 maroon-accent-bg gold-text text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ban size={32} />
              </div>
              <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight mb-2">Reject Request?</h3>
              <p className="text-stone-500 text-xs font-medium leading-relaxed mb-6">
                Provide a reason for rejecting requisition <span className="font-black text-stone-800">{rejectId}</span>.
              </p>
              
              <div className="relative mb-6">
                <MessageSquare className="absolute left-3 top-3 text-stone-400" size={14} />
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value.toUpperCase())}
                  placeholder="ENTER REASON FOR REJECTION..."
                  className="w-full pl-9 pr-3 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-[11px] font-bold text-stone-900 outline-none focus:ring-2 focus:ring-maroon-bg/5 min-h-[100px] uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setRejectionType('Rejected')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    rejectionType === 'Rejected' 
                    ? 'bg-red-600 text-white border-red-600 shadow-md' 
                    : 'bg-white text-stone-400 border-stone-200 hover:border-red-200'
                  }`}
                >
                  Rejected
                </button>
                <button 
                  onClick={() => setRejectionType('For Justification')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    rejectionType === 'For Justification' 
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                    : 'bg-white text-stone-400 border-stone-200 hover:border-orange-200'
                  }`}
                >
                  Justification
                </button>
              </div>
            </div>
            <div className="flex border-t border-stone-100">
              <button 
                onClick={() => { setRejectId(null); setRejectionReason(''); }}
                className="flex-1 py-5 text-stone-400 text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 py-5 maroon-accent-bg gold-text text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
