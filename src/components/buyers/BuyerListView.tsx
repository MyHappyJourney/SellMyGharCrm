import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  DollarSign, 
  Phone, 
  Mail, 
  CheckCircle2, 
  X, 
  Sparkles,
  Building
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Buyer } from '../../types';

interface BuyerListViewProps {
  onNavigateToMatcher: () => void;
}

export const BuyerListView: React.FC<BuyerListViewProps> = ({ onNavigateToMatcher }) => {
  const { buyers, addBuyer, updateBuyer, deleteBuyer, currentUser } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredProjects, setPreferredProjects] = useState('Prestige Falcon City, Prestige Lakeside Habitat');
  const [preferredBhk, setPreferredBhk] = useState('3 BHK');
  const [minBudget, setMinBudget] = useState('18000000');
  const [maxBudget, setMaxBudget] = useState('24000000');
  const [fundingType, setFundingType] = useState<'Home Loan' | 'Self Funded' | 'Combination'>('Home Loan');
  const [urgency, setUrgency] = useState<'Immediate' | 'Within 1 Month' | '1-3 Months' | 'Flexible'>('Within 1 Month');

  const filteredBuyers = buyers.filter(b => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const nameMatch = b.name ? b.name.toLowerCase().includes(q) : false;
    const phoneMatch = b.phone ? b.phone.includes(q) : false;
    const projectMatch = Array.isArray(b.preferredProjects) 
      ? b.preferredProjects.some(p => p.toLowerCase().includes(q))
      : typeof b.preferredProject === 'string'
        ? b.preferredProject.toLowerCase().includes(q)
        : false;
    return nameMatch || phoneMatch || projectMatch;
  });

  const handleAddBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    addBuyer({
      name,
      phone,
      email: email || undefined,
      preferredProjects: preferredProjects.split(',').map(s => s.trim()).filter(Boolean),
      preferredBhk: preferredBhk.split(',').map(s => s.trim()).filter(Boolean),
      budgetMin: Number(minBudget) || 15000000,
      budgetMax: Number(maxBudget) || 25000000,
      fundingType,
      buyerStage: 'Qualified Requirement',
      urgency,
      assignedAgent: currentUser.name
    });

    setIsAdding(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Buyer CRM & Mandates</h1>
            <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-200">
              {buyers.length} Qualified Buyers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified buyers actively seeking resale apartments in Prestige Bengaluru communities.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onNavigateToMatcher}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>Smart Match Inventory</span>
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Buyer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search buyers by name, phone, or target project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Buyer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBuyers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No buyers found. Click "Add Buyer" to register an active requirement.
          </div>
        ) : (
          filteredBuyers.map((buyer) => {
            const projectList = Array.isArray(buyer.preferredProjects) && buyer.preferredProjects.length > 0
              ? buyer.preferredProjects
              : buyer.preferredProject
                ? [buyer.preferredProject]
                : [];
            
            const bhkText = Array.isArray(buyer.preferredBhk)
              ? buyer.preferredBhk.join(', ')
              : buyer.preferredBhk || 'Any BHK';

            return (
              <div key={buyer.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{buyer.name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-600 font-mono mt-0.5">
                      <span>{buyer.phone}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    {buyer.buyerStage || buyer.status || 'Qualified'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Budget Range:</span>
                    <span className="font-bold text-slate-900">
                      {buyer.budgetMin != null && buyer.budgetMax != null
                        ? `₹${(buyer.budgetMin / 10000000).toFixed(2)} - ₹${(buyer.budgetMax / 10000000).toFixed(2)} Cr`
                        : buyer.budgetMax != null
                          ? `Up to ₹${(buyer.budgetMax / 10000000).toFixed(2)} Cr`
                          : 'Budget Flexible'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Configuration:</span>
                    <span className="font-semibold text-slate-800">{bhkText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Funding / Urgency:</span>
                    <span className="text-slate-700">
                      {buyer.fundingType || buyer.paymentMode || 'Home Loan'} • {buyer.urgency || buyer.purchaseTimeline || 'Flexible'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Prestige Projects:</p>
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
                  <span className="text-[10px] text-slate-400">Agent: {buyer.assignedAgent || 'Unassigned'}</span>
                  <button
                    onClick={onNavigateToMatcher}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center space-x-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Match Inventory →</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Buyer Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">Add Qualified Buyer Requirement</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBuyer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Buyer Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Nair"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Number</label>
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

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Projects (comma-separated)</label>
                <input
                  type="text"
                  value={preferredProjects}
                  onChange={(e) => setPreferredProjects(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preferred BHK</label>
                  <input
                    type="text"
                    value={preferredBhk}
                    onChange={(e) => setPreferredBhk(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Budget (₹)</label>
                  <input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Budget (₹)</label>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Funding Type</label>
                  <select
                    value={fundingType}
                    onChange={(e) => setFundingType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Home Loan">Home Loan Pre-Approved</option>
                    <option value="Self Funded">Self Funded / Cash</option>
                    <option value="Combination">Combination</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="Immediate">Immediate (Ready)</option>
                    <option value="Within 1 Month">Within 1 Month</option>
                    <option value="1-3 Months">1-3 Months</option>
                    <option value="Flexible">Flexible</option>
                  </select>
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
                  Save Buyer Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
