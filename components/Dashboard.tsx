
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InventoryItem, Requisition, Department } from '../types';
import { Clock, Truck, PenTool, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  requisitions: Requisition[];
  defaultDept: Department | null;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, requisitions, defaultDept }) => {
  // Filter requisitions for the stats cards based on defaultDept
  // If no department is selected, we show 0 stats as per "show only stats for setted default department"
  const deptRequisitions = defaultDept 
    ? requisitions.filter(r => r.department === defaultDept) 
    : [];

  const pendingCount = deptRequisitions.filter(r => r.status === 'Pending').length;
  const signingCount = deptRequisitions.filter(r => r.status === 'For signing').length;
  // "Picking" / Active includes In Progress and Ready for Pickup
  const inProgressCount = deptRequisitions.filter(r => r.status === 'In Progress' || r.status === 'Ready for Pickup').length;
  const completedCount = deptRequisitions.filter(r => r.status === 'Completed').length;
  
  const totalRequisitions = deptRequisitions.length;
  const completionRate = totalRequisitions > 0 
    ? Math.round((completedCount / totalRequisitions) * 100) 
    : 0;

  // Chart data remains global to show context/comparison across departments
  const chartData = [
    { name: 'HK', value: requisitions.filter(r => r.department === 'Housekeeping').length },
    { name: 'F&B', value: requisitions.filter(r => r.department === 'F&B Service' || r.department === 'Kitchen').length },
    { name: 'Maint', value: requisitions.filter(r => r.department === 'POMEC').length },
    { name: 'Front', value: requisitions.filter(r => r.department === 'Front Office').length },
  ];

  const COLORS = ['#800000', '#facc15', '#71717a', '#dc2626'];

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Operations Hub</h2>
          <p className="text-[10px] md:text-[11px] text-zinc-500 font-medium italic">Overview for {new Date().toLocaleDateString()}</p>
        </div>
        <button className="hidden md:flex items-center gap-2 text-[9px] text-zinc-500 font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
          <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
          Live Feed
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <StatCard title="New" value={pendingCount} icon={<Clock size={14} />} trend="Review" color="amber" />
        <StatCard title="Signing" value={signingCount} icon={<PenTool size={14} />} trend="Action" color="purple" />
        <StatCard title="Active" value={inProgressCount} icon={<Truck size={14} />} trend="Picking" color="blue" />
        <StatCard title="Rate" value={`${completionRate}%`} icon={<CheckCircle2 size={14} className="text-green-600" />} trend="Closed" color="green" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-zinc-200 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Departmental Distribution</h3>
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            </div>
          </div>

          <div className="h-40 md:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold'}} 
                  dy={5}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#a1a1aa', fontSize: 9, fontWeight: 'bold'}} 
                />
                <Tooltip 
                  cursor={{fill: '#fafafa'}}
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f4f4f5', boxShadow: '0 8px 12px -3px rgb(0 0 0 / 0.05)', fontSize: '10px', fontWeight: 'bold'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend: string; color: string }> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white p-3 md:p-4 rounded-[20px] shadow-sm border border-zinc-200 transition-all hover:translate-y-[-1px] group">
    <div className="flex justify-between items-center mb-2">
      <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 transition-colors">
        {icon}
      </div>
      <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider ${
        color === 'purple' ? 'text-purple-600' :
        color === 'blue' ? 'text-blue-600' : 
        color === 'green' ? 'text-green-600' : 
        'text-amber-600'
      }`}>
        {trend}
      </span>
    </div>
    <div className="text-xl md:text-2xl font-black text-zinc-900 leading-tight mb-0.5">{value}</div>
    <div className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</div>
  </div>
);

export default Dashboard;
