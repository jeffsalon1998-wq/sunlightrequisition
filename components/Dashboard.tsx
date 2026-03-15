
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { InventoryItem, Requisition, Department } from '../types';
import { Clock, Truck, PenTool, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  inventory: InventoryItem[];
  requisitions: Requisition[];
  defaultDept: Department | null;
  isAdmin?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, requisitions, defaultDept, isAdmin }) => {
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
    if (isAdmin) return monthlyRequisitions;
    return defaultDept 
      ? monthlyRequisitions.filter(r => r.department === defaultDept) 
      : [];
  }, [monthlyRequisitions, defaultDept, isAdmin]);

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

  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    deptRequisitions.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [deptRequisitions]);

  const COLORS = ['#4a0404', '#d4af37', '#78716c', '#7f1d1d', '#14532d', '#1e3a8a', '#581c87', '#7c2d12'];
  const STATUS_COLORS = {
    'Pending': '#f59e0b',
    'For signing': '#8b5cf6',
    'In Progress': '#3b82f6',
    'Ready for Pickup': '#0ea5e9',
    'Completed': '#10b981',
    'Rejected': '#ef4444',
    'For Justification': '#f43f5e'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]">Operations Hub</h2>
        </motion.div>
        <button className="hidden md:flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live Feed
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="NEW" value={stats.pendingCount} icon={<Clock size={16} />} trend="REVIEW" color="amber" delay={0} />
        <StatCard title="SIGNING" value={stats.signingCount} icon={<PenTool size={16} />} trend="ACTION" color="purple" delay={0.1} />
        <StatCard title="ACTIVE" value={stats.readyForPickupCount} icon={<Truck size={16} />} trend="PICKING" color="blue" delay={0.2} />
        <StatCard title="RATE" value={`${stats.completionRate}%`} icon={<CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />} trend="CLOSED" color="green" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/50 dark:bg-stone-900/70 p-5 md:p-8 rounded-3xl shadow-sm border-t border-b border-stone-200/50 dark:border-stone-800/50 relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em] [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]">Departmental Distribution</h3>
              <p className="text-[10px] text-stone-700 dark:text-stone-300 font-bold uppercase mt-1 [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]">{currentMonthName} Activity</p>
            </div>
          </div>

          <div className="h-48 md:h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#44403c', fontSize: 10, fontWeight: 'bold'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#44403c', fontSize: 10, fontWeight: 'bold'}} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(168, 162, 158, 0.1)'}}
                    contentStyle={{backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '16px', border: '1px solid #e7e5e4', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold'}}
                    itemStyle={{color: '#4a0404'}}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-stone-800 dark:text-stone-200 text-sm font-bold [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]">
                No data available
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 dark:bg-stone-900/50 backdrop-blur-md p-5 md:p-8 rounded-3xl shadow-sm border-t border-b border-stone-200/20 dark:border-stone-800/20 relative overflow-hidden flex flex-col"
        >
          <div className="mb-4">
            <h3 className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em] [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]">Status Overview</h3>
            <p className="text-[10px] text-stone-700 dark:text-stone-300 font-bold uppercase mt-1 [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]">Current State</p>
          </div>
          
          <div className="flex-1 min-h-[200px] relative">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#a8a29e'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '11px', fontWeight: 'bold'}}
                    itemStyle={{color: '#4a0404'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-stone-800 dark:text-stone-200 text-sm font-bold [text-shadow:0_1px_2px_rgba(255,255,255,0.5)]">
                No data available
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend: string; color: string; delay: number }> = ({ title, value, icon, trend, color, delay }) => {
  const getColors = () => {
    switch(color) {
      case 'amber': return { bg: 'bg-amber-100/50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/50' };
      case 'purple': return { bg: 'bg-purple-100/50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/50' };
      case 'blue': return { bg: 'bg-blue-100/50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/50' };
      case 'green': return { bg: 'bg-emerald-100/50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50' };
      default: return { bg: 'bg-stone-100/50 dark:bg-stone-800/50', text: 'text-stone-600 dark:text-stone-400', iconBg: 'bg-stone-100 dark:bg-stone-800' };
    }
  };

  const colors = getColors();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className={`${colors.bg} p-4 md:p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 transition-all group relative overflow-hidden`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className={`p-2.5 rounded-xl ${colors.iconBg} transition-colors shadow-sm`}>
          {icon}
        </div>
        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
          {trend}
        </span>
      </div>
      
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm p-4 rounded-2xl border border-white/40 dark:border-white/5">
        <div className="text-4xl md:text-5xl font-black text-stone-900 dark:text-stone-100 leading-tight mb-1">{value}</div>
        <div className="text-[10px] md:text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">{title}</div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
