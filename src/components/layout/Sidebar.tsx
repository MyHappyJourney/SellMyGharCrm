import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  ClipboardCheck, 
  TrendingUp, 
  Home, 
  CalendarClock, 
  Building, 
  UserCheck, 
  Sparkles, 
  DollarSign, 
  MessageSquareText, 
  Sliders, 
  History, 
  Upload,
  Layers,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface SidebarProps {
  currentView?: string;
  onSelectView?: (view: string) => void;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenImport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onSelectView, 
  currentTab, 
  onTabChange,
  onOpenImport 
}) => {
  const { owners, followUps, listings, saleLeads, rentalLeads, buyers, tenants } = useCrm();

  const activeView = currentView || currentTab || 'dashboard';
  const handleNavigate = (viewId: string) => {
    if (onSelectView) onSelectView(viewId);
    if (onTabChange) onTabChange(viewId);
  };

  const pendingFollowupsCount = followUps.filter(f => f.status === 'Pending').length;
  const activeListingsCount = listings.filter(l => l.listingStatus === 'Active' || l.listingStatus === 'Under Offer').length;
  const totalSaleLeadsCount = saleLeads.filter(s => s.stage !== 'Closed - Won' && s.stage !== 'Closed - Lost').length;
  const totalRentalLeadsCount = rentalLeads.filter(r => r.stage !== 'Closed - Rented' && r.stage !== 'Closed - Lost').length;
  const hotOwnersCount = owners.filter(o => o.leadTemperature === 'HOT').length;

  const navCategories = [
    {
      category: 'Core',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'owners', label: 'Owner CRM', icon: Users, badge: owners.length },
        { id: 'telecaller', label: 'Telecaller Queue', icon: PhoneCall, badge: hotOwnersCount > 0 ? `${hotOwnersCount} HOT` : undefined, isHot: true },
        { id: 'qualification', label: 'Owner Qualification', icon: ClipboardCheck }
      ]
    },
    {
      category: 'Pipelines',
      items: [
        { id: 'sales_pipeline', label: 'Sales Pipeline', icon: TrendingUp, badge: totalSaleLeadsCount },
        { id: 'rental_pipeline', label: 'Rental Pipeline', icon: Home, badge: totalRentalLeadsCount },
        { id: 'followups', label: 'Follow-ups', icon: CalendarClock, badge: pendingFollowupsCount > 0 ? pendingFollowupsCount : undefined }
      ]
    },
    {
      category: 'Databases',
      items: [
        { id: 'listings', label: 'Verified Listings', icon: Building, badge: activeListingsCount },
        { id: 'buyers', label: 'Buyer CRM', icon: UserCheck, badge: buyers.length },
        { id: 'tenants', label: 'Tenant CRM', icon: Users, badge: tenants.length },
        { id: 'matcher', label: 'Property Matcher', icon: Sparkles }
      ]
    },
    {
      category: 'Management',
      items: [
        { id: 'analytics', label: 'Revenue Tracking', icon: DollarSign },
        { id: 'users', label: 'Team & Users', icon: UserPlus },
        { id: 'roles', label: 'Roles & RBAC', icon: ShieldCheck },
        { id: 'templates', label: 'Templates & Messages', icon: MessageSquareText },
        { id: 'settings', label: 'Settings & Data Wipe', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0 border-r border-slate-800 select-none text-slate-300">
      {/* Brand Header from Design HTML */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight italic">SellMyGhar</h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Prestige Owner CRM</p>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navCategories.map((group, gIdx) => (
          <div key={gIdx} className="px-4 mb-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase px-2 mb-2">
              {group.category}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className="w-4 h-4 opacity-80 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.isHot ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom import helper button & status footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
        {onOpenImport && (
          <button
            onClick={onOpenImport}
            className="w-full mb-3 flex items-center justify-center space-x-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel / CSV</span>
          </button>
        )}
        <div className="flex items-center justify-between text-slate-400">
          <span>Bengaluru Prestige Hub</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>
    </aside>
  );
};
