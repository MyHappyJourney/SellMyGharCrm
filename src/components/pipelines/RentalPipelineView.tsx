import React, { useState } from 'react';
import { 
  Home, 
  Flame, 
  Building, 
  DollarSign, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Calendar
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { RentalLead, RentalPipelineStage, Owner } from '../../types';

interface RentalPipelineViewProps {
  onSelectOwner: (ownerId: string) => void;
}

const RENTAL_STAGES: { id: RentalPipelineStage; label: string }[] = [
  { id: 'Interested', label: '1. Qualified Rental' },
  { id: 'Authorization Obtained', label: '2. Owner Authorized' },
  { id: 'Inspection Done', label: '3. Unit Inspected' },
  { id: 'Listing Created', label: '4. Active Listing' },
  { id: 'Tenant Viewings', label: '5. Tenant Viewings' },
  { id: 'Terms Agreed / Token', label: '6. Token & Rent Agreed' },
  { id: 'Agreement Executed / Move-In', label: '7. Agreement & Move-In' },
  { id: 'Closed - Rented', label: '8. Deal Closed / Rented' }
];

export const RentalPipelineView: React.FC<RentalPipelineViewProps> = ({
  onSelectOwner
}) => {
  const { rentalLeads, owners, updateRentalLeadStage, addTransaction } = useCrm();

  const totalMonthlyRentalValue = rentalLeads.reduce((acc, lead) => {
    if (lead.stage !== 'Closed - Lost') return acc + (lead.expectedRent || 0);
    return acc;
  }, 0);

  const activeRentalLeadsCount = rentalLeads.filter(l => l.stage !== 'Closed - Rented' && l.stage !== 'Closed - Lost').length;

  const handleMoveStage = (leadId: string, currentStage: RentalPipelineStage, direction: 'next' | 'prev') => {
    const currentIndex = RENTAL_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex === -1) return;

    if (direction === 'next' && currentIndex < RENTAL_STAGES.length - 1) {
      const nextStage = RENTAL_STAGES[currentIndex + 1].id;
      updateRentalLeadStage(leadId, nextStage);

      // If closed rented, record transaction
      if (nextStage === 'Closed - Rented') {
        const lead = rentalLeads.find(l => l.id === leadId);
        const owner = owners.find(o => o.id === lead?.ownerId);
        if (lead && owner) {
          addTransaction({
            ownerId: owner.id,
            propertyId: owner.id,
            dealType: 'Rental',
            agreedPriceOrRent: lead.expectedRent || 50000,
            brokerageFee: lead.expectedRent || 50000, // 1 month rent
            dealStage: 'Agreement Signed',
            closingDate: new Date().toISOString().split('T')[0],
            assignedAgent: lead.assignedAgent || owner.assignedStaff
          });
        }
      }
    } else if (direction === 'prev' && currentIndex > 0) {
      updateRentalLeadStage(leadId, RENTAL_STAGES[currentIndex - 1].id);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Rental & Leasing Pipeline</h1>
            <span className="bg-emerald-100 text-emerald-900 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-300">
              {activeRentalLeadsCount} Active Rental Properties
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Prestige landlord authorizations, tenant screenings, viewings, and rental agreements.
          </p>
        </div>

        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
          <span className="text-[10px] text-emerald-800 font-semibold uppercase">Total Monthly Rent Volume</span>
          <p className="text-sm font-black text-emerald-950">
            ₹{(totalMonthlyRentalValue / 100000).toFixed(2)} Lakhs/mo
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex space-x-3.5 overflow-x-auto pb-4 pt-1 min-h-[600px] text-xs">
        {RENTAL_STAGES.map((stage) => {
          const stageLeads = rentalLeads.filter(l => l.stage === stage.id);
          const stageTotalRent = stageLeads.reduce((acc, l) => acc + (l.expectedRent || 0), 0);

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
                    {stageLeads.length} units • ₹{(stageTotalRent / 1000).toFixed(0)}k/mo
                  </p>
                </div>
                <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    No rental units in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const owner = owners.find(o => o.id === lead.ownerId);
                    if (!owner) return null;

                    return (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-emerald-400 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <button
                            onClick={() => onSelectOwner(owner.id)}
                            className="font-bold text-slate-900 hover:text-emerald-700 text-left text-xs group-hover:underline truncate"
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

                        <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                          <p className="font-semibold text-slate-800 truncate">{owner.project}</p>
                          <p>{owner.flatNumber} • {owner.block} • <span className="font-semibold text-emerald-900">{owner.bhk}</span></p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Monthly Rent:</span>
                          <span className="font-bold text-emerald-950 text-xs">
                            {lead.expectedRent ? `₹${lead.expectedRent.toLocaleString('en-IN')}/mo` : 'TBD'}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{lead.assignedAgent}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'prev')}
                              disabled={stage.id === 'Interested'}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600"
                            >
                              ←
                            </button>
                            <button
                              onClick={() => handleMoveStage(lead.id, lead.stage, 'next')}
                              disabled={stage.id === 'Closed - Rented'}
                              className="px-2 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-2xs"
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
