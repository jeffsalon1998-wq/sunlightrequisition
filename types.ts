
export type Department = 
  | 'Housekeeping' 
  | 'F&B Service' 
  | 'Kitchen' 
  | 'Front Office' 
  | 'Finance' 
  | 'Laundry' 
  | 'Purchasing' 
  | 'Human Resource' 
  | 'Admin' 
  | 'Sports & Recreations' 
  | 'Reservation' 
  | 'POMEC' 
  | 'Security';

export type RequestStatus = 
  | 'Pending' 
  | 'For signing' 
  | 'In Progress' 
  | 'Ready for Pickup' 
  | 'Completed' 
  | 'Rejected'
  | 'For Justification';

export type RemarkType = 'Urgent' | 'PAR Stock' | 'Event Stock';

export type ItemSource = 'Warehouse' | 'Purchase';

export interface RequisitionItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  source: ItemSource;
  bought?: boolean;
}

export interface Requisition {
  id: string;
  department: Department;
  requester: string;
  date: string;
  items: RequisitionItem[];
  status: RequestStatus;
  remarks: RemarkType;
  description?: string;
  eventDate?: string;
  rejectionReason?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  pricePerUnit: number;
}
