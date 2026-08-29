import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  DollarSign, 
  Home, 
  TrendingUp, 
  Eye, 
  X, 
  Search, 
  Filter,
  Check
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { PropertyListing, Owner } from '../../types';

interface ListingsViewProps {
  onSelectOwner: (ownerId: string) => void;
}

export const ListingsView: React.FC<ListingsViewProps> = ({ onSelectOwner }) => {
  const { listings, owners, addListing, updateListing, currentUser } = useCrm();

  const [selectedType, setSelectedType] = useState<'All' | 'Sale' | 'Rent'>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Listing Form State
  const [formOwnerId, setFormOwnerId] = useState(owners[0]?.id || '');
  const [formType, setFormType] = useState<'Sale' | 'Rent'>('Sale');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formRent, setFormRent] = useState<number | string>('');
  const [formHighlights, setFormHighlights] = useState('High floor, pool facing, modular kitchen, 1 car parking');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const selectedOwner = owners.find(o => o.id === formOwnerId);

  const filteredListings = listings.filter(l => {
    if (selectedType !== 'All' && l.listingType !== selectedType) return false;
    if (selectedStatus !== 'All' && l.listingStatus !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = l.listingTitle.toLowerCase().includes(q);
      const matchProject = l.project.toLowerCase().includes(q);
      const matchFlat = l.flatNumber.toLowerCase().includes(q);
      if (!matchTitle && !matchProject && !matchFlat) return false;
    }
    return true;
  });

  const handleGenerateAiListing = async () => {
    if (!selectedOwner) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedOwner.project,
          bhk: selectedOwner.bhk,
          areaSqFt: selectedOwner.superBuiltUpArea || 1550,
          furnishing: selectedOwner.furnishingStatus || 'Semi-Furnished',
          floor: '12th Floor',
          type: formType,
          expectedPrice: Number(formPrice) || (selectedOwner.saleInfo?.expectedPrice || 21500000),
          expectedRent: Number(formRent) || (selectedOwner.rentalInfo?.expectedMonthlyRent || 55000),
          highlights: formHighlights
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFormTitle(data.title);
        setFormDescription(data.description + (data.bulletPoints ? '\n\nKey Highlights:\n' + data.bulletPoints.map((b: string) => `• ${b}`).join('\n') : ''));
      }
    } catch (e) {
      console.error('AI Generation error:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;

    addListing({
      ownerId: selectedOwner.id,
      propertyId: selectedOwner.id,
      listingTitle: formTitle || `${selectedOwner.project} - ${selectedOwner.bhk} Luxury Unit`,
      description: formDescription,
      listingType: formType,
      listingStatus: 'Active',
      price: formType === 'Sale' ? (Number(formPrice) || 20000000) : undefined,
      rentPerMonth: formType === 'Rent' ? (Number(formRent) || 50000) : undefined,
      project: selectedOwner.project,
      flatNumber: selectedOwner.flatNumber,
      bhk: selectedOwner.bhk,
      superBuiltUpArea: selectedOwner.superBuiltUpArea || 1500,
      isVerified: true,
      verifiedBy: currentUser.name,
      portalPublished: ['MagicBricks', '99acres', 'Housing.com']
    });

    setIsCreating(false);
    setFormTitle('');
    setFormDescription('');
  };

  const handleCopyBroadcast = (listing: PropertyListing) => {
    const text = `🏡 VERIFIED PRESTIGE PROPERTY FOR ${listing.listingType.toUpperCase()}\n` +
      `📍 Project: ${listing.project}\n` +
      `🚪 Unit: ${listing.flatNumber} (${listing.bhk})\n` +
      `📐 Size: ${listing.superBuiltUpArea} sq.ft\n` +
      `💰 ${listing.listingType === 'Sale' ? `Price: ₹${listing.price ? (listing.price / 10000000).toFixed(2) + ' Cr' : 'On Request'}` : `Rent: ₹${listing.rentPerMonth?.toLocaleString()}/mo`}\n` +
      `✨ Description: ${listing.description}\n\n` +
      `📞 Contact SellMyGhar Prestige Advisory: +91 98450 12345`;

    navigator.clipboard.writeText(text);
    setCopiedId(listing.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Verified Property Inventory</h1>
            <span className="bg-blue-100 text-blue-900 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-300">
              {listings.length} Units Available
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prestige listings ready for buyer matching, portal syndication, and client broadcast.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Listing</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, project, flat number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            <button
              onClick={() => setSelectedType('All')}
              className={`px-3 py-1 rounded-md font-semibold ${selectedType === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('Sale')}
              className={`px-3 py-1 rounded-md font-semibold ${selectedType === 'Sale' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600'}`}
            >
              Resale
            </button>
            <button
              onClick={() => setSelectedType('Rent')}
              className={`px-3 py-1 rounded-md font-semibold ${selectedType === 'Rent' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600'}`}
            >
              Rentals
            </button>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Offer">Under Offer</option>
            <option value="Sold">Sold</option>
            <option value="Rented">Rented</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredListings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No verified listings match your criteria. Click "Create New Listing" to publish an owner's unit.
          </div>
        ) : (
          filteredListings.map((listing) => {
            const owner = owners.find(o => o.id === listing.ownerId);

            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Banner */}
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        listing.listingType === 'Sale' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                      }`}>
                        FOR {listing.listingType.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-300 font-medium">{listing.bhk}</span>
                    </div>

                    {listing.isVerified && (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Verified Mandate</span>
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{listing.listingTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {listing.project} • Unit {listing.flatNumber} ({listing.superBuiltUpArea} sq.ft)
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Pricing:</span>
                      <span className="text-sm font-black text-slate-900">
                        {listing.listingType === 'Sale'
                          ? `₹${listing.price ? (listing.price / 10000000).toFixed(2) + ' Cr' : 'On Request'}`
                          : `₹${listing.rentPerMonth?.toLocaleString()}/mo`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {listing.description}
                    </p>

                    {owner && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Owner:</span>
                        <button
                          onClick={() => onSelectOwner(owner.id)}
                          className="font-semibold text-slate-800 hover:text-amber-700 hover:underline"
                        >
                          {owner.name} ({owner.primaryPhone})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Status: <strong className="text-slate-700">{listing.listingStatus}</strong>
                  </span>

                  <button
                    onClick={() => handleCopyBroadcast(listing)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold transition-colors"
                  >
                    {copiedId === listing.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy Broadcast</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Listing Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold">Publish Verified Property Listing</h2>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Qualified Owner</label>
                  <select
                    value={formOwnerId}
                    onChange={(e) => setFormOwnerId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.project} - {o.flatNumber} • {o.bhk})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Listing Type</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormType('Sale')}
                      className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${
                        formType === 'Sale' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      Resale
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('Rent')}
                      className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${
                        formType === 'Rent' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      Rental
                    </button>
                  </div>
                </div>
              </div>

              {/* Price / Rent */}
              <div className="grid grid-cols-2 gap-3">
                {formType === 'Sale' ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 21500000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 55000"
                      value={formRent}
                      onChange={(e) => setFormRent(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Special Highlights</label>
                  <input
                    type="text"
                    value={formHighlights}
                    onChange={(e) => setFormHighlights(e.target.value)}
                    placeholder="e.g. Corner unit, pool facing, woodwork"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* AI Generator Button */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-950">Generate Professional Copy via AI</p>
                  <p className="text-[10px] text-amber-800">Auto-writes captivating title & description matching Prestige standards.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiListing}
                  disabled={isGeneratingAi}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isGeneratingAi ? 'Writing Copy...' : 'AI Generate'}</span>
                </button>
              </div>

              {/* Title & Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Listing Headline / Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Prestige Falcon City – Elegant 3 BHK with Panoramic Views"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Property description, amenities, possession timeline..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
