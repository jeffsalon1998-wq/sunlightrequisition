import React, { useState } from 'react';
import { Requisition, Department, InventoryItem, RequisitionItem } from '../types';
import { 
  Search, 
  ChevronDown, 
  Edit, 
  Trash2, 
  History, 
  FileText, 
  Tag, 
  User, 
  Building, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Hourglass, 
  Signature, 
  Truck, 
  XCircle, 
  ArrowRight,
  MessageSquare,
  Lock,
  Minus,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RequisitionListProps {
  requisitions: Requisition[];
  onStatusUpdate: (id: string, status: Requisition['status']) => void;
  onUpdateRequisition: (requisition: Requisition) => void;
  defaultDept: Department | null;
  availableDepartments: Department[];
  isAdmin: boolean;
  inventory: InventoryItem[];
}

const RequisitionList: React.FC<RequisitionListProps> = ({
  requisitions,
  onStatusUpdate,
  onUpdateRequisition,
  defaultDept,
  availableDepartments,
  isAdmin,
  inventory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Requisition['status'] | 'All'>('All');
  const [filterDepartment, setFilterDepartment] = useState<Department | 'All'>(defaultDept || 'All');
  const [expandedRequisitionId, setExpandedRequisitionId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<RequisitionItem[]>([]);

  const nextStatusMap: { [key in Requisition['status']]: Requisition['status'] | null } = {
    'Pending': 'For signing',
    'For signing': 'Approved',
    'Approved': 'In Progress',
    'In Progress': 'Ready for Pickup',
    'Ready for Pickup': 'Completed',
    'Rejected': null,
    'Completed': null,
  };

  const statusColors: { [key in Requisition['status']]: string } = {
    'Pending': 'bg-amber-100 text-amber-800',
    'For signing': 'bg-purple-100 text-purple-800',
    'Approved': 'bg-blue-100 text-blue-800',
    'Rejected': 'bg-red-100 text-red-800',
    'In Progress': 'bg-indigo-100 text-indigo-800',
    'Ready for Pickup': 'bg-green-100 text-green-800',
    'Completed': 'bg-zinc-100 text-zinc-800',
  };

  const statusIcons: { [key in Requisition['status']]: React.ReactNode } = {
    'Pending': <Hourglass size={14} />,
    'For signing': <Signature size={14} />,
    'Approved': <CheckCircle2 size={14} />,
    'Rejected': <XCircle size={14} />,
    'In Progress': <Truck size={14} />,
    'Ready for Pickup': <AlertCircle size={14} />,
    'Completed': <CheckCircle2 size={14} />,
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = req.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    const matchesDepartment = filterDepartment === 'All' || req.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const toggleExpand = (id: string) => {
    setExpandedRequisitionId(prev => (prev === id ? null : id));
    setEditMode(null); // Exit edit mode when expanding/collapsing
  };

  const handleEditClick = (req: Requisition) => {
    setEditMode(req.id);
    setEditedItems(req.items);
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditedItems([]);
  };

  const handleSaveEdit = (originalReq: Requisition) => {
    const updatedReq: Requisition = {
      ...originalReq,
      items: editedItems,
      updatedAt: new Date().toISOString(),
    };
    onUpdateRequisition(updatedReq);
    setEditMode(null);
    setEditedItems([]);
    toast.success('Requisition updated successfully!');
  };

  const handleUpdateEditedItemQuantity = (itemId: string, quantity: number) => {
    setEditedItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item)
    );
  };

  const handleRemoveEditedItem = (itemId: string) => {
    setEditedItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-zinc-800">Supply Tracking</h1>
      <p className="text-zinc-500">Monitor requisition lifecycle</p>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-zinc-100 flex flex-col md:flex-row gap-4">
        <div className="flex items-center bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-maroon-bg/10 focus-within:border-maroon-bg/20 transition-all flex-grow">
          <Search size={16} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Search by requested ID or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none ml-2 text-sm w-full text-zinc-800 placeholder:text-zinc-400 font-medium"
          />
        </div>

        <div className="relative w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Requisition['status'] | 'All')}
            className="w-full md:w-48 p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none appearance-none transition-all text-sm font-medium bg-zinc-50"
          >
            <option value="All">All Statuses</option>
            {Object.keys(statusColors).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={16} className="text-zinc-400" />
          </div>
        </div>

        <div className="relative w-full md:w-auto">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value as Department | 'All')}
            className="w-full md:w-48 p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none appearance-none transition-all text-sm font-medium bg-zinc-50"
            disabled={!!defaultDept && isAdmin === false} // Disable if defaultDept is set and not admin
          >
            <option value="All">All Departments</option>
            {availableDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {!!defaultDept && isAdmin === false && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Lock size={16} className="text-zinc-400" />
            </div>
          )}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={16} className="text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Requisitions List */}
      <div className="space-y-4">
        {filteredRequisitions.length > 0 ? (
          filteredRequisitions.map(req => (
            <div key={req.id} className="bg-white rounded-2xl shadow-md border border-zinc-100 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => toggleExpand(req.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full maroon-bg text-yellow-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {req.id.split('-')[1] || 'REQ'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800">{req.id}</p>
                    <p className="text-xs text-zinc-500">{req.requester} &bull; {format(new Date(req.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[req.status]} flex items-center gap-1`}>
                    {statusIcons[req.status]} {req.status}
                  </span>
                  <ChevronDown size={16} className={`text-zinc-400 transition-transform ${expandedRequisitionId === req.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {expandedRequisitionId === req.id && (
                <div className="p-4 border-t border-zinc-100 bg-zinc-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-zinc-500 flex items-center gap-2 mb-1"><User size={14} /> Requester: <span className="font-medium text-zinc-800">{req.requester}</span></p>
                      <p className="text-zinc-500 flex items-center gap-2 mb-1"><Building size={14} /> Department: <span className="font-medium text-zinc-800">{req.department}</span></p>
                      <p className="text-zinc-500 flex items-center gap-2"><Tag size={14} /> Priority: <span className="font-medium text-zinc-800">{req.priority}</span></p>
                    </div>
                    <div>
                      <p className="text-zinc-500 flex items-center gap-2 mb-1"><Clock size={14} /> Created: <span className="font-medium text-zinc-800">{format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm')}</span></p>
                      <p className="text-zinc-500 flex items-center gap-2"><History size={14} /> Last Update: <span className="font-medium text-zinc-800">{format(new Date(req.updatedAt), 'MMM dd, yyyy HH:mm')}</span></p>
                    </div>
                  </div>

                  {req.additionalInfo && (
                    <div className="bg-white p-3 rounded-xl border border-zinc-200 mb-4">
                      <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MessageSquare size={12} /> Additional Info</p>
                      <p className="text-sm text-zinc-800">{req.additionalInfo}</p>
                    </div>
                  )}

                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Requested Items</h4>
                  <div className="space-y-2 mb-4">
                    {editMode === req.id ? (
                      req.items.length > 0 ? (
                        editedItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-zinc-800">{item.name}</p>
                              <p className="text-xs text-zinc-500">{item.unit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => handleUpdateEditedItemQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-600">
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateEditedItemQuantity(item.id, parseInt(e.target.value))}
                                className="w-12 text-center border-none focus:outline-none text-sm font-medium"
                              />
                              <button type="button" onClick={() => handleUpdateEditedItemQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-600">
                                <Plus size={14} />
                              </button>
                              <button type="button" onClick={() => handleRemoveEditedItem(item.id)} className="ml-3 p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-zinc-400 text-sm italic">No items in this requisition.</div>
                      )
                    ) : (
                      req.items.length > 0 ? (
                        req.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                            <p className="text-sm font-medium text-zinc-800">{item.name}</p>
                            <p className="text-sm text-zinc-500">{item.quantity} {item.unit}</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-zinc-400 text-sm italic">No items in this requisition.</div>
                      )
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    {isAdmin && editMode !== req.id && (
                      <button
                        onClick={() => handleEditClick(req)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Edit size={14} /> Edit Requisition
                      </button>
                    )}
                    {editMode === req.id && (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-300 transition-colors flex items-center gap-2"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(req)}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 size={14} /> Save Changes
                        </button>
                      </>
                    )}
                    {isAdmin && nextStatusMap[req.status] && editMode !== req.id && (
                      <button
                        onClick={() => onStatusUpdate(req.id, nextStatusMap[req.status]!)}
                        className="px-4 py-2 bg-maroon-bg text-yellow-400 rounded-xl text-xs font-semibold hover:bg-red-900 transition-colors flex items-center gap-2"
                      >
                        Advance Status <ArrowRight size={14} />
                      </button>
                    )}
                    {isAdmin && req.status === 'Pending' && editMode !== req.id && (
                      <button
                        onClick={() => onStatusUpdate(req.id, 'Rejected')}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-zinc-100 text-center text-zinc-400 text-sm italic">
            No requisitions found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default RequisitionList;
