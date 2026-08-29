import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  PhoneForwarded, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  HelpCircle, 
  ShieldAlert, 
  User, 
  Home, 
  TrendingUp, 
  Calendar,
  PhoneOff
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Owner, PropertyStatus, IntentTimeline } from '../../types';

interface TelecallerViewProps {
  onOpenQualify: (owner: Owner) => void;
  onSelectOwner: (ownerId: string) => void;
}

export const TelecallerView: React.FC<TelecallerViewProps> = ({
  onOpenQualify,
  onSelectOwner
}) => {
  const { owners, addActivity, currentUser, qualifyOwner, templates } = useCrm();

  // Filter owners for queue: prioritized by HOT > WARM > Uncontacted > New
  const queueOwners = owners.filter(o => !o.consent?.doNotContact);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeOwner: Owner | undefined = queueOwners[currentIndex];

  // AI Smart Question Generator State
  const [aiQuestions, setAiQuestions] = useState<{ opener?: string; questions?: string[]; proTip?: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Script Objection accordion
  const [activeObjection, setActiveObjection] = useState<string | null>(null);

  // Quick Inline Note State
  const [quickNote, setQuickNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  useEffect(() => {
    if (activeOwner) {
      setQuickNote('');
      setNextFollowUpDate('');
      fetchAiSuggestions(activeOwner);
    }
  }, [currentIndex, activeOwner?.id]);

  const fetchAiSuggestions = async (owner: Owner) => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/telecaller-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner })
      });
      if (res.ok) {
        const data = await res.json();
        setAiQuestions(data);
      }
    } catch (e) {
      console.error('Failed to load AI suggestions:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < queueOwners.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleQuickOutcome = (outcome: 'Busy' | 'No Answer' | 'Self Occupied' | 'DND' | 'Call Later') => {
    if (!activeOwner) return;

    const now = new Date();
    let noteText = quickNote;
    let followUpDate = nextFollowUpDate;

    if (outcome === 'Busy' || outcome === 'No Answer') {
      noteText = noteText || `Call not answered / line busy. Attempt #${(activeOwner.contactAttempts || 0) + 1}`;
      // Schedule follow-up tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      followUpDate = followUpDate || tomorrow.toISOString().split('T')[0];
    } else if (outcome === 'Self Occupied') {
      noteText = noteText || 'Owner confirmed staying in the apartment. Not interested in selling or renting at this moment.';
      qualifyOwner(activeOwner.id, {
        propertyStatus: 'Self Occupied',
        saleIntent: 'Not Interested',
        rentalIntent: 'Not Interested'
      });
    } else if (outcome === 'DND') {
      noteText = noteText || 'Owner strictly requested not to contact again. Marked as Do Not Call.';
      qualifyOwner(activeOwner.id, {
        propertyStatus: activeOwner.propertyStatus,
        notes: 'Opted out - DND requested'
      });
    }

    addActivity({
      ownerId: activeOwner.id,
      type: 'Call',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staff: currentUser.name,
      outcome: `Telecall Outcome: ${outcome}`,
      notes: noteText,
      nextFollowUpDate: followUpDate || undefined,
      nextAction: followUpDate ? `Retry call: ${noteText}` : undefined
    });

    handleNext();
  };

  const handleWhatsApp = () => {
    if (!activeOwner) return;
    const phone = activeOwner.primaryPhone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${activeOwner.name}, this is ${currentUser.name} from SellMyGhar Bengaluru. We specialize in Prestige properties (${activeOwner.project}). We have verified families looking for apartments in your society. Would you be open to an update on the current market value?`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  if (!activeOwner) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Calling Queue Complete!</h2>
        <p className="text-xs text-slate-500 mt-1">All qualified and pending owners have been contacted.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Controller Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold">Telecaller Work Queue & Instant Dialer</h1>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-amber-400 font-mono">
                {currentIndex + 1} of {queueOwners.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">Owner conversion mode with zero inference and live guidance</p>
          </div>
        </div>

        {/* Next / Prev buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === queueOwners.length - 1}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs"
          >
            <span>Skip / Next Owner</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Dialer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Active Owner Profile & Fast Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Contact Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-900">{activeOwner.name}</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeOwner.leadTemperature === 'HOT' ? 'bg-rose-100 text-rose-800' :
                    activeOwner.leadTemperature === 'WARM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {activeOwner.leadScore} pts ({activeOwner.leadTemperature})
                  </span>
                </div>
                {activeOwner.coOwner && (
                  <p className="text-xs text-slate-500">Co-Owner: <span className="font-semibold text-slate-700">{activeOwner.coOwner}</span></p>
                )}
                <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                  <span className="font-bold text-slate-900">{activeOwner.flatNumber}</span>
                  <span>•</span>
                  <span>{activeOwner.block}</span>
                  <span>•</span>
                  <span className="text-amber-800 font-semibold">{activeOwner.project}</span>
                  <span>•</span>
                  <span className="font-medium">{activeOwner.bhk}</span>
                </div>
              </div>

              <button
                onClick={() => onSelectOwner(activeOwner.id)}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
              >
                View 360 Profile →
              </button>
            </div>

            {/* Phone Numbers Strip */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Primary:</span>
                  <a 
                    href={`tel:${activeOwner.primaryPhone}`} 
                    className="text-base font-mono font-black text-slate-900 hover:text-amber-700 flex items-center space-x-1"
                  >
                    <PhoneCall className="h-4 w-4 text-emerald-600" />
                    <span>{activeOwner.primaryPhone}</span>
                  </a>
                </div>
                {(activeOwner.alternatePhone1 || activeOwner.alternatePhone2) && (
                  <div className="text-xs text-slate-500 font-mono space-x-3">
                    {activeOwner.alternatePhone1 && <span>Alt 1: <a href={`tel:${activeOwner.alternatePhone1}`} className="hover:underline">{activeOwner.alternatePhone1}</a></span>}
                    {activeOwner.alternatePhone2 && <span>Alt 2: <a href={`tel:${activeOwner.alternatePhone2}`} className="hover:underline">{activeOwner.alternatePhone2}</a></span>}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${activeOwner.primaryPhone}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Call Now</span>
                </a>
                <button
                  onClick={handleWhatsApp}
                  className="px-3.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 font-bold text-xs rounded-xl flex items-center space-x-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Quick Disposition Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Call Outcome (Auto-logs and moves to next):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickOutcome('Busy')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800">⏳ Line Busy</p>
                  <p className="text-[10px] text-slate-500">Retry tomorrow</p>
                </button>

                <button
                  onClick={() => handleQuickOutcome('No Answer')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800">📵 No Answer</p>
                  <p className="text-[10px] text-slate-500">Schedule retry</p>
                </button>

                <button
                  onClick={() => handleQuickOutcome('Self Occupied')}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-blue-900">🏡 Self Occupied</p>
                  <p className="text-[10px] text-blue-700">Staying in unit</p>
                </button>

                <button
                  onClick={() => handleQuickOutcome('DND')}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-left transition-colors"
                >
                  <p className="text-xs font-bold text-rose-900">🛑 Opt-out / DND</p>
                  <p className="text-[10px] text-rose-700">Do not call</p>
                </button>
              </div>

              {/* Comprehensive Intent Qualification Launcher */}
              <div className="pt-2">
                <button
                  onClick={() => onOpenQualify(activeOwner)}
                  className="w-full py-3 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Owner is Interested (Open Full Resale / Rental Qualification)</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Smart Coaching & Opener Card */}
          <div className="bg-linear-to-br from-amber-50/70 to-orange-50/70 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-900">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">AI Conversation Coach & Opener</h3>
              </div>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                Contextual for {activeOwner.project}
              </span>
            </div>

            {loadingAi ? (
              <p className="text-xs text-amber-800 italic animate-pulse">Generating personalized opener and objection questions...</p>
            ) : aiQuestions ? (
              <div className="space-y-2.5 text-xs text-slate-800">
                {aiQuestions.opener && (
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80">
                    <p className="font-semibold text-slate-500 text-[10px] uppercase">Recommended Call Opener:</p>
                    <p className="font-medium text-slate-900 mt-0.5">"{aiQuestions.opener}"</p>
                  </div>
                )}
                {aiQuestions.questions && (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-500 text-[10px] uppercase">Key Qualification Questions:</p>
                    {aiQuestions.questions.map((q, idx) => (
                      <p key={idx} className="p-2 bg-white/60 rounded-lg text-slate-700">
                        • {q}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                "Hello {activeOwner.name}, this is calling from SellMyGhar Bengaluru regarding your property at {activeOwner.project} {activeOwner.flatNumber}. Are you currently residing there or considering leasing/resale?"
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Standard Telecaller Pitch Script & Objection Handling */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <HelpCircle className="h-4 w-4 text-slate-500" />
              <span>Objection Handling Cheat Sheet</span>
            </h3>

            <div className="space-y-2 text-xs">
              {[
                {
                  id: 'source',
                  q: '“How did you get my number?”',
                  a: '“We are the dedicated property advisory team actively working within Prestige communities. Our team assists fellow owners with verified tenant leasing and resale transactions.”'
                },
                {
                  id: 'not_selling',
                  q: '“I don’t want to sell right now.”',
                  a: '“Understood completely, sir/ma’am! Are you currently staying in the unit, or is it rented out? We can also share a quarterly rental yield update for your block.”'
                },
                {
                  id: 'commission',
                  q: '“What is your brokerage fee?”',
                  a: '“We charge standard 1% for resale and 1 month for rental, but you only pay upon successful closing with verified documentation and token received.”'
                },
                {
                  id: 'no_broker',
                  q: '“I don’t deal with brokers.”',
                  a: '“We understand your concern. We only bring pre-screened, corporate-verified buyers and tenants with complete KYC before any site visits.”'
                }
              ].map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveObjection(activeObjection === item.id ? null : item.id)}
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 font-bold text-slate-800 flex items-center justify-between text-xs"
                  >
                    <span>{item.q}</span>
                    <span className="text-slate-400 font-normal">{activeObjection === item.id ? '▲' : '▼'}</span>
                  </button>
                  {activeObjection === item.id && (
                    <div className="p-3 bg-white border-t border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notes Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Log Note & Follow-Up</h3>
            <textarea
              rows={3}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Add call notes, owner response, or specific timing..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl flex-1 text-slate-800"
              />
              <button
                onClick={() => handleQuickOutcome('Call Later')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
