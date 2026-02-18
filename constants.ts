
import { InventoryItem, Requisition } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Premium Bed Linens (King)', category: 'Housekeeping', stock: 45, minStock: 50, unit: 'Sets', pricePerUnit: 85 },
  { id: '2', name: 'Mini Bar Water (500ml)', category: 'F&B Service', stock: 1200, minStock: 500, unit: 'Bottles', pricePerUnit: 0.5 },
  { id: '3', name: 'Bath Towels (White)', category: 'Housekeeping', stock: 85, minStock: 100, unit: 'Pieces', pricePerUnit: 12 },
  { id: '4', name: 'Concierge Envelopes', category: 'Front Office', stock: 200, minStock: 100, unit: 'Box', pricePerUnit: 15 },
  { id: '5', name: 'Champagne (Moët & Chandon)', category: 'F&B Service', stock: 12, minStock: 24, unit: 'Bottles', pricePerUnit: 65 },
  { id: '6', name: 'Industrial Cleaner', category: 'POMEC', stock: 8, minStock: 15, unit: 'Units', pricePerUnit: 35 },
];

export const INITIAL_REQUISITIONS: Requisition[] = [
  {
    id: 'REQ-101',
    department: 'Housekeeping',
    requester: 'Maria Garcia',
    date: '2024-05-15',
    status: 'In Progress',
    remarks: 'Urgent',
    items: [
      { id: 'itm-1', name: 'Bath Towels', quantity: 50, unit: 'Pieces', estimatedCost: 600, source: 'Warehouse' }
    ],
    description: 'Urgent replacement for East Wing rooms.'
  },
  {
    id: 'REQ-102',
    department: 'F&B Service',
    requester: 'James Wilson',
    date: '2024-05-14',
    status: 'For signing',
    remarks: 'PAR Stock',
    items: [
      { id: 'itm-2', name: 'Wine Glasses', quantity: 24, unit: 'Pieces', estimatedCost: 120, source: 'Warehouse' }
    ]
  },
  {
    id: 'REQ-103',
    department: 'Sports & Recreations',
    requester: 'Alex Chen',
    date: '2024-05-16',
    status: 'Pending',
    remarks: 'Event Stock',
    eventDate: '2024-06-01',
    items: [
      { id: 'itm-3', name: 'Tennis Balls', quantity: 10, unit: 'Canisters', estimatedCost: 150, source: 'Purchase' }
    ],
    description: 'Supplies for Summer Tournament'
  }
];

export const DEPARTMENTS = [
  'Housekeeping', 
  'F&B Service', 
  'Kitchen', 
  'Front Office', 
  'Finance', 
  'Laundry', 
  'Purchasing', 
  'Human Resource', 
  'Admin', 
  'Sports & Recreations', 
  'Reservation', 
  'POMEC', 
  'Security'
] as const;
