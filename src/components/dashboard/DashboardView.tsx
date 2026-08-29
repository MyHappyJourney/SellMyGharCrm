import React from 'react';
import { 
  Users, 
  PhoneCall, 
  TrendingUp, 
  Home, 
  Building, 
  Flame, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Upload, 
  Sparkles, 
  CalendarClock, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from 'recharts';
import { useCrm } from '../../context/CrmContext';
import { MongoStatusBanner } from '../common/MongoStatusBanner';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenImport: () => void;
  onOpenQuickLog?: () => void;
  onSelectOwner: (ownerId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenImport,
  onSelectOwner
}) => {
  const { 
    owners, 
    followUps, 
    listings, 
    transactions, 
    activities, 
    saleLeads, 
    rentalLeads,
    completeFollowUp
  } = useCrm();

  // Metrics Calculations
  const totalOwners = owners.length;
  const verifiedOwners = owners.filter(o => o.propertyStatus && o.propertyStatus !== 'Unknown').length;
  const coveragePercent = totalOwners > 0 ? Math.round((verifiedOwners / totalOwners) * 100) : 0;
  
  const sellingOwners = owners.filter(o => o.saleIntent && o.saleIntent !== 'Not Interested').length;
  const immediateSellers = owners.filter(o => o.saleIntent === 'Immediate').length;
  
  const hotLeads = owners.filter(o => o.leadTemperature === 'HOT');
  const warmLeads = owners.filter(o => o.leadTemperature === 'WARM');
  const coldLeads = owners.filter(o => o.leadTemperature === 'COLD');
  const nurtureLeads = owners.filter(o => o.leadTemperature === 'NURTURE');

  const activeListings = listings.filter(l => l.listingStatus === 'Active' || l.listingStatus === 'Under Offer');
  
  // Total Commission & Closed Volume
  const closedTransactions = transactions.filter(t => t.dealStage === 'Commission Received' || t.dealStage === 'Registered / Executed');
  const totalRevenue = closedTransactions.reduce((acc, t) => acc + (t.brokerageFee || 0), 0);

  // Top Qualified Pipeline Rows
  const qualifiedPipelineOwners = owners
    .filter(o => o.leadTemperature === 'HOT' || o.leadTemperature === 'WARM' || (o.saleIntent && o.saleIntent !== 'Not Interested'))
    .slice(0, 8);

  // Chart Data: Property Status Breakdown
  const statusCounts: Record<string, number> = {};
  owners.forEach(o => {
    const status = o.propertyStatus || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const propertyStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const STATUS_COLORS: Record<string, string> = {
    'Self Occupied': '#64748b',
    'Rented': '#0284c7',
    'Vacant': '#10b981',
    'Planning to Sell': '#f59e0b',
    'Planning to Rent': '#8b5cf6',
    'Considering Both': '#ec4899',
    'Unknown': '#cbd5e1'
  };

  // Chart Data: Lead Temperature Breakdown
  const temperatureData = [
    { name: 'HOT (70+)', count: hotLeads.length, fill: '#ef4444' },
    { name: 'WARM (40-69)', count: warmLeads.length, fill: '#f97316' },
    { name: 'COLD (20-39)', count: coldLeads.length, fill: '#3b82f6' },
    { name: 'NURTURE (<20)', count: nurtureLeads.length, fill: '#94a3b8' }
  ];

  // Chart Data: Top Prestige Projects
  const projectCounts: Record<string, { total: number; sellers: number; renters: number }> = {};
  owners.forEach(o => {
    const proj = o.project || 'Other Prestige';
    if (!projectCounts[proj]) {
      projectCounts[proj] = { total: 0, sellers: 0, renters: 0 };
    }
    projectCounts[proj].total += 1;
    if (o.saleIntent && o.saleIntent !== 'Not Interested') projectCounts[proj].sellers += 1;
    if (o.rentalIntent && o.rentalIntent !== 'Not Interested') projectCounts[proj].renters += 1;
  });

  const projectData = Object.entries(projectCounts)
    .map(([project, stats]) => ({
      project: project.replace('Prestige ', ''),
      Total: stats.total,
      Sellers: stats.sellers,
      Renters: stats.renters
    }))
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Live MongoDB Connection Status & Diagnostic Banner */}
      <MongoStatusBanner onOpenSettings={() => onNavigate('settings')} />

      {/* 5-Column Executive Stat Cards from Professional Polish Design */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Owners */}
        <div 
          onClick={() => onNavigate('owners')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Owners</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{totalOwners.toLocaleString()}</h2>
            <span className="text-emerald-600 text-[10px] font-bold">+12 Today</span>
          </div>
        </div>

        {/* Card 2: Verified */}
        <div 
          onClick={() => onNavigate('owners')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Verified</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{verifiedOwners.toLocaleString()}</h2>
            <span className="text-slate-400 text-[10px] font-medium">{coveragePercent}% Coverage</span>
          </div>
        </div>

        {/* Card 3: Hot Leads (with distinctive red left border) */}
        <div 
          onClick={() => onNavigate('telecaller')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-red-500 hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Hot Leads</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{hotLeads.length}</h2>
            <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Action Required</span>
          </div>
        </div>

        {/* Card 4: Selling Intent */}
        <div 
          onClick={() => onNavigate('sales_pipeline')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Selling Intent</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{sellingOwners}</h2>
            <span className="text-slate-400 text-[10px] font-medium">Immediate: {immediateSellers}</span>
          </div>
        </div>

        {/* Card 5: Revenue MTD */}
        <div 
          onClick={() => onNavigate('analytics')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue (MTD)</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
              ₹{(totalRevenue / 100000).toFixed(1)}L
            </h2>
            <span className="text-blue-600 text-[10px] font-bold">Goal: ₹15L</span>
          </div>
        </div>
      </section>

      {/* Primary Qualified Owner Pipeline Table Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center text-sm">
            <span className="mr-2 text-blue-500">📋</span> Qualified Owner Pipeline
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onNavigate('owners')}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Filter By Project
            </button>
            <button 
              onClick={() => onNavigate('owners')}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              View Full Database ({owners.length}) →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase sticky top-0">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200">Owner & Contact</th>
                <th className="px-4 py-3 border-b border-slate-200">Property Info</th>
                <th className="px-4 py-3 border-b border-slate-200">Status</th>
                <th className="px-4 py-3 border-b border-slate-200">Intent</th>
                <th className="px-4 py-3 border-b border-slate-200 text-center">Lead Score</th>
                <th className="px-4 py-3 border-b border-slate-200">Follow-up / Task</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {qualifiedPipelineOwners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-xs">
                    {owners.length === 0 ? (
                      <div className="space-y-2 max-w-sm mx-auto">
                        <p className="text-slate-700 font-semibold text-sm">No records in the CRM database yet</p>
                        <p className="text-slate-500 text-xs">Click "Import Excel/CSV" to import your 5,000+ Prestige owner database.</p>
                        <button
                          onClick={onOpenImport}
                          className="mt-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          + Import Excel / CSV Database
                        </button>
                      </div>
                    ) : (
                      "No qualified leads yet. Use Telecaller Dialer to begin qualifying owners."
                    )}
                  </td>
                </tr>
              ) : (
                qualifiedPipelineOwners.map((owner) => (
                <tr 
                  key={owner.id}
                  onClick={() => onSelectOwner(owner.id)}
                  className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{owner.name}</div>
                    <div className="text-xs text-slate-500">
                      {owner.primaryPhone} {owner.email && `• ${owner.email}`}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded inline-block mb-1">
                      {owner.project}
                    </div>
                    <div className="text-xs text-slate-600">
                      Block {owner.block} • #{owner.flatNumber}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      owner.propertyStatus === 'Planning to Sell' ? 'bg-red-100 text-red-700' :
                      owner.propertyStatus === 'Planning to Rent' ? 'bg-blue-100 text-blue-700' :
                      owner.propertyStatus === 'Self Occupied' ? 'bg-slate-100 text-slate-700' :
                      owner.propertyStatus === 'Rented' ? 'bg-purple-100 text-purple-700' :
                      owner.propertyStatus === 'Vacant' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {owner.propertyStatus.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      {owner.saleIntent && owner.saleIntent !== 'Not Interested' ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded inline-block w-fit">
                          SELL: {owner.saleIntent.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Sell: Not Interested</span>
                      )}
                      {owner.rentalIntent && owner.rentalIntent !== 'Not Interested' ? (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block w-fit">
                          RENT: {owner.rentalIntent.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Rent: Not Interested</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className={`text-lg font-bold ${
                      owner.leadTemperature === 'HOT' ? 'text-red-600' :
                      owner.leadTemperature === 'WARM' ? 'text-orange-500' :
                      owner.leadTemperature === 'COLD' ? 'text-blue-500' : 'text-slate-400'
                    }`}>
                      {owner.leadScore}
                    </span>
                    <div className={`text-[10px] font-bold uppercase ${
                      owner.leadTemperature === 'HOT' ? 'text-red-400' :
                      owner.leadTemperature === 'WARM' ? 'text-orange-400' :
                      owner.leadTemperature === 'COLD' ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {owner.leadTemperature}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-slate-800">
                      {owner.lastContactDate ? owner.lastContactDate : 'No Task'}
                    </div>
                    <div className="text-[10px] text-slate-400 italic truncate max-w-[160px]">
                      {owner.lastContactOutcome || 'Ready for qualification'}
                    </div>
                  </td>
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50/50">
          <span>Showing top qualified leads ({qualifiedPipelineOwners.length} of {owners.length} total)</span>
          <button 
            onClick={() => onNavigate('owners')}
            className="text-blue-600 font-semibold hover:underline flex items-center space-x-1"
          >
            <span>Open Table View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Analytics & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Owner Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Owner Disposition</h3>
              <p className="text-xs text-slate-500">Categorized by verified status</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
              {totalOwners} Total
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertyStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {propertyStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value} owners (${((value / totalOwners) * 100).toFixed(1)}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
            {propertyStatusData.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[item.name] || '#94a3b8' }}></span>
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Lead Temperature Funnel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lead Scoring Funnel</h3>
              <p className="text-xs text-slate-500">Readiness for mandate</p>
            </div>
            <button 
              onClick={() => onNavigate('telecaller')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Telecaller Queue →
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temperatureData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={90} />
                <Tooltip formatter={(val: any) => [`${val} Owners`, 'Count']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>🔥 <strong>{hotLeads.length} Hot leads</strong> require immediate mandate call</span>
            <button
              onClick={() => onNavigate('telecaller')}
              className="text-blue-600 font-bold hover:underline"
            >
              Start Calls
            </button>
          </div>
        </div>

        {/* Chart 3: Project-wise Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Prestige Communities</h3>
              <p className="text-xs text-slate-500">Sellers & Renters inventory</p>
            </div>
            <span className="text-xs text-slate-500">Top 6</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <XAxis dataKey="project" tick={{ fontSize: 9, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Total" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Sellers" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Renters" fill="#0284c7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
