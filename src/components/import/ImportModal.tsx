import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Sparkles, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  Layers,
  Database
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { 
  parseFile, 
  autoDetectColumnMappings, 
  detectDuplicates, 
  createOwnerFromRow, 
  generateSampleExcelBuffer, 
  FIELD_KEYWORDS, 
  ParseResult 
} from '../../utils/csvExcelParser';
import { ImportColumnMapping, DuplicateRecordCandidate, ImportSummaryReport, Owner } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { owners, importOwners, logAudit } = useCrm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mappings, setMappings] = useState<ImportColumnMapping[]>([]);
  const [defaultProject, setDefaultProject] = useState<string>('Prestige Falcon City');
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateRecordCandidate[]>([]);
  const [globalDuplicateAction, setGlobalDuplicateAction] = useState<'skip' | 'update' | 'merge' | 'create_new'>('skip');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importReport, setImportReport] = useState<ImportSummaryReport | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    setIsProcessing(true);
    try {
      setFile(selectedFile);
      const parsed = await parseFile(selectedFile);
      setParseResult(parsed);
      const detectedMappings = autoDetectColumnMappings(parsed.headers);
      setMappings(detectedMappings);
      setStep(2);
    } catch (err: any) {
      alert(`Error parsing file: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSample = () => {
    const buffer = generateSampleExcelBuffer(30);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Prestige_Owner_Sample_Database.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleMappingChange = (csvHeader: string, crmField: string) => {
    setMappings(prev => prev.map(m => m.csvHeader === csvHeader ? { ...m, crmField } : m));
  };

  const proceedToDuplicateCheck = () => {
    if (!parseResult) return;
    setIsProcessing(true);
    try {
      const { candidates } = detectDuplicates(parseResult.rows, mappings, owners, defaultProject);
      setDuplicateCandidates(candidates);
      setStep(3);
    } catch (err: any) {
      alert(`Error checking duplicates: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeImport = () => {
    if (!parseResult) return;
    setIsProcessing(true);

    try {
      const existingPhoneSet = new Set<string>();
      const existingEmailSet = new Set<string>();
      const existingFlatSet = new Set<string>();

      owners.forEach(o => {
        if (o.primaryPhone) existingPhoneSet.add(o.primaryPhone.replace(/\D/g, '').slice(-10));
        if (o.email) existingEmailSet.add(o.email.toLowerCase());
        if (o.flatNumber && o.project) existingFlatSet.add(`${o.project.toLowerCase()}:::${o.flatNumber.toLowerCase()}`);
      });

      const newOwners: Owner[] = [];
      let duplicateCount = 0;
      let updatedCount = 0;
      let invalidPhonesCount = 0;
      let missingFlatCount = 0;

      // Find mapping for phone & flat
      const phoneMapping = mappings.find(m => m.crmField === 'primaryPhone');
      const flatMapping = mappings.find(m => m.crmField === 'flatNumber');

      for (const row of parseResult.rows) {
        const rawPhone = phoneMapping ? row[phoneMapping.csvHeader] : '';
        const phoneDigits = rawPhone ? rawPhone.replace(/\D/g, '').slice(-10) : '';
        const rawFlat = flatMapping ? row[flatMapping.csvHeader] : '';

        if (!rawFlat) missingFlatCount++;
        if (!phoneDigits || phoneDigits.length < 10) invalidPhonesCount++;

        const isDuplicate = phoneDigits && existingPhoneSet.has(phoneDigits);

        if (isDuplicate) {
          duplicateCount++;
          if (globalDuplicateAction === 'skip') {
            continue;
          }
        }

        const owner = createOwnerFromRow(row, mappings, defaultProject);
        newOwners.push(owner);
        if (phoneDigits) existingPhoneSet.add(phoneDigits);
      }

      const report: ImportSummaryReport = {
        totalRows: parseResult.totalRows,
        importedCount: newOwners.length,
        duplicateCount,
        updatedCount,
        skippedCount: parseResult.totalRows - newOwners.length,
        invalidPhones: invalidPhonesCount,
        invalidEmails: 0,
        missingMandatoryFields: missingFlatCount,
        importDate: new Date().toISOString().split('T')[0]
      };

      setImportReport(report);
      importOwners(newOwners, report);
      setStep(4);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setMappings([]);
    setDuplicateCandidates([]);
    setImportReport(null);
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Excel / CSV Owner Database Import</h2>
              <p className="text-xs text-slate-300">Seamlessly ingest up to 10,000 Prestige owner records</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Stepper Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-amber-700' : 'text-slate-400'}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span>Upload File</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-amber-700' : 'text-slate-400'}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>Column Mapping</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-amber-700' : 'text-slate-400'}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>Duplicate Strategy</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className={`flex items-center space-x-2 ${step >= 4 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
            <span>Summary & Finish</span>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-amber-600 bg-amber-50/50 scale-[1.01]' 
                    : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="h-16 w-16 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Click to browse or drop your Excel / CSV file here
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                  Supports .xlsx, .xls, and .csv files with up to 10,000 rows. No manual restructuring needed.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-slate-400">
                  <span>Columns matched:</span>
                  <span className="font-mono text-slate-600 font-bold">Name, Co-Owner, Flat No, Block, Contact Number, Alternate 1-5, Email Id</span>
                </div>
              </div>

              {/* Sample Template Helper */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-200/70 text-amber-900 rounded-lg">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-950">Want to test with sample Prestige data?</p>
                    <p className="text-[11px] text-amber-800">Download our sample 30-owner Excel template with realistic Bengaluru Prestige records.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
                >
                  Download Sample Excel
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 2 && parseResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Map Columns to CRM Fields</h3>
                  <p className="text-xs text-slate-500">
                    File: <span className="font-bold text-slate-700">{file?.name}</span> ({parseResult.totalRows.toLocaleString()} rows detected)
                  </p>
                </div>
                
                {/* Default Project Setter */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-semibold text-slate-600">Default Project:</label>
                  <input
                    type="text"
                    value={defaultProject}
                    onChange={(e) => setDefaultProject(e.target.value)}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
                    placeholder="e.g. Prestige Falcon City"
                  />
                </div>
              </div>

              {/* Mappings Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-4">Your File Column</th>
                      <th className="py-2.5 px-4">Sample Data (Row 1)</th>
                      <th className="py-2.5 px-4">Mapped CRM Field</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mappings.map((m) => {
                      const sampleVal = parseResult.rows[0] ? parseResult.rows[0][m.csvHeader] : '';
                      const isMapped = m.crmField !== 'ignore';

                      return (
                        <tr key={m.csvHeader} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{m.csvHeader}</td>
                          <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px] truncate max-w-xs">
                            {sampleVal || <span className="text-slate-300 italic">empty</span>}
                          </td>
                          <td className="py-2.5 px-4">
                            <select
                              value={m.crmField}
                              onChange={(e) => handleMappingChange(m.csvHeader, e.target.value)}
                              className="w-full text-xs font-medium py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            >
                              <option value="ignore">❌ Ignore Column</option>
                              {Object.entries(FIELD_KEYWORDS).map(([fieldKey, config]) => (
                                <option key={fieldKey} value={fieldKey}>
                                  ✓ {config.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {isMapped ? (
                              <span className="inline-flex items-center text-emerald-600 font-semibold text-[11px]">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mapped
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Skipped</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Data Preview Table (First 3 rows) */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Raw Data Preview</h4>
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-40 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        {parseResult.headers.map(h => (
                          <th key={h} className="py-2 px-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.rows.slice(0, 3).map((r, rIdx) => (
                        <tr key={rIdx}>
                          {parseResult.headers.map(h => (
                            <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                              {r[h] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Duplicate Resolution */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Duplicate Detection & Resolution</h3>
                <p className="text-xs text-slate-500">
                  Cross-checked against {owners.length.toLocaleString()} existing CRM records
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-semibold text-slate-500">Total Rows in File</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{parseResult?.totalRows.toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-xl border ${duplicateCandidates.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                  <span className="text-xs font-semibold">Duplicates Detected</span>
                  <p className="text-2xl font-black mt-1">{duplicateCandidates.length}</p>
                </div>
              </div>

              {/* Duplicate Resolution Strategy Selector */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Duplicate Handling Rule:</h4>
                <div className="space-y-2">
                  <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="dupAction"
                      value="skip"
                      checked={globalDuplicateAction === 'skip'}
                      onChange={() => setGlobalDuplicateAction('skip')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Skip Duplicates (Recommended)</p>
                      <p className="text-[11px] text-slate-500">Existing records, notes, and qualified statuses remain completely untouched.</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="dupAction"
                      value="update"
                      checked={globalDuplicateAction === 'update'}
                      onChange={() => setGlobalDuplicateAction('update')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Update Existing Records</p>
                      <p className="text-[11px] text-slate-500">Updates contact numbers and email without overwriting qualification stage or notes.</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="dupAction"
                      value="create_new"
                      checked={globalDuplicateAction === 'create_new'}
                      onChange={() => setGlobalDuplicateAction('create_new')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Import All Rows As New</p>
                      <p className="text-[11px] text-slate-500">Allows multiple entries for the same owner or unit.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sample Duplicate Preview */}
              {duplicateCandidates.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sample Detected Duplicates</h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                    {duplicateCandidates.slice(0, 4).map((cand, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{cand.existingOwner.name} ({cand.existingOwner.project} - {cand.existingOwner.flatNumber})</p>
                          <p className="text-[11px] text-slate-500">Matched by: <span className="font-bold text-amber-700">{cand.matchedBy}</span> ({cand.existingOwner.primaryPhone})</p>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                          Will {globalDuplicateAction}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Summary Report */}
          {step === 4 && importReport && (
            <div className="space-y-6 text-center py-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Database Imported Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your Prestige owner records are ready in the CRM with initial "Unknown" status as mandated.
                </p>
              </div>

              {/* Summary Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-medium">Total Rows</span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{importReport.totalRows.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] text-emerald-800 font-medium">New Added</span>
                  <p className="text-xl font-bold text-emerald-950 mt-0.5">{importReport.importedCount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[11px] text-amber-800 font-medium">Duplicates Handled</span>
                  <p className="text-xl font-bold text-amber-950 mt-0.5">{importReport.duplicateCount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[11px] text-blue-800 font-medium">Phones Formatted</span>
                  <p className="text-xl font-bold text-blue-950 mt-0.5">{importReport.importedCount.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-xl mx-auto text-xs text-slate-600 text-left space-y-1.5">
                <p className="font-bold text-slate-800">✅ Next Steps for Acquisition:</p>
                <p>1. Open <strong>Telecaller Queue</strong> to start calling qualified owners.</p>
                <p>2. Use the <strong>Owner Qualification</strong> form during call interactions to update sale/rental intent without guessing.</p>
                <p>3. High intent owners will automatically appear in your <strong>Sales & Rental Kanban Pipelines</strong>.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <button
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-3">
            {step === 2 && (
              <button
                onClick={proceedToDuplicateCheck}
                disabled={isProcessing}
                className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all shadow-xs"
              >
                <span>Continue to Duplicates</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={executeImport}
                disabled={isProcessing}
                className="inline-flex items-center space-x-2 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-md active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Importing Records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Ingest Database</span>
                  </>
                )}
              </button>
            )}

            {step === 4 && (
              <button
                onClick={onClose}
                className="px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-md"
              >
                Close & View Owners
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
