import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Building, 
  Home, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  Edit3, 
  ShieldAlert, 
  UserCheck, 
  DollarSign,
  TrendingUp,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Owner, Activity, FollowUpTask } from '../../types';

interface OwnerProfileViewProps {
  ownerId: string;
  onBack: () => void;
  onOpenQualify: (owner: Owner) => void;
}

export const OwnerProfileView: React.FC<OwnerProfileViewProps> = ({
  ownerId,
  onBack,
  onOpenQualify
}) => {
  const { 
    owners, 
    activities, 
    followUps, 
    listings, 
    addActivity, 
    addFollowUp, 
    updateOwner, 
    currentUser 
  } = useCrm();

  const owner = owners.find(o => o.id === ownerId);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextActionType, setNextActionType] = useState<'Call' | 'WhatsApp' | 'Site Visit'>('Call');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const ownerActivities = activities.filter(a => a.ownerId === ownerId);
  const ownerFollowUps = followUps.filter(f => f.ownerId === ownerId);
  const ownerListing = listings.find(l => l.ownerId === ownerId);

  useEffect(() => {
    if (owner) {
      loadAiSummary(owner, ownerActivities, ownerFollowUps);
    }
  }, [ownerId]);

  const loadAiSummary = async (targetOwner: Owner, acts: Activity[], fols: FollowUpTask[]) => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/summarize-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: targetOwner,
          activities: acts,
          followUps: fols
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      }
    } catch (e) {
      console.error('Failed to load AI summary:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !owner) return;

    const now = new Date();
    addActivity({
      ownerId: owner.id,
      type: 'Note',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staff: currentUser.name,
      outcome: 'Interaction Note Added',
      notes: newNoteText,
      nextFollowUpDate: nextFollowUpDate || undefined,
      nextAction: nextFollowUpDate ? `${nextActionType}: ${newNoteText}` : undefined
    });

    setNewNoteText('');
    setNextFollowUpDate('');
  };

  if (!owner) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Owner not found.</p>
        <button onClick={onBack} className="mt-2 text-xs font-bold text-amber-700">← Return to Database</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Back Button & Top Action Strip */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Owners</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenQualify(owner)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            Edit Intent & Qualification
          </button>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center text-xl font-black shadow-xs">
              {owner.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl md:text-2xl font-black text-slate-900">{owner.name}</h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  owner.leadTemperature === 'HOT' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                  owner.leadTemperature === 'WARM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  owner.leadTemperature === 'COLD' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {owner.leadScore} pts ({owner.leadTemperature})
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {owner.propertyStatus}
                </span>
              </div>

              {owner.coOwner && (
                <p className="text-xs text-slate-500 mt-0.5">Co-Owner / Spouse: <strong className="text-slate-800">{owner.coOwner}</strong></p>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2">
                <span className="font-bold text-slate-900">{owner.flatNumber}</span>
                <span>•</span>
                <span>{owner.block}</span>
                <span>•</span>
                <span className="text-amber-800 font-bold">{owner.project}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{owner.bhk}</span>
                {owner.superBuiltUpArea && (
                  <>
                    <span>•</span>
                    <span>{owner.superBuiltUpArea} sq.ft</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${owner.primaryPhone}`}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-2xs"
            >
              <Phone className="h-4 w-4" />
              <span>Call ({owner.primaryPhone})</span>
            </a>
            <a
              href={`https://wa.me/${owner.primaryPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 font-bold text-xs rounded-xl flex items-center space-x-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Contact Numbers Row */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Mobile</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-mono font-bold text-slate-900">{owner.primaryPhone}</span>
              <button 
                onClick={() => handleCopy(owner.primaryPhone, 'primary')}
                className="text-slate-400 hover:text-slate-600"
                title="Copy phone"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {copiedField === 'primary' && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Alternate Numbers</span>
            <div className="font-mono text-slate-700 mt-0.5 space-y-0.5">
              {owner.alternatePhone1 && <p>Alt 1: {owner.alternatePhone1}</p>}
              {owner.alternatePhone2 && <p>Alt 2: {owner.alternatePhone2}</p>}
              {!owner.alternatePhone1 && !owner.alternatePhone2 && <p className="text-slate-400 italic">None logged</p>}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
            <p className="font-medium text-slate-800 truncate mt-0.5">{owner.email || 'No email provided'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Agent</span>
            <p className="font-bold text-slate-900 mt-0.5">{owner.assignedStaff || 'Unassigned'}</p>
          </div>
        </div>
      </div>

      {/* Grid: Details, AI Briefing, and Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Intent Details & Property Info */}
        <div className="space-y-4">
          {/* Resale Intent Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span>Resale Intent & Pricing</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                owner.saleIntent && owner.saleIntent !== 'Not Interested' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {owner.saleIntent || 'Not Interested'}
              </span>
            </div>

            {owner.saleIntent && owner.saleIntent !== 'Not Interested' ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Expected Price:</span>
                  <span className="font-bold text-slate-900">
                    {owner.saleInfo?.expectedPrice ? `₹${(owner.saleInfo.expectedPrice / 10000000).toFixed(2)} Cr` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Marketing Authorized:</span>
                  <span className="font-semibold text-slate-800">
                    {owner.saleInfo?.saleMarketingAuthorization ? '✓ Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Exclusive Mandate:</span>
                  <span className="font-semibold text-slate-800">
                    {owner.saleInfo?.exclusiveMandate ? '✓ Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Key Access:</span>
                  <span className="font-semibold text-slate-800">{owner.saleInfo?.keyAvailability || 'Owner Available'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No resale intent confirmed by owner.</p>
            )}
          </div>

          {/* Rental Intent Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Home className="h-4 w-4 text-emerald-600" />
                <span>Rental Intent & Terms</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                owner.rentalIntent && owner.rentalIntent !== 'Not Interested' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {owner.rentalIntent || 'Not Interested'}
              </span>
            </div>

            {owner.rentalIntent && owner.rentalIntent !== 'Not Interested' ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Expected Monthly Rent:</span>
                  <span className="font-bold text-emerald-950">
                    {owner.rentalInfo?.expectedMonthlyRent ? `₹${owner.rentalInfo.expectedMonthlyRent.toLocaleString('en-IN')}/mo` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Deposit:</span>
                  <span className="font-semibold text-slate-800">
                    {owner.rentalInfo?.securityDeposit ? `₹${owner.rentalInfo.securityDeposit.toLocaleString('en-IN')}` : 'Standard 6 mos'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tenant Preference:</span>
                  <span className="font-semibold text-slate-800">{owner.rentalInfo?.tenantPreference || 'Family'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Marketing Authorized:</span>
                  <span className="font-semibold text-slate-800">
                    {owner.rentalInfo?.rentalMarketingAuthorization ? '✓ Yes' : 'No'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No rental intent confirmed by owner.</p>
            )}
          </div>

          {/* AI Executive Briefing */}
          <div className="bg-linear-to-br from-amber-50/60 to-orange-50/60 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-900">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">AI Relationship Summary</h3>
              </div>
              <button
                onClick={() => loadAiSummary(owner, ownerActivities, ownerFollowUps)}
                className="text-[10px] text-amber-800 hover:underline font-semibold"
              >
                Refresh
              </button>
            </div>

            {loadingAi ? (
              <p className="text-xs text-amber-800 italic animate-pulse">Generating briefing from interaction logs...</p>
            ) : aiSummary ? (
              <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                {aiSummary}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No interaction briefing available yet.</p>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Activity Timeline & Log New Interaction */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Interaction Logger Form */}
          <form onSubmit={handleAddNote} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Log Call Interaction / Observation</h3>
            <textarea
              rows={2}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="e.g. Spoke to owner. He is looking for corporate tenants paying 55k+. Keys available with security for viewing."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-[11px] text-slate-500 font-semibold">Schedule Follow-up:</span>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Save Interaction Log
              </button>
            </div>
          </form>

          {/* Activity Timeline List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Complete Interaction & Audit History ({ownerActivities.length})
            </h3>

            <div className="space-y-3">
              {ownerActivities.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No interactions recorded yet. Use the logger above or qualify the owner.
                </div>
              ) : (
                ownerActivities.map((act) => (
                  <div key={act.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{act.outcome}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.2 rounded">
                          {act.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{act.date} {act.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mt-1">{act.notes}</p>
                    <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Logged by: <strong className="text-slate-600">{act.staff}</strong></span>
                      {act.nextFollowUpDate && (
                        <span className="text-amber-700 font-bold">Follow-Up Scheduled: {act.nextFollowUpDate}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
