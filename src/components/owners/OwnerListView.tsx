import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Phone, 
  MessageSquare, 
  Eye, 
  ClipboardCheck, 
  Flame, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  UserPlus, 
  CheckSquare, 
  Square,
  Building,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Owner, LeadTemperature, PropertyStatus, IntentTimeline } from '../../types';
import { exportToExcel, exportToCSV } from '../../utils/csvExcelParser';

interface OwnerListViewProps {
  onSelectOwner: (ownerId: string) => void;
  onOpenQualify: (owner: Owner) => void;
  onOpenQuickLog: (owner?: Owner) => void;
  onOpenAddOwner: () => void;
  onOpenImport: () => void;
  globalSearchTerm?: string;
}

export const OwnerListView: React.FC<OwnerListViewProps> = ({
  onSelectOwner,
  onOpenQualify,
  onOpenQuickLog,
  onOpenAddOwner,
  onOpenImport,
  globalSearchTerm = ''
}) => {
  const { owners, bulkUpdateOwners, bulkDeleteOwners, users, clearAllData, resetToDemoData, hasPermission } = useCrm();

  const canCreateOwner = hasPermission('owners', 'create');
  const canDeleteOwner = hasPermission('owners', 'delete');
  const canExportOwner = hasPermission('owners', 'export');
  const canImportData = hasPermission('admin', 'importData');
  const canResetDb = hasPermission('admin', 'clearOrResetDatabase');
  const canViewUnmaskedPhone = hasPermission('owners', 'viewUnmaskedPhone');

  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    if (canViewUnmaskedPhone) return phone;
    // Format: +91 98*** **345
    const clean = phone.trim();
    if (clean.length < 6) return '******';
    return clean.slice(0, 4) + ' ••••• ' + clean.slice(-3);
  };

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState(globalSearchTerm);
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSaleIntent, setSelectedSaleIntent] = useState<string>('All');
  const [selectedRentalIntent, setSelectedRentalIntent] = useState<string>('All');
  const [selectedTemperature, setSelectedTemperature] = useState<string>('All');
  const [selectedBhk, setSelectedBhk] = useState<string>('All');
  const [selectedStaff, setSelectedStaff] = useState<string>('All');
  const [contactFilter, setContactFilter] = useState<'All' | 'Contacted' | 'Uncontacted'>('All');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<keyof Owner>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Bulk Selection
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssignTarget, setBulkAssignTarget] = useState(users[0]?.name || 'Karthik Rao');

  // Column Visibility
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    coOwner: false,
    alternatePhones: true,
    email: true,
    bhk: true,
    score: true,
    propertyStatus: true,
    saleIntent: true,
    rentalIntent: true,
    lastContact: true,
    assignedStaff: true
  });

  // Extract unique project list
  const projectList = useMemo(() => {
    const set = new Set<string>();
    owners.forEach(o => { if (o.project) set.add(o.project); });
    return ['All', ...Array.from(set).sort()];
  }, [owners]);

  // Filtered & Sorted Owners
  const filteredOwners = useMemo(() => {
    return owners.filter(owner => {
      // Global & local search query
      const query = (searchTerm || globalSearchTerm).toLowerCase().trim();
      if (query) {
        const matchName = owner.name?.toLowerCase().includes(query);
        const matchCoOwner = owner.coOwner?.toLowerCase().includes(query);
        const matchFlat = owner.flatNumber?.toLowerCase().includes(query);
        const matchBlock = owner.block?.toLowerCase().includes(query);
        const matchProject = owner.project?.toLowerCase().includes(query);
        const matchPhone = owner.primaryPhone?.includes(query);
        const matchAlt1 = owner.alternatePhone1?.includes(query);
        const matchAlt2 = owner.alternatePhone2?.includes(query);
        const matchEmail = owner.email?.toLowerCase().includes(query);

        if (!matchName && !matchCoOwner && !matchFlat && !matchBlock && !matchProject && !matchPhone && !matchAlt1 && !matchAlt2 && !matchEmail) {
          return false;
        }
      }

      // Filter by project
      if (selectedProject !== 'All' && owner.project !== selectedProject) return false;

      // Filter by property status
      if (selectedStatus !== 'All' && owner.propertyStatus !== selectedStatus) return false;

      // Filter by sale intent
      if (selectedSaleIntent !== 'All' && owner.saleIntent !== selectedSaleIntent) return false;

      // Filter by rental intent
      if (selectedRentalIntent !== 'All' && owner.rentalIntent !== selectedRentalIntent) return false;

      // Filter by temperature
      if (selectedTemperature !== 'All' && owner.leadTemperature !== selectedTemperature) return false;

      // Filter by BHK
      if (selectedBhk !== 'All' && owner.bhk !== selectedBhk) return false;

      // Filter by staff
      if (selectedStaff !== 'All' && owner.assignedStaff !== selectedStaff) return false;

      // Filter by contact state
      if (contactFilter === 'Contacted' && (!owner.contactAttempts || owner.contactAttempts === 0)) return false;
      if (contactFilter === 'Uncontacted' && owner.contactAttempts && owner.contactAttempts > 0) return false;

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortAsc ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
      }
      if (typeof aVal === 'number') {
        return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
      return 0;
    });
  }, [
    owners, searchTerm, globalSearchTerm, selectedProject, selectedStatus, 
    selectedSaleIntent, selectedRentalIntent, selectedTemperature, selectedBhk, 
    selectedStaff, contactFilter, sortField, sortAsc
  ]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredOwners.length / rowsPerPage) || 1;
  const paginatedOwners = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOwners.slice(start, start + rowsPerPage);
  }, [filteredOwners, currentPage, rowsPerPage]);

  const handleSelectAll = () => {
    if (selectedOwnerIds.length === paginatedOwners.length) {
      setSelectedOwnerIds([]);
    } else {
      setSelectedOwnerIds(paginatedOwners.map(o => o.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedOwnerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = () => {
    if (selectedOwnerIds.length === 0) return;
    bulkUpdateOwners(selectedOwnerIds, { assignedStaff: bulkAssignTarget });
    setSelectedOwnerIds([]);
    setShowBulkAssign(false);
  };

  const handleBulkDelete = () => {
    if (selectedOwnerIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedOwnerIds.length} owner records permanently?`)) {
      bulkDeleteOwners(selectedOwnerIds);
      setSelectedOwnerIds([]);
    }
  };

  const handleExportData = (type: 'excel' | 'csv') => {
    const exportRows = filteredOwners.map(o => ({
      'Owner Name': o.name,
      'Co-Owner': o.coOwner || '',
      'Flat Number': o.flatNumber,
      'Block': o.block,
      'Project': o.project,
      'Primary Phone': o.primaryPhone,
      'Alt 1': o.alternatePhone1 || '',
      'Alt 2': o.alternatePhone2 || '',
      'Email': o.email || '',
      'BHK': o.bhk,
      'Status': o.propertyStatus,
      'Sale Intent': o.saleIntent,
      'Rental Intent': o.rentalIntent,
      'Lead Score': o.leadScore,
      'Temperature': o.leadTemperature,
      'Contact Attempts': o.contactAttempts || 0,
      'Last Outcome': o.lastContactOutcome || '',
      'Assigned Staff': o.assignedStaff
    }));

    if (type === 'excel') {
      exportToExcel(exportRows, `Prestige_Owners_Export_${new Date().toISOString().split('T')[0]}`);
    } else {
      exportToCSV(exportRows, `Prestige_Owners_Export_${new Date().toISOString().split('T')[0]}`);
    }
  };

  const handleWhatsAppClick = (phone: string, name: string, flatNumber: string, project: string) => {
    const cleanNum = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello ${name}, this is regarding your property at ${project} (${flatNumber}). We have active verified buyers & tenants looking for units in your community. Would you be open to exploring the current market value?`
    );
    window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
  };

  const handleSort = (field: keyof Owner) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Owner Database</h1>
            <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              {filteredOwners.length.toLocaleString()} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full Bengaluru Prestige property repository with strict intent verification.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {owners.length > 0 && canResetDb && (
            <button
              onClick={() => setShowClearConfirmModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200 transition-colors shadow-2xs"
              title="Remove demo data to import clean database"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Demo Data</span>
            </button>
          )}
          {canExportOwner && (
            <button
              onClick={() => handleExportData('excel')}
              disabled={owners.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export filtered records to Excel"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </button>
          )}
          {canImportData && (
            <button
              onClick={onOpenImport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
            >
              <span>Import Excel/CSV</span>
            </button>
          )}
          {canCreateOwner && (
            <button
              onClick={onOpenAddOwner}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Owner</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Comprehensive Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Search Bar + Quick toggles */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Co-Owner, Flat #, Block, Phone, Alternate Phone 1-5, or Email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Contact Status Quick Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setContactFilter('All')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  contactFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setContactFilter('Contacted')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  contactFilter === 'Contacted' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Contacted
              </button>
              <button
                onClick={() => setContactFilter('Uncontacted')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  contactFilter === 'Uncontacted' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Uncalled
              </button>
            </div>

            {/* Column Config Dropdown Toggle */}
            <button
              onClick={() => setShowColumnConfig(!showColumnConfig)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Columns</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Project */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => { setSelectedProject(e.target.value); setCurrentPage(1); }}
              className="w-full mt-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              {projectList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Property Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full mt-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Self Occupied">Self Occupied</option>
              <option value="Rented">Rented</option>
              <option value="Vacant">Vacant</option>
              <option value="Planning to Sell">Planning to Sell</option>
              <option value="Planning to Rent">Planning to Rent</option>
              <option value="Considering Both">Considering Both</option>
              <option value="Unknown">Unknown (Unqualified)</option>
            </select>
          </div>

          {/* Sale Intent */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sale Intent</label>
            <select
              value={selectedSaleIntent}
              onChange={(e) => { setSelectedSaleIntent(e.target.value); setCurrentPage(1); }}
              className="w-full mt-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Sale Intents</option>
              <option value="Immediate">Immediate (0-1 mo)</option>
              <option value="Within 3 Months">Within 3 Months</option>
              <option value="3–6 Months">3–6 Months</option>
              <option value="6–12 Months">6–12 Months</option>
              <option value="Considering">Considering</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>

          {/* Rental Intent */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rental Intent</label>
            <select
              value={selectedRentalIntent}
              onChange={(e) => { setSelectedRentalIntent(e.target.value); setCurrentPage(1); }}
              className="w-full mt-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Rental Intents</option>
              <option value="Immediate">Immediate</option>
              <option value="Within 3 Months">Within 3 Months</option>
              <option value="3–6 Months">3–6 Months</option>
              <option value="6–12 Months">6–12 Months</option>
              <option value="Considering">Considering</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Temperature</label>
            <select
              value={selectedTemperature}
              onChange={(e) => { setSelectedTemperature(e.target.value); setCurrentPage(1); }}
              className="w-full mt-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Temperatures</option>
              <option value="HOT">🔥 HOT (70+)</option>
              <option value="WARM">⚡ WARM (40-69)</option>
              <option value="COLD">❄️ COLD (20-39)</option>
              <option value="NURTURE">🌱 NURTURE (&lt;20)</option>
            </select>
          </div>

          {/* Assigned Staff */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Staff</label>
            <select
              value={selectedStaff}
              onChange={(e) => { setSelectedStaff(e.target.value); setCurrentPage(1); }}
              className="w-full mt-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Team</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Column Configuration Popover */}
        {showColumnConfig && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <p className="font-bold text-slate-700 mb-2 uppercase text-[10px]">Toggle Table Columns:</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(visibleColumns).map(([colKey, isVisible]) => (
                <label key={colKey} className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, [colKey]: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Banner */}
      {selectedOwnerIds.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4 text-amber-700" />
            <span className="font-bold text-amber-950">{selectedOwnerIds.length} owners selected</span>
          </div>
          <div className="flex items-center space-x-2">
            {showBulkAssign ? (
              <div className="flex items-center space-x-1.5">
                <select
                  value={bulkAssignTarget}
                  onChange={(e) => setBulkAssignTarget(e.target.value)}
                  className="py-1 px-2 text-xs bg-white border border-amber-300 rounded-lg"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                >
                  Save Assign
                </button>
                <button
                  onClick={() => setShowBulkAssign(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowBulkAssign(true)}
                className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold"
              >
                Assign Staff
              </button>
            )}

            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center space-x-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Owners Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px] tracking-wider select-none">
              <tr>
                <th className="py-3 px-4 w-10">
                  <button onClick={handleSelectAll} className="flex items-center">
                    {selectedOwnerIds.length === paginatedOwners.length && paginatedOwners.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Owner & Unit</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Contact Info</th>
                {visibleColumns.propertyStatus && (
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('propertyStatus')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.saleIntent && <th className="py-3 px-4">Sale Intent</th>}
                {visibleColumns.rentalIntent && <th className="py-3 px-4">Rental Intent</th>}
                {visibleColumns.score && (
                  <th className="py-3 px-4 cursor-pointer text-center" onClick={() => handleSort('leadScore')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Score</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.lastContact && <th className="py-3 px-4">Last Contact</th>}
                {visibleColumns.assignedStaff && <th className="py-3 px-4">Assigned To</th>}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {owners.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Database Empty — Ready for Your Data</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          No demo data in the system. Import your Excel or CSV file containing 5,000+ Prestige property owner records, or register your first property manually.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          onClick={onOpenImport}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>+ Import Excel / CSV File</span>
                        </button>
                        <button
                          onClick={onOpenAddOwner}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                        >
                          <span>Add Single Owner</span>
                        </button>
                        <button
                          onClick={resetToDemoData}
                          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
                        >
                          <span>Load Sample Demo Records</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginatedOwners.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    No owners found matching your filter criteria. Try clearing your search query or reset filters.
                  </td>
                </tr>
              ) : (
                paginatedOwners.map((owner) => {
                  const isSelected = selectedOwnerIds.includes(owner.id);

                  return (
                    <tr key={owner.id} className={`hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50/60' : ''}`}>
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleSelect(owner.id)}>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Owner & Unit */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectOwner(owner.id)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left group block"
                        >
                          <span className="group-hover:underline">{owner.name}</span>
                          {visibleColumns.coOwner && owner.coOwner && (
                            <span className="text-[10px] text-slate-400 block font-normal">Co: {owner.coOwner}</span>
                          )}
                        </button>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-600 mt-0.5">
                          <span className="font-semibold text-slate-800">{owner.flatNumber}</span>
                          <span>•</span>
                          <span>{owner.block}</span>
                          <span>•</span>
                          <span className="text-slate-500 truncate max-w-[120px]">{owner.project}</span>
                          {visibleColumns.bhk && (
                            <>
                              <span>•</span>
                              <span className="text-blue-800 font-medium">{owner.bhk}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 font-mono text-slate-800 font-semibold">
                          <span>{maskPhone(owner.primaryPhone)}</span>
                        </div>
                        {visibleColumns.alternatePhones && (owner.alternatePhone1 || owner.alternatePhone2) && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 space-x-1">
                            {owner.alternatePhone1 && <span>Alt1: {maskPhone(owner.alternatePhone1)}</span>}
                            {owner.alternatePhone2 && <span>Alt2: {maskPhone(owner.alternatePhone2)}</span>}
                          </div>
                        )}
                        {visibleColumns.email && owner.email && (
                          <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{owner.email}</p>
                        )}
                      </td>

                      {/* Status */}
                      {visibleColumns.propertyStatus && (
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            owner.propertyStatus === 'Planning to Sell' ? 'bg-red-100 text-red-700 border border-red-200' :
                            owner.propertyStatus === 'Planning to Rent' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            owner.propertyStatus === 'Self Occupied' ? 'bg-slate-100 text-slate-700' :
                            owner.propertyStatus === 'Rented' ? 'bg-purple-100 text-purple-700' :
                            owner.propertyStatus === 'Vacant' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {owner.propertyStatus}
                          </span>
                        </td>
                      )}

                      {/* Sale Intent */}
                      {visibleColumns.saleIntent && (
                        <td className="py-3 px-4">
                          {owner.saleIntent && owner.saleIntent !== 'Not Interested' ? (
                            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              {owner.saleIntent}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Not Interested</span>
                          )}
                        </td>
                      )}

                      {/* Rental Intent */}
                      {visibleColumns.rentalIntent && (
                        <td className="py-3 px-4">
                          {owner.rentalIntent && owner.rentalIntent !== 'Not Interested' ? (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {owner.rentalIntent}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Not Interested</span>
                          )}
                        </td>
                      )}

                      {/* Score & Temperature */}
                      {visibleColumns.score && (
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-black text-slate-900 text-xs">{owner.leadScore}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                              owner.leadTemperature === 'HOT' ? 'bg-red-100 text-red-700' :
                              owner.leadTemperature === 'WARM' ? 'bg-orange-100 text-orange-700' :
                              owner.leadTemperature === 'COLD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {owner.leadTemperature}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Last Contact */}
                      {visibleColumns.lastContact && (
                        <td className="py-3 px-4">
                          {owner.lastContactDate ? (
                            <div>
                              <p className="font-semibold text-slate-800 text-[11px]">{owner.lastContactDate}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{owner.lastContactOutcome || `${owner.contactAttempts} attempt(s)`}</p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Not called yet</span>
                          )}
                        </td>
                      )}

                      {/* Assigned Staff */}
                      {visibleColumns.assignedStaff && (
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-slate-700">{owner.assignedStaff}</span>
                        </td>
                      )}

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Qualify Button */}
                          <button
                            onClick={() => onOpenQualify(owner)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Qualify Owner Intent (Sale/Rent/Status)"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                          </button>

                          {/* Quick Log Call Button */}
                          <button
                            onClick={() => onOpenQuickLog(owner)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Log Call Outcome"
                          >
                            <Phone className="h-4 w-4" />
                          </button>

                          {/* WhatsApp Button */}
                          <button
                            onClick={() => handleWhatsAppClick(owner.primaryPhone, owner.name, owner.flatNumber, owner.project)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            title="Send WhatsApp Message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          {/* 360 Profile View */}
                          <button
                            onClick={() => onSelectOwner(owner.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Full 360 Owner Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Showing {paginatedOwners.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredOwners.length)} of {filteredOwners.length.toLocaleString()} entries</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="py-1 px-2 bg-white border border-slate-300 rounded-md text-xs font-semibold"
            >
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-slate-800 px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clear Demo Data Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Clear All Demo Records?</h3>
              <p className="text-xs text-slate-500">
                This will remove all current records, buyers, tenants, listings, and leads so you can import your clean 5,000+ Excel/CSV owner spreadsheet.
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                (You can always restore sample demo data at any time from Settings).
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearConfirmModal(false);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
