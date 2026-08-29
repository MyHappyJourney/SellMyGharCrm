import React, { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  Plus, 
  Edit3, 
  Sparkles, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { CommunicationTemplate } from '../../types';

export const TemplatesView: React.FC = () => {
  const { templates, currentUser } = useCrm();

  const [activeChannel, setActiveChannel] = useState<'All' | 'WhatsApp' | 'Email' | 'SMS'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Preview data
  const sampleOwner = {
    name: 'Vikramaditya Rao',
    project: 'Prestige Falcon City',
    flatNumber: 'Tower 3, Flat 1402',
    bhk: '3 BHK',
    price: '2.15 Crores',
    rent: '55,000/month',
    agentName: currentUser.name,
    phone: '+91 98450 12345'
  };

  const renderSampleText = (content: string) => {
    return content
      .replace(/{ownerName}/g, sampleOwner.name)
      .replace(/{project}/g, sampleOwner.project)
      .replace(/{flatNumber}/g, sampleOwner.flatNumber)
      .replace(/{bhk}/g, sampleOwner.bhk)
      .replace(/{price}/g, sampleOwner.price)
      .replace(/{rent}/g, sampleOwner.rent)
      .replace(/{agentName}/g, sampleOwner.agentName);
  };

  const handleCopy = (t: CommunicationTemplate) => {
    const text = renderSampleText(t.content);
    navigator.clipboard.writeText(text);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTemplates = templates.filter(t => activeChannel === 'All' || t.channel === activeChannel);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Outreach & WhatsApp Templates</h1>
            <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-300">
              {templates.length} Active Templates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-approved high-conversion outreach scripts and mandates for Prestige owners, buyers, and tenants.
          </p>
        </div>

        {/* Channel Filters */}
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-100 text-xs">
          {(['All', 'WhatsApp', 'Email', 'SMS'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeChannel === ch ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTemplates.map((t) => {
          const preview = renderSampleText(t.content);

          return (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.title}</h3>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">{t.channel}</span>
                      <span>•</span>
                      <span>Audience: <strong>{t.audience}</strong></span>
                      <span>•</span>
                      <span>Type: <strong>{t.type}</strong></span>
                    </div>
                  </div>

                  {t.subject && (
                    <span className="text-[10px] text-slate-500 font-medium italic truncate max-w-xs">
                      Sub: {t.subject}
                    </span>
                  )}
                </div>

                {/* Body Preview */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {preview}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Merge tags: <code className="text-amber-700 font-mono">{"{ownerName}"}, {"{project}"}, {"{flatNumber}"}</code></span>

                <button
                  onClick={() => handleCopy(t)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-2xs"
                >
                  {copiedId === t.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Formatted Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
