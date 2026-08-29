import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  X, 
  CheckCircle2, 
  Flame, 
  Calendar, 
  Clock, 
  DollarSign, 
  Home, 
  TrendingUp, 
  UserCheck, 
  ShieldAlert, 
  Sparkles,
  Info
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Owner, PropertyStatus, IntentTimeline } from '../../types';
import { calculateLeadScore } from '../../utils/scoring';

interface OwnerQualificationModalProps {
  owner: Owner | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerQualificationModal: React.FC<OwnerQualificationModalProps> = ({
  owner,
  isOpen,
  onClose
}) => {
  const { qualifyOwner, addActivity, currentUser, scoringRules } = useCrm();

  if (!isOpen || !owner) return null;

  // Form States
  const [callOutcome, setCallOutcome] = useState<string>('Connected & Discussed');
  const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>(owner.propertyStatus || 'Unknown');
  const [isStillOwner, setIsStillOwner] = useState<'Yes' | 'No' | 'Representative'>('Yes');

  // Sale Fields
  const [hasSaleIntent, setHasSaleIntent] = useState<boolean>(
    owner.saleIntent ? owner.saleIntent !== 'Not Interested' : false
  );
  const [saleIntent, setSaleIntent] = useState<IntentTimeline>(owner.saleIntent || 'Not Interested');
  const [expectedPrice, setExpectedPrice] = useState<number | string>(owner.saleInfo?.expectedPrice || '');
  const [minPrice, setMinPrice] = useState<number | string>(owner.saleInfo?.minimumAcceptablePrice || '');
  const [saleMarketingAuth, setSaleMarketingAuth] = useState<boolean>(owner.saleInfo?.saleMarketingAuthorization || false);
  const [exclusiveMandate, setExclusiveMandate] = useState<boolean>(owner.saleInfo?.exclusiveMandate || false);
  const [keyAvailability, setKeyAvailability] = useState<string>(owner.saleInfo?.keyAvailability || 'Owner Available');

  // Rental Fields
  const [hasRentalIntent, setHasRentalIntent] = useState<boolean>(
    owner.rentalIntent ? owner.rentalIntent !== 'Not Interested' : false
  );
  const [rentalIntent, setRentalIntent] = useState<IntentTimeline>(owner.rentalIntent || 'Not Interested');
  const [expectedRent, setExpectedRent] = useState<number | string>(owner.rentalInfo?.expectedMonthlyRent || '');
  const [deposit, setDeposit] = useState<number | string>(owner.rentalInfo?.securityDeposit || '');
  const [tenantPref, setTenantPref] = useState<'Family' | 'Bachelors' | 'Company Lease' | 'Any'>(
    owner.rentalInfo?.tenantPreference || 'Family'
  );
  const [rentalMarketingAuth, setRentalMarketingAuth] = useState<boolean>(owner.rentalInfo?.rentalMarketingAuthorization || false);

  // Notes & Next Follow-up
  const [notes, setNotes] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState<string>('11:00 AM');
  const [nextActionType, setNextActionType] = useState<'Call' | 'WhatsApp' | 'Site Visit' | 'Send Agreement'>('Call');

  // Opt-out / DND
  const [doNotContact, setDoNotContact] = useState<boolean>(owner.consent?.doNotContact || false);

  // Live Score calculation
  const previewData: Partial<Owner> = {
    ...owner,
    propertyStatus,
    saleIntent: hasSaleIntent ? saleIntent : 'Not Interested',
    rentalIntent: hasRentalIntent ? rentalIntent : 'Not Interested',
    saleInfo: {
      expectedPrice: Number(expectedPrice) || 0,
      minimumAcceptablePrice: Number(minPrice) || undefined,
      saleMarketingAuthorization: saleMarketingAuth,
      exclusiveMandate,
      keyAvailability
    },
    rentalInfo: {
      expectedMonthlyRent: Number(expectedRent) || 0,
      securityDeposit: Number(deposit) || undefined,
      tenantPreference: tenantPref,
      rentalMarketingAuthorization: rentalMarketingAuth
    }
  };

  const scoreResult = calculateLeadScore(previewData, scoringRules, {
    marketingAgreed: saleMarketingAuth || rentalMarketingAuth,
    priceProvided: Boolean(Number(expectedPrice) > 0 || Number(expectedRent) > 0),
    photosAvailable: false,
    inspectionAvailable: keyAvailability === 'Keys with Security' || keyAvailability === 'Owner Available',
    mandateObtained: exclusiveMandate
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    qualifyOwner(owner.id, {
      propertyStatus,
      saleIntent: hasSaleIntent ? saleIntent : 'Not Interested',
      rentalIntent: hasRentalIntent ? rentalIntent : 'Not Interested',
      saleInfo: hasSaleIntent ? {
        expectedPrice: Number(expectedPrice) || 0,
        minimumAcceptablePrice: Number(minPrice) || undefined,
        saleMarketingAuthorization: saleMarketingAuth,
        exclusiveMandate,
        keyAvailability
      } : undefined,
      rentalInfo: hasRentalIntent ? {
        expectedMonthlyRent: Number(expectedRent) || 0,
        securityDeposit: Number(deposit) || undefined,
        tenantPreference: tenantPref,
        rentalMarketingAuthorization: rentalMarketingAuth
      } : undefined,
      notes
    });

    // Log Activity & Followup
    const now = new Date();
    addActivity({
      ownerId: owner.id,
      type: 'Call',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staff: currentUser.name,
      outcome: `Qualified: ${propertyStatus} | Score: ${scoreResult.score} (${scoreResult.temperature})`,
      notes: `${callOutcome}. ${notes}`,
      nextFollowUpDate: nextFollowUpDate || undefined,
      nextAction: nextFollowUpDate ? `${nextActionType}: ${notes || 'Follow up on discussion'}` : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Owner Intent Qualification Workflow</h2>
              <p className="text-xs text-slate-300">
                {owner.name} • {owner.project} • {owner.flatNumber} ({owner.bhk})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Score Preview Ribbon */}
        <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Calculated Lead Score:</span>
            <span className="text-sm font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs">
              {scoreResult.score} pts
            </span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              scoreResult.temperature === 'HOT' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
              scoreResult.temperature === 'WARM' ? 'bg-amber-200 text-amber-900 border border-amber-400' :
              scoreResult.temperature === 'COLD' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {scoreResult.temperature} LEAD
            </span>
          </div>
          <span className="text-[11px] text-amber-900 italic hidden sm:inline">
            Zero inference • Intent calculated strictly from verified answers
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Step 1: Call Outcome & Ownership Confirmation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Call Disposition & Ownership Check</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Call Disposition / Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Connected & Discussed">✓ Connected & Discussed</option>
                  <option value="Busy / Call Later">⏳ Busy / Call Later</option>
                  <option value="Did Not Answer">📵 Did Not Answer</option>
                  <option value="Switched Off / Out of Reach">🚫 Switched Off / Out of Reach</option>
                  <option value="Wrong Number / Number Changed">❌ Wrong Number / Number Changed</option>
                  <option value="Owner Requested Not To Call (DND)">🛑 Owner Requested DND</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Is Contact Person the Property Owner?</label>
                <select
                  value={isStillOwner}
                  onChange={(e) => setIsStillOwner(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Yes">Yes, confirmed owner</option>
                  <option value="Representative">Representative / Caretaker / Relative</option>
                  <option value="No">No, sold already / never owned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Property Status */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Current Property Status (Confirmed by Owner)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Self Occupied', label: 'Self Occupied', desc: 'Owner stays here' },
                { id: 'Rented', label: 'Currently Rented', desc: 'Tenants living' },
                { id: 'Vacant', label: 'Vacant / Empty', desc: 'Ready for possession' },
                { id: 'Planning to Sell', label: 'Planning to Sell', desc: 'Confirmed sale intent' },
                { id: 'Planning to Rent', label: 'Planning to Rent', desc: 'Confirmed rental intent' },
                { id: 'Considering Both', label: 'Considering Both', desc: 'Open to sell or rent' },
                { id: 'Sold', label: 'Sold via Other', desc: 'No longer available' },
                { id: 'Unknown', label: 'Unknown / Pending', desc: 'Yet to confirm' }
              ].map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => {
                    setPropertyStatus(st.id as PropertyStatus);
                    if (st.id === 'Planning to Sell' || st.id === 'Considering Both') setHasSaleIntent(true);
                    if (st.id === 'Planning to Rent' || st.id === 'Considering Both') setHasRentalIntent(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    propertyStatus === st.id
                      ? 'border-amber-600 bg-amber-50/80 font-bold text-amber-950 ring-1 ring-amber-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="text-xs">{st.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-normal">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Resale Qualification Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="h-4 w-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Resale / Selling Details</span>
              </h3>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSaleIntent}
                  onChange={(e) => {
                    setHasSaleIntent(e.target.checked);
                    if (!e.target.checked) setSaleIntent('Not Interested');
                    else if (saleIntent === 'Not Interested') setSaleIntent('Immediate');
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-amber-900">Owner Wants to Sell</span>
              </label>
            </div>

            {hasSaleIntent && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sale Timeline</label>
                    <select
                      value={saleIntent}
                      onChange={(e) => setSaleIntent(e.target.value as IntentTimeline)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-amber-900"
                    >
                      <option value="Immediate">🔥 Immediate (Ready Now)</option>
                      <option value="Within 3 Months">⚡ Within 3 Months</option>
                      <option value="3–6 Months">📅 3–6 Months</option>
                      <option value="6–12 Months">🕒 6–12 Months</option>
                      <option value="Considering">🤔 Considering Price</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Expected Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 21500000"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                    {Number(expectedPrice) > 0 && (
                      <span className="text-[10px] text-amber-800 font-medium mt-0.5 block">
                        ₹{(Number(expectedPrice) / 10000000).toFixed(2)} Crores
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Minimum Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 20000000"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Authorizations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60">
                  <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saleMarketingAuth}
                      onChange={(e) => setSaleMarketingAuth(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span className="font-semibold text-slate-800">Marketing Agreement (+25 pts)</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exclusiveMandate}
                      onChange={(e) => setExclusiveMandate(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span className="font-semibold text-slate-800">Exclusive Mandate (+30 pts)</span>
                  </label>

                  <div>
                    <select
                      value={keyAvailability}
                      onChange={(e) => setKeyAvailability(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-medium text-slate-800"
                    >
                      <option value="Owner Available">Owner Available for Visits</option>
                      <option value="Keys with Security">Keys with Security (+10 pts)</option>
                      <option value="Tenant Residing">Tenant Residing (Need Notice)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Rental Qualification Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                <span>Rental / Leasing Details</span>
              </h3>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRentalIntent}
                  onChange={(e) => {
                    setHasRentalIntent(e.target.checked);
                    if (!e.target.checked) setRentalIntent('Not Interested');
                    else if (rentalIntent === 'Not Interested') setRentalIntent('Immediate');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-emerald-900">Owner Wants to Rent Out</span>
              </label>
            </div>

            {hasRentalIntent && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Rental Timeline</label>
                    <select
                      value={rentalIntent}
                      onChange={(e) => setRentalIntent(e.target.value as IntentTimeline)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-900"
                    >
                      <option value="Immediate">🔥 Immediate (Available Now)</option>
                      <option value="Within 3 Months">⚡ Within 3 Months</option>
                      <option value="3–6 Months">📅 3–6 Months</option>
                      <option value="6–12 Months">🕒 6–12 Months</option>
                      <option value="Considering">🤔 Considering</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 55000"
                      value={expectedRent}
                      onChange={(e) => setExpectedRent(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Deposit (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 300000"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tenant Preference</label>
                    <select
                      value={tenantPref}
                      onChange={(e) => setTenantPref(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                    >
                      <option value="Family">Family Only</option>
                      <option value="Bachelors">Bachelors OK</option>
                      <option value="Company Lease">Company Lease</option>
                      <option value="Any">Any Verified Tenant</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60">
                  <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-emerald-200 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={rentalMarketingAuth}
                      onChange={(e) => setRentalMarketingAuth(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-semibold text-slate-800">Owner Authorizes Tenant Screening & Marketing (+25 pts)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Step 5: Follow-up & Call Notes */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="h-4 w-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">5</span>
              <span>Next Follow-up & Conversation Notes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Follow-Up Time</label>
                <input
                  type="text"
                  value={nextFollowUpTime}
                  onChange={(e) => setNextFollowUpTime(e.target.value)}
                  placeholder="e.g. 11:30 AM"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Next Action Type</label>
                <select
                  value={nextActionType}
                  onChange={(e) => setNextActionType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  <option value="Call">Phone Call</option>
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="Site Visit">Site Inspection / Photo Visit</option>
                  <option value="Send Agreement">Send Marketing Mandate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Conversation Notes / Owner Remarks</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Owner willing to sell if price is above 2.15 Cr. Rented till May 2026. Keys can be shown with 1 day prior notice."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center space-x-2 px-6 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all shadow-md active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Save Qualification & Update Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
