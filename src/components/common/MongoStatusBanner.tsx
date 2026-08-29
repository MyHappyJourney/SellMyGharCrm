import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';

export const MongoStatusBanner: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const { dbStatus, isDbConnecting, refreshDbStatus } = useCrm();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refreshDbStatus();
    } finally {
      setIsRetrying(false);
    }
  };

  const copyUriTemplate = () => {
    navigator.clipboard.writeText('mongodb+srv://blrrealestates_db_user:sxPfgzVhOSscJzgD@sellmyghar.dqwvhhq.mongodb.net/?retryWrites=true&w=majority&appName=Sellmyghar');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isDismissed) return null;

  // Case 1: Successfully connected to MongoDB Atlas
  if (dbStatus.connected) {
    return (
      <div id="mongo-diagnostic-banner-connected" className="mb-6 bg-emerald-50/90 border border-emerald-200 text-emerald-900 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-emerald-950">MongoDB Atlas Connected & Synchronized</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                  Live Cluster
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Database: <span className="font-mono font-semibold">{dbStatus.database || 'sellmyghar_crm'}</span> • Persistence: All leads, queues, and files auto-syncing in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={handleRetry}
              disabled={isRetrying || isDbConnecting}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Ping Database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying || isDbConnecting ? 'animate-spin' : ''}`} />
              <span>Ping</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-xs text-emerald-700 hover:text-emerald-950 font-medium px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Disconnected or Connection Error
  return (
    <div id="mongo-diagnostic-banner-error" className="mb-6 bg-amber-50/95 border border-amber-300/80 text-amber-950 rounded-2xl p-4 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-amber-950">MongoDB Atlas Diagnostic Notice</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Operating on Local Cache
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {dbStatus.message || 'Connecting to remote cluster...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Logs' : 'View Diagnostic Logs'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleRetry}
            disabled={isRetrying || isDbConnecting}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying || isDbConnecting ? 'animate-spin' : ''}`} />
            <span>{isRetrying || isDbConnecting ? 'Verifying...' : 'Retry Connection'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Diagnostics Drawer */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-amber-200/80 space-y-3 text-xs">
          <div className="bg-amber-900/90 text-amber-100 p-3.5 rounded-xl font-mono text-[11px] space-y-1.5 overflow-x-auto">
            <div className="text-amber-300 font-bold border-b border-amber-700/60 pb-1 flex justify-between items-center">
              <span>Diagnostic Logs & Error Trace:</span>
              <span className="text-[10px] text-amber-400">Timestamp: {new Date().toLocaleTimeString()}</span>
            </div>
            <p><span className="text-amber-400">Status:</span> {dbStatus.connected ? 'Connected' : 'Disconnected / Fallback'}</p>
            <p><span className="text-amber-400">Configured URI:</span> {dbStatus.hasMongoUri ? 'Configured in server' : 'Not configured'}</p>
            {dbStatus.error && (
              <p className="text-rose-300 whitespace-pre-wrap"><span className="text-amber-400">Error Details:</span> {dbStatus.error}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={copyUriTemplate}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 rounded-md text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'URI Copied!' : 'Copy Configured MongoDB URI'}</span>
              </button>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="px-2.5 py-1 bg-amber-200/60 hover:bg-amber-200 text-amber-900 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Open Database Settings
                </button>
              )}
            </div>
            <span className="text-[11px] text-amber-800">
              Atlas Access: IP <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono">0.0.0.0/0</code> must be active.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
