import React, { useState } from 'react';
import { 
  UserPlus, 
  X, 
  Building, 
  Phone, 
  Mail, 
  Home, 
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { PropertyStatus, IntentTimeline } from '../../types';

interface AddOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_PRESTIGE_PROJECTS = [
  'Prestige Falcon City',
  'Prestige Lakeside Habitat',
  'Prestige Shantiniketan',
  'Prestige Jindal City',
  'Prestige Song of the South',
  'Prestige Ferns Residency',
  'Prestige Sunrise Park',
  'Prestige Tranquility',
  'Prestige Dolce Vita',
  'Prestige Elysian',
  'Prestige Primrose Hills',
  'Prestige Finsbury Park',
  'Prestige Park Square',
  'Prestige High Fields',
  'Prestige Augusta Golf Village'
];

export const AddOwnerModal: React.FC<AddOwnerModalProps> = ({ isOpen, onClose }) => {
  const { addOwner, currentUser } = useCrm();

  const [name, setName] = useState('');
  const [coOwner, setCoOwner] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [alternatePhone1, setAlternatePhone1] = useState('');
  const [email, setEmail] = useState('');
  const [project, setProject] = useState('Prestige Falcon City');
  const [customProject, setCustomProject] = useState('');
  const [block, setBlock] = useState('Tower 1');
  const [flatNumber, setFlatNumber] = useState('');
  const [bhk, setBhk] = useState('3 BHK');
  const [superBuiltUpArea, setSuperBuiltUpArea] = useState('1550');
  
  // Qualification & Intent Fields
  const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>('Self Occupied');
  const [saleIntent, setSaleIntent] = useState<IntentTimeline>('Not Interested');
  const [expectedPrice, setExpectedPrice] = useState<string>('');
  const [rentalIntent, setRentalIntent] = useState<IntentTimeline>('Not Interested');
  const [expectedRent, setExpectedRent] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !primaryPhone.trim() || !flatNumber.trim()) return;

    const finalProject = project === '__OTHER__' ? (customProject.trim() || 'Prestige Project') : project;

    addOwner({
      name: name.trim(),
      coOwner: coOwner.trim() || undefined,
      primaryPhone: primaryPhone.trim(),
      alternatePhone1: alternatePhone1.trim() || undefined,
      email: email.trim() || undefined,
      project: finalProject,
      block: block.trim() || 'Tower 1',
      flatNumber: flatNumber.trim(),
      bhk,
      superBuiltUpArea: Number(superBuiltUpArea) || 1500,
      propertyStatus,
      saleIntent,
      saleInfo: saleIntent !== 'Not Interested' ? {
        expectedPrice: Number(expectedPrice) || 20000000,
        saleMarketingAuthorization: true
      } : undefined,
      rentalIntent,
      rentalInfo: rentalIntent !== 'Not Interested' ? {
        expectedMonthlyRent: Number(expectedRent) || 60000,
        rentalMarketingAuthorization: true
      } : undefined,
      leadStatus: (saleIntent !== 'Not Interested' || rentalIntent !== 'Not Interested') ? 'Qualified' : 'New Lead',
      assignedStaff: currentUser.name
    });

    onClose();
    setName('');
    setCoOwner('');
    setPrimaryPhone('');
    setAlternatePhone1('');
    setEmail('');
    setFlatNumber('');
    setExpectedPrice('');
    setExpectedRent('');
    setSaleIntent('Not Interested');
    setRentalIntent('Not Interested');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Add New Prestige Property Owner</h2>
              <p className="text-[11px] text-slate-300">Creates owner profile, property record & syncs to active pipelines</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Owner & Contact Information */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>1. Owner & Contact Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Owner Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Co-Owner / Spouse Name</label>
                <input
                  type="text"
                  value={coOwner}
                  onChange={(e) => setCoOwner(e.target.value)}
                  placeholder="e.g. Sunita Chandra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Mobile Number <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  placeholder="+91 98450 XXXXX"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alternate Phone / WhatsApp</label>
                <input
                  type="text"
                  value={alternatePhone1}
                  onChange={(e) => setAlternatePhone1(e.target.value)}
                  placeholder="+91 98451 XXXXX"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner.prestige@gmail.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Property Unit Specification */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>2. Prestige Apartment & Unit Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prestige Project <span className="text-rose-500">*</span></label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {POPULAR_PRESTIGE_PROJECTS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="__OTHER__">+ Enter Custom Project Name...</option>
                </select>
              </div>

              {project === '__OTHER__' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custom Project Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={customProject}
                    onChange={(e) => setCustomProject(e.target.value)}
                    placeholder="e.g. Prestige Willow Green"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tower / Block <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Tower 2 / Block B"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit / Flat No <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  placeholder="e.g. 1402"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">BHK Config</label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="2.5 BHK">2.5 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="3.5 BHK">3.5 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="Penthouse">Penthouse / Villa</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Super Area (Sq.Ft)</label>
                <input
                  type="number"
                  value={superBuiltUpArea}
                  onChange={(e) => setSuperBuiltUpArea(e.target.value)}
                  placeholder="1550"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Intent & Lead Pipeline Qualification */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>3. Intent & Pipeline Setup</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Property Status</label>
                <select
                  value={propertyStatus}
                  onChange={(e) => setPropertyStatus(e.target.value as PropertyStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Self Occupied">Self Occupied</option>
                  <option value="Rented Out">Rented Out</option>
                  <option value="Vacant">Vacant</option>
                  <option value="Planning to Sell">Planning to Sell</option>
                  <option value="Planning to Rent">Planning to Rent</option>
                  <option value="Under Renovation">Under Renovation</option>
                  <option value="Unknown">Unknown / Unqualified</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sale Resale Intent</label>
                <select
                  value={saleIntent}
                  onChange={(e) => setSaleIntent(e.target.value as IntentTimeline)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Not Interested">Not Interested</option>
                  <option value="Immediate">Immediate (Within 30 Days)</option>
                  <option value="Within 3 Months">Within 3 Months</option>
                  <option value="3-6 Months">3-6 Months</option>
                  <option value="6-12 Months">6-12 Months</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rental Intent</label>
                <select
                  value={rentalIntent}
                  onChange={(e) => setRentalIntent(e.target.value as IntentTimeline)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Not Interested">Not Interested</option>
                  <option value="Immediate">Immediate (Within 30 Days)</option>
                  <option value="Within 3 Months">Within 3 Months</option>
                  <option value="3-6 Months">3-6 Months</option>
                </select>
              </div>
            </div>

            {/* Dynamic Price / Rent fields if Intent is Active */}
            {(saleIntent !== 'Not Interested' || rentalIntent !== 'Not Interested') && (
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {saleIntent !== 'Not Interested' && (
                  <div>
                    <label className="font-bold text-amber-950 block mb-1">Expected Resale Price (₹)</label>
                    <input
                      type="number"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      placeholder="e.g. 21500000"
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
                {rentalIntent !== 'Not Interested' && (
                  <div>
                    <label className="font-bold text-amber-950 block mb-1">Expected Monthly Rent (₹)</label>
                    <input
                      type="number"
                      value={expectedRent}
                      onChange={(e) => setExpectedRent(e.target.value)}
                      placeholder="e.g. 65000"
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Assigned Agent: <strong className="text-slate-700">{currentUser.name}</strong>
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save & Commit Owner
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

