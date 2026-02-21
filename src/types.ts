// src/types.ts

export type Department = 'Housekeeping' | 'Front Office' | 'Food & Beverage' | 'Maintenance' | 'Security' | 'Spa' | 'P&R Stock' | 'General';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  supplier: string;
  unitCost: number;
}

export interface RequisitionItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Requisition {
  id: string;
  requester: string;
  department: Department;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  items: RequisitionItem[];
  status: 'Pending' | 'For signing' | 'Approved' | 'Rejected' | 'In Progress' | 'Ready for Pickup' | 'Completed';
  createdAt: string;
  updatedAt: string;
  additionalInfo?: string; // New field
}
