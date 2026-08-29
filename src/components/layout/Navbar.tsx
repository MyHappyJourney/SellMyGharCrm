import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  PhoneCall, 
  Bell, 
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Database
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface NavbarProps {
  onOpenImport: () => void;
  onOpenAddOwner: () => void;
  onSelectOwner?: (id: string) => void;
  onNavigate?: (view: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenImport,
  onOpenAddOwner,
  onSelectOwner,
  onNavigate,
  searchTerm = '',
  onSearchChange
}) => {
  const { currentUser, users, setCurrentUser, owners, followUps, dbStatus, isDbSyncing, resetToDemoData, clearAllData } = useCrm();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const pendingFollowUps = followUps.filter(f => f.status === 'Pending');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs select-none">
      {/* Left: Search Omnibar */}
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search owners, phones, flats or projects..."
            value={onSearchChange ? searchTerm : localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-900 placeholder:text-slate-400 transition-colors"
          />
        </form>
      </div>

      {/* Right: Actions, Import status badge & User Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Status Pill Badge from Design HTML */}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('settings')}
          title="Click to view Database & MongoDB settings"
          className={`hidden lg:flex items-center px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
            dbStatus.type === 'mongodb'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
              : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70'
          }`}
        >
          <span className={`w-2 h-2 rounded-full mr-2 ${
            isDbSyncing ? 'bg-amber-500 animate-spin' : (dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500')
          }`}></span>
          <span className="text-xs font-semibold uppercase tracking-wider">
            {isDbSyncing ? 'Syncing...' : `${dbStatus.type === 'mongodb' ? 'MongoDB' : 'Database'}: ${owners.length.toLocaleString()} Records`}
          </span>
        </button>

        {/* Import Button */}
        <button
          onClick={onOpenImport}
          className="inline-flex items-center space-x-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>+ Import Excel/CSV</span>
        </button>

        {/* Add Owner Button */}
        <button
          onClick={onOpenAddOwner}
          className="hidden sm:inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-200 transition-colors"
        >
          <Plus className="h-4 w-4 text-slate-600" />
          <span>Add Owner</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Pending tasks"
          >
            <Bell className="h-4 w-4" />
            {pendingFollowUps.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pending Follow-Ups</h4>
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  {pendingFollowUps.length} Overdue / Due
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                {pendingFollowUps.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No overdue follow-up calls.</p>
                ) : (
                  pendingFollowUps.slice(0, 5).map(f => (
                    <div 
                      key={f.id} 
                      onClick={() => {
                        if (onSelectOwner) onSelectOwner(f.ownerId);
                        setShowNotifications(false);
                      }}
                      className="p-3 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-900">{f.ownerName}</p>
                        <span className="text-[10px] text-blue-600 font-medium">{f.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">{f.project} - {f.flatNumber}</p>
                      <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">"{f.notes}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-2 pl-2 pr-1.5 py-1 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">{currentUser.role}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Switch Active Role</p>
              </div>
              <div className="py-1 text-xs">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      u.id === currentUser.id ? 'bg-blue-50 font-bold text-blue-900' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.role}</p>
                    </div>
                    {u.id === currentUser.id && (
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-1 mt-1 px-3 space-y-1">
                <button
                  onClick={() => {
                    if (confirm('Clear all demo data so you can import your clean real Excel / CSV database?')) {
                      clearAllData();
                      setShowRoleDropdown(false);
                    }
                  }}
                  className="w-full text-left py-1 text-xs text-rose-600 hover:text-rose-800 flex items-center space-x-1.5 font-medium"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Clear Demo Data</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Restore 20 sample Prestige owner records?')) {
                      resetToDemoData();
                      setShowRoleDropdown(false);
                    }
                  }}
                  className="w-full text-left py-1 text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1.5 font-medium"
                >
                  <Database className="h-3 w-3" />
                  <span>Load Sample Records</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
