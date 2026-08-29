import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Users, 
  Sliders, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { UserRole } from '../../types';
import { exportOwnersToCsv } from '../../utils/csvExcelParser';

export const SettingsView: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    scoringRules, 
    setScoringRules, 
    owners, 
    resetToDemoData 
  } = useCrm();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable Scoring Rules
  const [immediateSale, setImmediateSale] = useState(scoringRules.immediateSale);
  const [saleWithin3M, setSaleWithin3M] = useState(scoringRules.saleWithin3M);
  const [immediateRent, setImmediateRent] = useState(scoringRules.immediateRent);
  const [rentWithin3M, setRentWithin3M] = useState(scoringRules.rentWithin3M);
  const [marketingAgreed, setMarketingAgreed] = useState(scoringRules.marketingAgreed);
  const [mandateObtained, setMandateObtained] = useState(scoringRules.mandateObtained);

  const handleSaveScoring = (e: React.FormEvent) => {
    e.preventDefault();
    setScoringRules({
      immediateSale: Number(immediateSale),
      saleWithin3M: Number(saleWithin3M),
      immediateRent: Number(immediateRent),
      rentWithin3M: Number(rentWithin3M),
      marketingAgreed: Number(marketingAgreed),
      priceProvided: scoringRules.priceProvided,
      photosAvailable: scoringRules.photosAvailable,
      inspectionAvailable: scoringRules.inspectionAvailable,
      mandateObtained: Number(mandateObtained)
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExport = () => {
    exportOwnersToCsv(owners, `SellMyGhar_Prestige_Owners_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">System Settings & Role Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure lead scoring algorithms, user permissions, privacy controls, and data exports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scoring Weights & RBAC */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active User Role Simulation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Role-Based Access Control (RBAC) Switcher</span>
            </h2>
            <p className="text-xs text-slate-500">
              Test CRM perspectives as different team roles. Switch active user credentials:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { role: 'Super Admin' as UserRole, name: 'Ananya Sharma', title: 'Director / Founder', desc: 'Full database access & revenue tracking' },
                { role: 'Manager' as UserRole, name: 'Vikram Joshi', title: 'Sales Team Leader', desc: 'Team oversight & mandate verification' },
                { role: 'Telecaller' as UserRole, name: 'Rahul Mehra', title: 'Outbound Specialist', desc: 'Dialer queue & qualification workflow' }
              ].map(u => (
                <button
                  key={u.role}
                  type="button"
                  onClick={() => setCurrentUser({
                    id: `usr-${u.role.toLowerCase()}`,
                    name: u.name,
                    email: `${u.name.toLowerCase().replace(' ', '.')}@sellmyghar.com`,
                    role: u.role,
                    assignedProjects: ['Prestige Falcon City', 'Prestige Shantiniketan', 'Prestige Lakeside Habitat']
                  })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentUser.role === u.role
                      ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-slate-900 text-xs">{u.name}</p>
                  <span className="text-[10px] font-semibold text-amber-900 bg-amber-200/70 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                    {u.role}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">{u.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Lead Scoring Weight Tuning */}
          <form onSubmit={handleSaveScoring} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-amber-600" />
                <span>Lead Scoring Point Weights Engine</span>
              </h2>
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  ✓ Weights Updated!
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Customize how many points each confirmed owner answer contributes towards HOT / WARM / COLD lead classification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Immediate Resale Intent (pts)</label>
                <input
                  type="number"
                  value={immediateSale}
                  onChange={(e) => setImmediateSale(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resale within 3 Months (pts)</label>
                <input
                  type="number"
                  value={saleWithin3M}
                  onChange={(e) => setSaleWithin3M(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Immediate Rental Intent (pts)</label>
                <input
                  type="number"
                  value={immediateRent}
                  onChange={(e) => setImmediateRent(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rental within 3 Months (pts)</label>
                <input
                  type="number"
                  value={rentWithin3M}
                  onChange={(e) => setRentWithin3M(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Marketing Authorization (pts)</label>
                <input
                  type="number"
                  value={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Exclusive Mandate Signed (pts)</label>
                <input
                  type="number"
                  value={mandateObtained}
                  onChange={(e) => setMandateObtained(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Save Scoring Rules
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Data Export & Reset */}
        <div className="space-y-5">
          {/* Data Export Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Full Database</span>
            </h2>
            <p className="text-xs text-slate-500">
              Download your entire 5,000+ record owner database including phone numbers, qualification scores, and notes in clean Excel / CSV format.
            </p>

            <button
              onClick={handleExport}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download Clean CSV ({owners.length} Owners)</span>
            </button>
          </div>

          {/* Privacy & Zero-Inference Compliance */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Lock className="h-4 w-4 text-amber-600" />
              <span>Zero-Inference Core Mandate</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              This CRM enforces strict separation between owner contact records and intent pipelines. An owner is never marked as a seller or landlord without explicit verification during telecaller qualification.
            </p>
          </div>

          {/* Reset Demo Data */}
          <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3">
            <h2 className="text-sm font-bold text-rose-950 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Reset Demo Database</span>
            </h2>
            <p className="text-xs text-rose-800">
              Replaces existing records with the initial benchmark dataset of Prestige properties in Bengaluru.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Reset CRM database to fresh initial Prestige demo data?')) {
                  resetToDemoData();
                }
              }}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Reset to Factory Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
