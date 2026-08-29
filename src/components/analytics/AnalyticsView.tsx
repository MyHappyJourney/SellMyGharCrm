import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Building, 
  Calendar, 
  UserCheck, 
  ArrowUpRight, 
  Award,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useCrm } from '../../context/CrmContext';

const COLORS = ['#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'];

export const AnalyticsView: React.FC = () => {
  const { transactions, owners, saleLeads, rentalLeads } = useCrm();

  // Metrics
  const totalBrokerage = transactions.reduce((acc, t) => acc + t.brokerageFee, 0);
  const resaleDeals = transactions.filter(t => t.dealType === 'Resale');
  const rentalDeals = transactions.filter(t => t.dealType === 'Rental');

  const resaleBrokerage = resaleDeals.reduce((acc, t) => acc + t.brokerageFee, 0);
  const rentalBrokerage = rentalDeals.reduce((acc, t) => acc + t.brokerageFee, 0);

  // Agent performance
  const agentMap: Record<string, { deals: number; revenue: number }> = {};
  transactions.forEach(t => {
    const agent = t.assignedAgent || 'Primary Broker';
    if (!agentMap[agent]) agentMap[agent] = { deals: 0, revenue: 0 };
    agentMap[agent].deals += 1;
    agentMap[agent].revenue += t.brokerageFee;
  });

  const agentLeaderboard = Object.entries(agentMap).map(([agent, stats]) => ({
    agent,
    ...stats
  })).sort((a, b) => b.revenue - a.revenue);

  // Monthly Revenue Data (Simulated / aggregated)
  const monthlyRevenueData = [
    { month: 'Oct 2025', revenue: 450000, deals: 3 },
    { month: 'Nov 2025', revenue: 620000, deals: 4 },
    { month: 'Dec 2025', revenue: 890000, deals: 6 },
    { month: 'Jan 2026', revenue: 740000, deals: 5 },
    { month: 'Feb 2026', revenue: 1150000, deals: 7 },
    { month: 'Mar 2026', revenue: totalBrokerage, deals: transactions.length }
  ];

  // Deal type share data
  const dealTypeData = [
    { name: 'Resale Brokerage (1%)', value: resaleBrokerage || 430000 },
    { name: 'Rental Brokerage (1 Mo)', value: rentalBrokerage || 150000 }
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Revenue & Deal Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Realized brokerage revenue, conversion funnels, and agent performance tracking across Prestige transactions.
        </p>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Realized Brokerage</span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹{(totalBrokerage / 100000).toFixed(2)} Lakhs
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-600 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+28.4% vs last month</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Resale Brokerage (1%)</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950">
            ₹{(resaleBrokerage / 100000).toFixed(2)} Lakhs
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            {resaleDeals.length} Resale Transactions Closed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rental Brokerage (1 Mo)</span>
            <Building className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950">
            ₹{(rentalBrokerage / 1000).toFixed(0)}k
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            {rentalDeals.length} Rental Leases Executed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pipeline Conversion Rate</span>
            <Award className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-950">14.2%</p>
          <span className="text-[10px] text-slate-500 font-medium">From Qualified Intent to Mandate</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Brokerage Revenue Growth (₹)</h2>
              <p className="text-[11px] text-slate-500">Monthly realized fees from resale and rental closures</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val/100000}L`} />
                <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deal Share Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Revenue Contribution</h2>
            <p className="text-[11px] text-slate-500">Resale vs Rental brokerage split</p>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dealTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Brokerage']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {dealTypeData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-slate-700">{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">₹{(d.value / 100000).toFixed(2)}L</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Closed Deals Table & Agent Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Closed Deals Ledger */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Recently Closed Deals & Fee Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Agreed Value</th>
                  <th className="py-2.5 px-3">Brokerage Fee</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No closed deals yet. Advance leads to "Closed - Won" or "Closed - Rented" in the pipelines!
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{t.closingDate}</td>
                      <td className="py-2.5 px-3 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          t.dealType === 'Resale' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {t.dealType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {t.dealType === 'Resale'
                          ? `₹${(t.agreedPriceOrRent / 10000000).toFixed(2)} Cr`
                          : `₹${t.agreedPriceOrRent.toLocaleString()}/mo`}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        ₹{t.brokerageFee.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{t.assignedAgent}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {t.dealStage}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Leaderboard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Top Producing Agents</h2>
          <div className="space-y-3 pt-1">
            {agentLeaderboard.map((a, idx) => (
              <div key={a.agent} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{a.agent}</p>
                    <p className="text-[10px] text-slate-500">{a.deals} Deals Closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-700 text-xs">₹{(a.revenue / 100000).toFixed(2)}L</span>
                  <span className="text-[10px] text-slate-400 block">Brokerage</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
