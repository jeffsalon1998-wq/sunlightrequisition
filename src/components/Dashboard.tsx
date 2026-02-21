import React from 'react';
import { InventoryItem, Requisition, Department } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  requisitions: Requisition[];
  defaultDept: Department | null;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, requisitions, defaultDept }) => {
  // Filter requisitions by defaultDept if set
  const filteredRequisitions = defaultDept
    ? requisitions.filter(req => req.department === defaultDept)
    : requisitions;

  // Inventory Statistics
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderPoint).length;
  const outOfStockItems = inventory.filter(item => item.currentStock === 0).length;

  // Requisition Statistics
  const totalRequisitions = filteredRequisitions.length;
  const pendingRequisitions = filteredRequisitions.filter(req => req.status === 'Pending' || req.status === 'For signing').length;
  const completedRequisitions = filteredRequisitions.filter(req => req.status === 'Completed').length;
  const inProgressRequisitions = filteredRequisitions.filter(req => req.status === 'In Progress' || req.status === 'Ready for Pickup').length;

  // Data for Departmental Distribution Chart
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef'];
  const availableDepartments: Department[] = ['Housekeeping', 'Front Office', 'Food & Beverage', 'Maintenance', 'Security', 'Spa', 'P&R Stock', 'General'];

  // Data for Departmental Distribution Chart
  const departmentData = availableDepartments.map(dept => ({
    name: dept,
    requisitions: requisitions.filter(req => req.department === dept).length,
  }));

  // Data for Requisition Status Chart
  const statusData = [
    { name: 'Pending', value: pendingRequisitions, color: '#facc15' },
    { name: 'In Progress', value: inProgressRequisitions, color: '#3b82f6' },
    { name: 'Completed', value: completedRequisitions, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-zinc-800">{defaultDept ? `${defaultDept} Dashboard` : 'Overall Dashboard'}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-md border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Total Inventory Items</p>
            <p className="text-3xl font-bold text-zinc-800 mt-1">{totalItems}</p>
          </div>
          <Package size={32} className="text-zinc-400 opacity-50" />
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Low Stock Alerts</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{lowStockItems}</p>
          </div>
          <AlertCircle size={32} className="text-red-400 opacity-50" />
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Pending Requisitions</p>
            <p className="text-3xl font-bold text-amber-500 mt-1">{pendingRequisitions}</p>
          </div>
          <Clock size={32} className="text-amber-400 opacity-50" />
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Completed Requisitions</p>
            <p className="text-3xl font-bold text-green-500 mt-1">{completedRequisitions}</p>
          </div>
          <CheckCircle2 size={32} className="text-green-400 opacity-50" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-800 mb-4">Requisitions by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '12px', color: '#3f3f46' }} labelStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              <Bar dataKey="requisitions" fill="#8884d8" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-800 mb-4">Requisition Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '12px', color: '#3f3f46' }} labelStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
              <Legend formatter={(value, entry) => <span style={{ color: entry.color, fontSize: '12px' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
