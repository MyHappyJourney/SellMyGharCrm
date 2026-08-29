import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  DollarSign, 
  Phone, 
  Mail, 
  CheckCircle2, 
  X, 
  Sparkles,
  Building,
  Briefcase
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Tenant } from '../../types';

interface TenantListViewProps {
  onNavigateToMatcher: () => void;
}

export const TenantListView: React.FC<TenantListViewProps> = ({ onNavigateToMatcher }) => {
  const { tenants, addTenant, currentUser } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('Infosys Bengaluru');
  const [tenantCategory, setTenantCategory] = useState<'Family' | 'Bachelors' | 'Company Lease'>('Family');
  const [preferredProjects, setPreferredProjects] = useState('Prestige Shantiniketan, Prestige Falcon City');
  const [preferredBhk, setPreferredBhk] = useState('3 BHK');
  const [budgetMax, setBudgetMax] = useState('60000');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredTenants = tenants.filter(t => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const nameMatch = t.name ? t.name.toLowerCase().includes(q) : false;
    const phoneMatch = t.phone ? t.phone.includes(q) : false;
    const companyMatch = t.companyName ? t.companyName.toLowerCase().includes(q) : false;
    const projectMatch = Array.isArray(t.preferredProjects)
      ? t.preferredProjects.some(p => p.toLowerCase().includes(q))
      : typeof (t as any).preferredProject === 'string'
        ? (t as any).preferredProject.toLowerCase().includes(q)
        : false;
    return nameMatch || phoneMatch || companyMatch || projectMatch;
  });

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    addTenant({
      name,
      phone,
      email: email || undefined,
      tenantCategory,
      companyName: companyName || undefined,
      preferredProjects: preferredProjects.split(',').map(s => s.trim()).filter(Boolean),
      preferredBhk: preferredBhk.split(',').map(s => s.trim()).filter(Boolean),
      budgetMax: Number(budgetMax) || 50000,
      moveInDate,
      assignedAgent: currentUser.name,
      tenantStage: 'Requirement Registered'
    });

    setIsAdding(false);
    setName('');
    setPhone('');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Tenant CRM & Inquiries</h1>
            <span className="bg-emerald-100 text-emerald-900 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-300">
              {tenants.length} Verified Tenants
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Corporate professionals & families screened for Prestige residential rental mandates.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onNavigateToMatcher}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Match Rental Units</span>
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tenant</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenants by name, company, or target project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No tenants found. Click "Add Tenant" to register an inquiry.
          </div>
        ) : (
          filteredTenants.map((tenant) => {
            const projectList = Array.isArray(tenant.preferredProjects) && tenant.preferredProjects.length > 0
              ? tenant.preferredProjects
              : (tenant as any).preferredProject
                ? [(tenant as any).preferredProject]
                : [];
            
            const bhkText = Array.isArray(tenant.preferredBhk)
              ? tenant.preferredBhk.join(', ')
              : (tenant as any).preferredBhk || 'Any BHK';

            const budgetDisplay = tenant.budgetMax != null
              ? `₹${Number(tenant.budgetMax).toLocaleString('en-IN')}/mo`
              : (tenant as any).budget != null
                ? `₹${Number((tenant as any).budget).toLocaleString('en-IN')}/mo`
                : 'Flexible';

            return (
              <div key={tenant.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{tenant.name}</h3>
                    {tenant.companyName && (
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Briefcase className="h-3 w-3 text-slate-400" />
                        <span>{tenant.companyName}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {tenant.tenantCategory || 'Screened Tenant'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Budget:</span>
                    <span className="font-bold text-emerald-950">{budgetDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Configuration:</span>
                    <span className="font-semibold text-slate-800">{bhkText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Move-in Date:</span>
                    <span className="text-slate-700 font-medium">{tenant.moveInDate || 'Flexible'}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Communities:</p>
                  <div className="flex flex-wrap gap-1">
                    {projectList.length > 0 ? (
                      projectList.map(p => (
                        <span key={p} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">All Prestige Projects</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">Agent: {tenant.assignedAgent || 'Unassigned'}</span>
                  <button
                    onClick={onNavigateToMatcher}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center space-x-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Match Rental Units →</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Tenant Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">Register Screened Tenant Requirement</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTenant} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tenant Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Sethi"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 XXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Employer</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tenant Category</label>
                  <select
                    value={tenantCategory}
                    onChange={(e) => setTenantCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Family">Family</option>
                    <option value="Bachelors">Bachelors (IT/Corp)</option>
                    <option value="Company Lease">Company Lease</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Prestige Communities</label>
                <input
                  type="text"
                  value={preferredProjects}
                  onChange={(e) => setPreferredProjects(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Monthly Budget (₹)</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Desired Move-in Date</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Tenant Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
