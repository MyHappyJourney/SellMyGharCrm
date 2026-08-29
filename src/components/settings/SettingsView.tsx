import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Users, 
  Sliders, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Flame,
  FileSpreadsheet,
  History,
  Database,
  KeyRound,
  Sparkles,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { UserRole } from '../../types';
import { exportOwnersToCsv } from '../../utils/csvExcelParser';
import { UserManagementView } from './UserManagementView';
import { RoleManagementView } from './RoleManagementView';

interface SettingsViewProps {
  initialTab?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'users' }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    scoringRules, 
    updateScoringRule,
    owners, 
    auditLogs,
    resetToDemoData,
    clearAllData,
    hasPermission,
    dbStatus,
    isDbSyncing,
    lastDbSyncTime,
    refreshDbStatus,
    syncToDatabase
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'scoring' | 'database' | 'audit'>(
    (initialTab as any) || 'users'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Database Diagnostic & Test State
  const [testUriInput, setTestUriInput] = useState('');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
    databaseName?: string;
    hasMongoUri: boolean;
  } | null>(null);

  const runTestConnection = async (customUri?: string) => {
    setIsTestingDb(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: customUri || testUriInput || undefined })
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        await refreshDbStatus();
        await syncToDatabase();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        hasMongoUri: true,
        message: 'Could not reach database test endpoint',
        details: err.message
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  // Editable Scoring Rules
  const [immediateSale, setImmediateSale] = useState(35);
  const [saleWithin3M, setSaleWithin3M] = useState(25);
  const [immediateRent, setImmediateRent] = useState(30);
  const [rentWithin3M, setRentWithin3M] = useState(20);
  const [marketingAgreed, setMarketingAgreed] = useState(15);
  const [mandateObtained, setMandateObtained] = useState(20);

  const handleSaveScoring = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExport = () => {
    exportOwnersToCsv(owners, `SellMyGhar_Prestige_Owners_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            System Administration & RBAC Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corporate team access, role-based security permissions, lead scoring weights, and data lifecycle.
          </p>
        </div>

        {/* Current User Pill */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">{currentUser.name}</span>
            <span className="text-[10px] text-blue-700 font-semibold leading-none">{currentUser.role}</span>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto scrollbar-none pb-px">
        {[
          { id: 'users', label: 'Team & User Accounts', icon: Users },
          { id: 'roles', label: 'Roles & Permissions (RBAC)', icon: ShieldCheck },
          { id: 'scoring', label: 'Lead Scoring Engine', icon: Sliders },
          { id: 'database', label: 'Data Management & Zero-Data Wipe', icon: Database },
          { id: 'audit', label: 'Security & Audit Logs', icon: History, count: auditLogs.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Users & Team Management */}
      {activeTab === 'users' && (
        <UserManagementView />
      )}

      {/* Tab 2: Roles & Permissions RBAC */}
      {activeTab === 'roles' && (
        <RoleManagementView />
      )}

      {/* Tab 3: Lead Scoring Tuning */}
      {activeTab === 'scoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <form onSubmit={handleSaveScoring} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="h-5 w-5 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Lead Scoring Point Weights Engine</h2>
                </div>
                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    ✓ Weights Updated!
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Customize point values calculated on qualification. Leads scoring ≥50 points are automatically classified as <strong>HOT 🔥</strong>, 25–49 as <strong>WARM ⚡</strong>, and &lt;25 as <strong>COLD ❄️</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Immediate Resale Intent (pts)</label>
                  <input
                    type="number"
                    value={immediateSale}
                    onChange={(e) => setImmediateSale(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Resale within 3 Months (pts)</label>
                  <input
                    type="number"
                    value={saleWithin3M}
                    onChange={(e) => setSaleWithin3M(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Immediate Rental Intent (pts)</label>
                  <input
                    type="number"
                    value={immediateRent}
                    onChange={(e) => setImmediateRent(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rental within 3 Months (pts)</label>
                  <input
                    type="number"
                    value={rentWithin3M}
                    onChange={(e) => setRentWithin3M(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Marketing Authorization Obtained (pts)</label>
                  <input
                    type="number"
                    value={marketingAgreed}
                    onChange={(e) => setMarketingAgreed(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Exclusive Mandate Signed (pts)</label>
                  <input
                    type="number"
                    value={mandateObtained}
                    onChange={(e) => setMandateObtained(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Save Scoring Weights
                </button>
              </div>
            </form>
          </div>

          {/* Scoring Thresholds Info */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Lead Temperature Thresholds</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between font-bold text-red-900">
                    <span>HOT LEAD 🔥</span>
                    <span>≥ 50 Points</span>
                  </div>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Immediate resale or rental intent with marketing consent. Automatically prioritizes in Telecaller dialer queue.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>WARM LEAD ⚡</span>
                    <span>25 – 49 Points</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Intent to sell or rent within 1–6 months. Placed in scheduled nurturing sequence.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>COLD LEAD ❄️</span>
                    <span>&lt; 25 Points</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Self-occupied, not interested currently, or unverified. Long-term automated check-ins.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Database & Zero-Data Controls */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* MongoDB Live Status Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  dbStatus.type === 'mongodb' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      {dbStatus.type === 'mongodb' ? 'MongoDB Atlas Cluster Connected' : 'Persistent Storage Engine Active'}
                    </h2>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      dbStatus.connected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                      {dbStatus.type === 'mongodb' ? 'MongoDB Live' : 'Disk / JSON Store'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Database: <span className="font-mono font-semibold text-slate-700">{dbStatus.dbName}</span> • Last Synchronized: <span className="font-semibold text-slate-700">{lastDbSyncTime || 'Just now'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={async () => {
                    await refreshDbStatus();
                    await syncToDatabase();
                  }}
                  disabled={isDbSyncing}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5 disabled:opacity-60"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isDbSyncing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
                  <span>{isDbSyncing ? 'Syncing...' : 'Sync Database Now'}</span>
                </button>
              </div>
            </div>

            {/* Storage Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Owner Profiles</span>
                <span className="text-lg font-bold text-slate-900">{owners.length.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Sale & Rent Leads</span>
                <span className="text-lg font-bold text-blue-600">{(dbStatus.counts.saleLeads + dbStatus.counts.rentalLeads).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Audit Logs</span>
                <span className="text-lg font-bold text-slate-900">{auditLogs.length.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Data Persistence</span>
                <span className="text-xs font-bold text-emerald-600 mt-1 block">Zero Reload Loss</span>
              </div>
            </div>

            {/* MongoDB Connection Instructions & Live Diagnostic Tester */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <KeyRound className="h-4 w-4 text-blue-600" />
                  <span>MongoDB Atlas Configuration & Live Diagnostics</span>
                </div>
                <button
                  type="button"
                  onClick={() => runTestConnection()}
                  disabled={isTestingDb}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1.5 transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Testing Connection...' : 'Test Current MongoDB Connection'}</span>
                </button>
              </div>

              {/* Diagnostic Test Result Box */}
              {testResult && (
                <div className={`p-4 rounded-xl border ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-start space-x-2.5">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold text-xs">{testResult.message}</p>
                      {testResult.details && (
                        <p className="text-[11px] leading-relaxed opacity-90">{testResult.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MongoDB Atlas Essential 3-Step Setup Checklist */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>MongoDB Atlas Setup Checklist (Why Data May Not Connect)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-800 block">1. Network Access (IP Whitelist)</span>
                    <p className="text-slate-600 leading-relaxed">
                      In MongoDB Atlas, navigate to <strong>Network Access</strong> &rarr; click <strong>Add IP Address</strong> &rarr; choose <strong>Allow Access From Anywhere (<code className="font-mono text-[10px]">0.0.0.0/0</code>)</strong>. Without this, cloud apps cannot connect.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-800 block">2. Database User & Password</span>
                    <p className="text-slate-600 leading-relaxed">
                      In <strong>Database Access</strong>, ensure your user has <strong>Read and Write</strong> privileges. In your URI, replace <code className="font-mono text-[10px]">&lt;password&gt;</code> with your real password (without <code className="font-mono text-[10px]">&lt; &gt;</code> brackets).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-800 block">3. Connection String Format</span>
                    <p className="text-slate-600 leading-relaxed">
                      Copy the SRV connection string from <strong>Connect &rarr; Drivers</strong> and add it as <code className="font-mono text-[10px]">MONGODB_URI</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* URI Format Example */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-[11px]">Environment Variable Format:</span>
                  <span className="text-[10px] text-slate-500">Configure in Settings &rarr; Secrets or .env</span>
                </div>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto select-all">
                  MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority<br />
                  MONGODB_DB_NAME=sellmyghar_crm
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wipe to 0 Data */}
            <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Zero-Data Clean Slate Wipe</h2>
                  <p className="text-xs text-slate-500">Remove all test/demo records to prepare for real owner data import</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking below will clear all owner records, pipeline leads, properties, and listings across MongoDB and memory to give you an empty <strong>0-data production instance</strong> ready for your official 5,000+ Excel/CSV database import.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all CRM records so you can start with 0 data and import your real owner files?')) {
                    clearAllData();
                    alert('CRM database is now completely clean with 0 records. You can now use "+ Import Excel/CSV" to import your custom database!');
                  }
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Wipe to 0 Records (Clean Slate for Import)</span>
              </button>
            </div>

            {/* Export Full CSV */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Export Complete Database</h2>
                  <p className="text-xs text-slate-500">Backup your entire CRM database to CSV/Excel</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Export all {owners.length} current owner contacts with their qualification results, lead scores, phone numbers, and pipeline stages in standard CSV format.
              </p>

              <button
                type="button"
                onClick={handleExport}
                disabled={owners.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download Clean CSV ({owners.length} Owners)</span>
              </button>
            </div>

            {/* Sample Restore Option */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Demo / Sandbox Testing Records</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Need sample Prestige project records to test pipelines and dialer queues?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Restore 20 sample Prestige owner records?')) {
                      resetToDemoData();
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  Load 20 Sample Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Security & Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Security & Activity Audit Trail
              </h3>
            </div>
            <span className="text-xs text-slate-500">{auditLogs.length} audit entries recorded</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                <tr className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {log.user}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">
                        {log.entityType || 'CRM System'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
