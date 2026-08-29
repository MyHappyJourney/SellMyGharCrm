import React, { useState } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Building, 
  ChevronRight, 
  DollarSign, 
  User, 
  Phone, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Filter,
  Calendar
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { SaleLead, SalesPipelineStage, Owner } from '../../types';

interface SalesPipelineViewProps {
  onSelectOwner: (ownerId: string) => void;
  onOpenAddOwner: () => void;
}

const PIPELINE_STAGES: { id: SalesPipelineStage; label: string; color: string }[] = [
  { id: 'Interested', label: '1. Qualified Intent', color: 'border-slate-300 bg-slate-50' },
  { id: 'Mandate/Authorization Obtained', label: '2. Mandate / Agreement', color: 'border-amber-300 bg-amber-50/50' },
  { id: 'Property Inspection Done', label: '3. Inspected & Photos', color: 'border-blue-300 bg-blue-50/50' },
  { id: 'Listing Created', label: '4. Active Listing', color: 'border-indigo-300 bg-indigo-50/50' },
  { id: 'Buyer Site Visits', label: '5. Buyer Site Visits', color: 'border-purple-300 bg-purple-50/50' },
  { id: 'Offer Received / Negotiation', label: '6. Offer / Negotiation', color: 'border-pink-300 bg-pink-50/50' },
  { id: 'Token Received / Agreement', label: '7. Token / Sale Agreement', color: 'border-emerald-300 bg-emerald-50/50' },
  { id: 'Closed - Won', label: '8. Registered & Won', color: 'border-emerald-500 bg-emerald-100/60' }
];

export const SalesPipelineView: React.FC<SalesPipelineViewProps> = ({
  onSelectOwner,
  onOpenAddOwner
}) => {
  const { saleLeads, owners, updateSaleLeadStage, addTransaction } = useCrm();

  const [selectedProject, setSelectedProject] = useState<string>('All');

  // Compute total pipeline volume
  const totalPipelineValue = saleLeads.reduce((acc, lead) => {
    if (lead.stage !== 'Closed - Lost') return acc + (lead.expectedPrice || 0);
    return acc;
  }, 0);

  const activeLeadsCount = saleLeads.filter(l => l.stage !== 'Closed - Won' && l.stage !== 'Closed - Lost').length;

  const handleMoveStage = (leadId: string, currentStage: SalesPipelineStage, direction: 'next' | 'prev') => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex === -1) return;

    if (direction === 'next' && currentIndex < PIPELINE_STAGES.length - 1) {
      const nextStage = PIPELINE_STAGES[currentIndex + 1].id;
      updateSaleLeadStage(leadId, nextStage);

      // If closed won, record transaction
      if (nextStage === 'Closed - Won') {
        const lead = saleLeads.find(l => l.id === leadId);
        const owner = owners.find(o => o.id === lead?.ownerId);
        if (lead && owner) {
          addTransaction({
            ownerId: owner.id,
            propertyId: owner.id,
            dealType: 'Resale',
            agreedPriceOrRent: lead.expectedPrice || 20000000,
            brokeragePercentage: 1.0,
            brokerageFee: (lead.expectedPrice || 20000000) * 0.01,
            dealStage: 'Registered / Executed',
            closingDate: new Date().toISOString().split('T')[0],
            assignedAgent: lead.assignedAgent || owner.assignedStaff
          });
        }
      }
    } else if (direction === 'prev' && currentIndex > 0) {
      updateSaleLeadStage(leadId, PIPELINE_STAGES[currentIndex - 1].id);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Sales Resale Pipeline</h1>
            <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-300">
              {activeLeadsCount} Active Resale Mandates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track Prestige owner seller mandates from initial qualification to final registration.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-right">
            <span className="text-[10px] text-amber-800 font-semibold uppercase">Active Pipeline Value</span>
            <p className="text-sm font-black text-amber-950">
              ₹{(totalPipelineValue / 10000000).toFixed(2)} Crores
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scrollable) */}
      <div className="flex space-x-3.5 overflow-x-auto pb-4 pt-1 min-h-[600px] text-xs">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = saleLeads.filter(l => l.stage === stage.id);
          const stageTotalValue = stageLeads.reduce((acc, l) => acc + (l.expectedPrice || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 flex flex-col bg-slate-100/70 border border-slate-200 rounded-2xl p-3 shadow-2xs max-h-[78vh]"
            >
              {/* Stage Header */}
              <div className="pb-2.5 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">{stage.label}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {stageLeads.length} leads • ₹{(stageTotalValue / 10000000).toFixed(2)}Cr
                  </p>
                </div>
                <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                  {stageLeads.length}
                </span>
              </div>

              {/* Stage Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    No properties in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const owner = owners.find(o => o.id === lead.ownerId);
                    if (!owner) return null;

                    return (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-amber-400 transition-all group relative"
                      >
                        <div className="flex items-start justify-between">
                          <button
                            onClick={() => onSelectOwner(owner.id)}
                            className="font-bold text-slate-900 hover:text-amber-700 text-left text-xs group-hover:underline truncate"
                          >
                            {owner.name}
                          </button>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            lead.leadTemperature === 'HOT' ? 'bg-rose-100 text-rose-800' :
                            lead.leadTemperature === 'WARM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {lead.leadScore} pts
                          </span>
                        </div>

                        {/* Unit Details */}
                        <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                          <p className="font-semibold text-slate-800 truncate">{owner.project}</p>
                          <p>{owner.flatNumber} • {owner.block} • <span className="font-semibold text-amber-900">{owner.bhk}</span></p>
                        </div>

                        {/* Expected Price */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Expected Price:</span>
                          <span className="font-bold text-slate-900 text-xs">
                            {lead.expectedPrice ? `₹${(lead.expectedPrice / 10000000).toFixed(2)} Cr` : 'TBD'}
                          </span>
                        </div>

                        {/* Lead Stage Shift Controls */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{lead.assignedAgent}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'prev')}
                              disabled={stage.id === 'Interested'}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600"
                              title="Move to previous stage"
                            >
                              ←
                            </button>
                            <button
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'next')}
                              disabled={stage.id === 'Closed - Won'}
                              className="px-2 py-0.5 text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded shadow-2xs"
                              title="Advance to next pipeline stage"
                            >
                              Advance →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
