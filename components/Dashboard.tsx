
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InventoryItem, Requisition, Department } from '../types';
import { Clock, Truck, PenTool, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  inventory: InventoryItem[];
  requisitions: Requisition[];
  defaultDept: Department | null;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, requisitions, defaultDept }) => {
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  // Filter requisitions for the current month
  const monthlyRequisitions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return requisitions.filter(r => {
      const rDate = new Date(r.date);
      return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
    });
  }, [requisitions]);

  // Filter requisitions for the stats cards based on defaultDept
  const deptRequisitions = useMemo(() => {
    return defaultDept 
      ? monthlyRequisitions.filter(r => r.department === defaultDept) 
      : [];
  }, [monthlyRequisitions, defaultDept]);

  const stats = useMemo(() => {
    const pendingCount = deptRequisitions.filter(r => r.status === 'Pending').length;
    const signingCount = deptRequisitions.filter(r => r.status === 'For signing').length;
    const readyForPickupCount = deptRequisitions.filter(r => r.status === 'Ready for Pickup').length;
    const completedCount = deptRequisitions.filter(r => r.status === 'Completed').length;
    
    const totalRequisitions = deptRequisitions.length;
    const completionRate = totalRequisitions > 0 
      ? Math.round((completedCount / totalRequisitions) * 100) 
      : 0;

    return { pendingCount, signingCount, readyForPickupCount, completedCount, completionRate };
  }, [deptRequisitions]);

  const chartData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    
    monthlyRequisitions.forEach(r => {
      deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
    });
    
    return Object.entries(deptCounts)
      .map(([name, value]) => ({ 
        name: name.length > 12 ? name.substring(0, 10) + '..' : name, 
        fullName: name,
        value 
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyRequisitions]);

  const COLORS = ['#4a0404', '#d4af37', '#71717a', '#6b0a0a', '#1a2e05', '#1e3a8a', '#581c87', '#7c2d12'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Operations Hub</h2>
          <p className="text-[10px] md:text-[11px] text-zinc-500 font-medium italic">Monthly Tracking: {currentMonthName}</p>
        </motion.div>
        <button className="hidden md:flex items-center gap-2 text-[9px] text-zinc-500 font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
          <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
          Live Feed
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <StatCard title="New" value={stats.pendingCount} icon={<Clock size={14} />} trend="Review" color="amber" delay={0} />
        <StatCard title="Signing" value={stats.signingCount} icon={<PenTool size={14} />} trend="Action" color="purple" delay={0.1} />
        <StatCard title="Active" value={stats.readyForPickupCount} icon={<Truck size={14} />} trend="Picking" color="blue" delay={0.2} />
        <StatCard title="Rate" value={`${stats.completionRate}%`} icon={<CheckCircle2 size={14} className="text-green-600" />} trend="Closed" color="green" delay={0.3} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 gap-4"
      >
        <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-zinc-200 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Departmental Distribution</h3>
              <p className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">{currentMonthName} Activity</p>
            </div>
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-maroon-bg"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold-bg"></span>
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
      </motion.div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend: string; color: string; delay: number }> = ({ title, value, icon, trend, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={{ y: -4 }}
    className="bg-white p-3 md:p-4 rounded-[20px] shadow-sm border border-zinc-200 transition-all group"
  >
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
  </motion.div>
);

export default Dashboard;
