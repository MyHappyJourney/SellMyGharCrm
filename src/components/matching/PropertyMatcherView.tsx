import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Home, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Phone, 
  MessageSquare, 
  ArrowRight,
  Filter,
  UserCheck,
  Users
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Owner, Buyer, Tenant, PropertyListing } from '../../types';

interface PropertyMatcherViewProps {
  onSelectOwner: (ownerId: string) => void;
}

export const PropertyMatcherView: React.FC<PropertyMatcherViewProps> = ({ onSelectOwner }) => {
  const { buyers, tenants, owners, listings, currentUser, addActivity } = useCrm();

  const [matchMode, setMatchMode] = useState<'Buyers' | 'Tenants'>('Buyers');
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(buyers[0]?.id || '');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '');

  const activeBuyer = buyers.find(b => b.id === selectedBuyerId);
  const activeTenant = tenants.find(t => t.id === selectedTenantId);

  // Compute matches for Buyer (Resale)
  const getBuyerMatches = (buyer: Buyer) => {
    return owners
      .filter(o => {
        // Must have resale intent or active sale lead
        if (!o.saleIntent || o.saleIntent === 'Not Interested') return false;
        return true;
      })
      .map(owner => {
        let score = 0;
        const reasons: string[] = [];

        // Project match
        const buyerProjects = Array.isArray(buyer.preferredProjects) 
          ? buyer.preferredProjects 
          : buyer.preferredProject 
            ? [buyer.preferredProject] 
            : [];
        const projectMatch = buyerProjects.length === 0 || buyerProjects.some(p => 
          owner.project.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(owner.project.toLowerCase())
        );
        if (projectMatch) {
          score += 40;
          reasons.push(`Matched Project: ${owner.project}`);
        }

        // BHK match
        const buyerBhks = Array.isArray(buyer.preferredBhk) 
          ? buyer.preferredBhk 
          : buyer.preferredBhk 
            ? [buyer.preferredBhk] 
            : [];
        const bhkMatch = buyerBhks.length === 0 || buyerBhks.some(b => 
          owner.bhk.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(owner.bhk.toLowerCase())
        );
        if (bhkMatch) {
          score += 30;
          reasons.push(`Exact BHK: ${owner.bhk}`);
        }

        // Budget match
        const price = owner.saleInfo?.expectedPrice || 20000000;
        const bMin = buyer.budgetMin || 0;
        const bMax = buyer.budgetMax || 50000000;
        if (price >= bMin * 0.85 && price <= bMax * 1.15) {
          score += 30;
          reasons.push(`Budget Fit: ₹${(price / 10000000).toFixed(2)} Cr (Budget: ₹${(bMin/10000000).toFixed(2)}-₹${(bMax/10000000).toFixed(2)} Cr)`);
        }

        return {
          owner,
          score,
          reasons,
          price
        };
      })
      .filter(m => m.score >= 30)
      .sort((a, b) => b.score - a.score);
  };

  // Compute matches for Tenant (Rental)
  const getTenantMatches = (tenant: Tenant) => {
    return owners
      .filter(o => {
        if (!o.rentalIntent || o.rentalIntent === 'Not Interested') return false;
        return true;
      })
      .map(owner => {
        let score = 0;
        const reasons: string[] = [];

        // Project match
        const tenantProjects = Array.isArray(tenant.preferredProjects) 
          ? tenant.preferredProjects 
          : tenant.preferredProject 
            ? [tenant.preferredProject] 
            : [];
        const projectMatch = tenantProjects.length === 0 || tenantProjects.some(p => 
          owner.project.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(owner.project.toLowerCase())
        );
        if (projectMatch) {
          score += 40;
          reasons.push(`Matched Project: ${owner.project}`);
        }

        // BHK match
        const tenantBhks = Array.isArray(tenant.preferredBhk) 
          ? tenant.preferredBhk 
          : tenant.preferredBhk 
            ? [tenant.preferredBhk] 
            : tenant.bhk 
              ? [tenant.bhk] 
              : [];
        const bhkMatch = tenantBhks.length === 0 || tenantBhks.some(b => 
          owner.bhk.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(owner.bhk.toLowerCase())
        );
        if (bhkMatch) {
          score += 30;
          reasons.push(`Exact BHK: ${owner.bhk}`);
        }

        // Rent match
        const rent = owner.rentalInfo?.expectedMonthlyRent || 50000;
        const maxBudget = tenant.budgetMax || tenant.budget || 100000;
        if (rent <= maxBudget * 1.15) {
          score += 30;
          reasons.push(`Rent Fit: ₹${rent.toLocaleString()}/mo (Max: ₹${maxBudget.toLocaleString()})`);
        }

        return {
          owner,
          score,
          reasons,
          rent
        };
      })
      .filter(m => m.score >= 30)
      .sort((a, b) => b.score - a.score);
  };

  const buyerMatches = activeBuyer ? getBuyerMatches(activeBuyer) : [];
  const tenantMatches = activeTenant ? getTenantMatches(activeTenant) : [];

  const handleShareOnWhatsApp = (targetName: string, targetPhone: string, owner: Owner) => {
    const text = encodeURIComponent(
      `Hello ${targetName}, we found a matching Prestige unit for you:\n\n` +
      `🏢 Project: ${owner.project}\n` +
      `🚪 Unit: ${owner.flatNumber} (${owner.bhk})\n` +
      `📐 SBUA: ${owner.superBuiltUpArea || '1500'} sq.ft\n` +
      `💰 Expected: ${owner.saleInfo?.expectedPrice ? '₹' + (owner.saleInfo.expectedPrice / 10000000).toFixed(2) + ' Cr' : '₹' + (owner.rentalInfo?.expectedMonthlyRent || 50000).toLocaleString() + '/mo'}\n\n` +
      `Would you like to schedule a site visit this weekend? - SellMyGhar Prestige Team`
    );
    window.open(`https://wa.me/${targetPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Smart Property & Demand Matcher</h1>
            <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-300">
              AI Powered Match Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantly pair qualified buyers and tenants with verified Prestige owner inventory.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-100 text-xs">
          <button
            onClick={() => setMatchMode('Buyers')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              matchMode === 'Buyers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>Match Buyers (Resale)</span>
          </button>
          <button
            onClick={() => setMatchMode('Tenants')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              matchMode === 'Tenants' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            <span>Match Tenants (Rental)</span>
          </button>
        </div>
      </div>

      {/* Selector Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {matchMode === 'Buyers' ? (
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">Select Qualified Buyer Requirement:</label>
            <select
              value={selectedBuyerId}
              onChange={(e) => setSelectedBuyerId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
            >
              {buyers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.phone}) — Target: {b.preferredProjects.join(', ')} • {b.preferredBhk.join(', ')} • Budget: ₹{(b.budgetMin/10000000).toFixed(2)}-₹{(b.budgetMax/10000000).toFixed(2)} Cr
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">Select Screened Tenant Requirement:</label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.companyName || 'Verified'}) — Target: {t.preferredProjects.join(', ')} • {t.preferredBhk.join(', ')} • Max Rent: ₹{t.budgetMax.toLocaleString()}/mo
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Match Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>
              {matchMode === 'Buyers'
                ? `Matched Resale Units for ${activeBuyer?.name} (${buyerMatches.length} Matches Found)`
                : `Matched Rental Units for ${activeTenant?.name} (${tenantMatches.length} Matches Found)`}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchMode === 'Buyers' ? (
            buyerMatches.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                No matching resale inventory in the database. Qualify more owners in these projects!
              </div>
            ) : (
              buyerMatches.map((m, idx) => (
                <div key={m.owner.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectOwner(m.owner.id)}
                          className="text-base font-bold text-slate-900 hover:text-amber-700 hover:underline text-left"
                        >
                          {m.owner.name}
                        </button>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          {m.score}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {m.owner.project} • Unit {m.owner.flatNumber} ({m.owner.bhk})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">Expected Price</span>
                      <p className="text-sm font-black text-slate-900">
                        ₹{(m.price / 10000000).toFixed(2)} Cr
                      </p>
                    </div>
                  </div>

                  {/* Match Badges */}
                  <div className="space-y-1">
                    {m.reasons.map((r, rIdx) => (
                      <p key={rIdx} className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectOwner(m.owner.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Owner Details →
                    </button>

                    {activeBuyer && (
                      <button
                        onClick={() => handleShareOnWhatsApp(activeBuyer.name, activeBuyer.phone, m.owner)}
                        className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-2xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Send WhatsApp Pitch to Buyer</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            tenantMatches.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                No matching rental units in the database. Qualify more owners in these projects!
              </div>
            ) : (
              tenantMatches.map((m, idx) => (
                <div key={m.owner.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectOwner(m.owner.id)}
                          className="text-base font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left"
                        >
                          {m.owner.name}
                        </button>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          {m.score}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {m.owner.project} • Unit {m.owner.flatNumber} ({m.owner.bhk})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">Monthly Rent</span>
                      <p className="text-sm font-black text-emerald-950">
                        ₹{m.rent.toLocaleString()}/mo
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {m.reasons.map((r, rIdx) => (
                      <p key={rIdx} className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectOwner(m.owner.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Owner Details →
                    </button>

                    {activeTenant && (
                      <button
                        onClick={() => handleShareOnWhatsApp(activeTenant.name, activeTenant.phone, m.owner)}
                        className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-2xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Send WhatsApp Pitch to Tenant</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
