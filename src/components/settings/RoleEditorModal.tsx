import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  PhoneCall, 
  Building, 
  DollarSign, 
  Lock, 
  CheckCircle2, 
  FileSpreadsheet,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Role, RolePermissions } from '../../types';

interface RoleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole?: Role | null;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
  owners: {
    view: 'all',
    create: true,
    edit: true,
    delete: false,
    export: false,
    viewUnmaskedPhone: true
  },
  telecaller: {
    access: true,
    callAndLog: true,
    qualifyLeads: true,
    reassignLeads: false
  },
  buyers: {
    view: 'all',
    create: true,
    edit: true,
    delete: false
  },
  tenants: {
    view: 'all',
    create: true,
    edit: true,
    delete: false
  },
  listings: {
    view: true,
    create: true,
    edit: true,
    verify: false,
    publish: false,
    delete: false
  },
  deals: {
    view: 'assigned',
    managePipeline: true,
    recordRevenue: false,
    closeDeals: false
  },
  admin: {
    importData: false,
    exportData: false,
    manageUsers: false,
    manageRoles: false,
    manageScoringRules: false,
    viewAuditLogs: false,
    clearOrResetDatabase: false
  }
};

export const RoleEditorModal: React.FC<RoleEditorModalProps> = ({
  isOpen,
  onClose,
  editingRole
}) => {
  const { addRole, updateRole } = useCrm();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name || '');
      setDescription(editingRole.description || '');
      setColor(editingRole.color || 'blue');
      setPermissions(editingRole.permissions || DEFAULT_PERMISSIONS);
    } else {
      setName('');
      setDescription('');
      setColor('blue');
      setPermissions(DEFAULT_PERMISSIONS);
    }
  }, [editingRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a Role Name.');
      return;
    }

    if (editingRole) {
      updateRole(editingRole.id, {
        name,
        description,
        color,
        permissions
      });
    } else {
      addRole({
        name,
        description,
        color,
        permissions
      });
    }

    onClose();
  };

  const updateOwnerPerm = (key: keyof RolePermissions['owners'], val: any) => {
    setPermissions(prev => ({
      ...prev,
      owners: { ...prev.owners, [key]: val }
    }));
  };

  const updateTelecallerPerm = (key: keyof RolePermissions['telecaller'], val: boolean) => {
    setPermissions(prev => ({
      ...prev,
      telecaller: { ...prev.telecaller, [key]: val }
    }));
  };

  const updateBuyersPerm = (key: keyof RolePermissions['buyers'], val: any) => {
    setPermissions(prev => ({
      ...prev,
      buyers: { ...prev.buyers, [key]: val }
    }));
  };

  const updateTenantsPerm = (key: keyof RolePermissions['tenants'], val: any) => {
    setPermissions(prev => ({
      ...prev,
      tenants: { ...prev.tenants, [key]: val }
    }));
  };

  const updateListingsPerm = (key: keyof RolePermissions['listings'], val: boolean) => {
    setPermissions(prev => ({
      ...prev,
      listings: { ...prev.listings, [key]: val }
    }));
  };

  const updateDealsPerm = (key: keyof RolePermissions['deals'], val: any) => {
    setPermissions(prev => ({
      ...prev,
      deals: { ...prev.deals, [key]: val }
    }));
  };

  const updateAdminPerm = (key: keyof RolePermissions['admin'], val: boolean) => {
    setPermissions(prev => ({
      ...prev,
      admin: { ...prev.admin, [key]: val }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingRole ? `Edit Role Policy: ${editingRole.name}` : 'Define New Role & Permission Policy'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure module-level access control, data privacy, and executive privileges.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Role Header Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Area Manager"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Color Accent
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="blue">Blue (Standard)</option>
                <option value="purple">Purple (Management)</option>
                <option value="emerald">Emerald (Telecaller)</option>
                <option value="amber">Amber (Field Agent)</option>
                <option value="indigo">Indigo (Inventory)</option>
                <option value="rose">Rose (Security / Red)</option>
                <option value="slate">Slate (Compliance)</option>
                <option value="cyan">Cyan (Viewer)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Description / Intent
              </label>
              <input
                type="text"
                placeholder="Brief summary of duties and data access boundaries..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Granular Permissions Matrix */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Module Access & Security Permissions Matrix
            </h3>

            {/* 1. Owner CRM & Privacy */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Owner Database & Contact Privacy</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500 font-medium">Record Visibility:</span>
                  <select
                    value={permissions.owners.view}
                    onChange={(e) => updateOwnerPerm('view', e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-semibold"
                  >
                    <option value="all">View All Project Owners</option>
                    <option value="assigned">View Only Assigned Leads</option>
                    <option value="none">No Access (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.owners.create}
                    onChange={(e) => updateOwnerPerm('create', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Add Owners</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.owners.edit}
                    onChange={(e) => updateOwnerPerm('edit', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Edit Records</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.owners.viewUnmaskedPhone}
                    onChange={(e) => updateOwnerPerm('viewUnmaskedPhone', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-semibold text-blue-900">View Unmasked Phone</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.owners.export}
                    onChange={(e) => updateOwnerPerm('export', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Export to Excel/CSV</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.owners.delete}
                    onChange={(e) => updateOwnerPerm('delete', e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-700 font-medium">Delete Owners</span>
                </label>
              </div>
            </div>

            {/* 2. Telecaller Queue & Dialer */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <PhoneCall className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Telecaller Queue & Calling Workflow</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.telecaller.access}
                    onChange={(e) => updateTelecallerPerm('access', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Access Calling Queue</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.telecaller.callAndLog}
                    onChange={(e) => updateTelecallerPerm('callAndLog', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Log Call Dispositions</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.telecaller.qualifyLeads}
                    onChange={(e) => updateTelecallerPerm('qualifyLeads', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Submit Owner Qualification</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.telecaller.reassignLeads}
                    onChange={(e) => updateTelecallerPerm('reassignLeads', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Reassign Call Queue</span>
                </label>
              </div>
            </div>

            {/* 3. Verified Listings Management */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Verified Inventory & Listings</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.listings.view}
                    onChange={(e) => updateListingsPerm('view', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">View Listings</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.listings.create}
                    onChange={(e) => updateListingsPerm('create', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Create Listings</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.listings.edit}
                    onChange={(e) => updateListingsPerm('edit', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Edit Pricing/Info</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.listings.verify}
                    onChange={(e) => updateListingsPerm('verify', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-semibold text-indigo-900">Verify Property</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.listings.publish}
                    onChange={(e) => updateListingsPerm('publish', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Publish Portals</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.listings.delete}
                    onChange={(e) => updateListingsPerm('delete', e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-700">Delete Listings</span>
                </label>
              </div>
            </div>

            {/* 4. Sales & Rental Deals Pipeline */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Deals, Pipelines & Revenue</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500 font-medium">Pipeline View:</span>
                  <select
                    value={permissions.deals.view}
                    onChange={(e) => updateDealsPerm('view', e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-semibold"
                  >
                    <option value="all">View Company Pipelines</option>
                    <option value="assigned">View Only My Deals</option>
                    <option value="none">No Deals Access</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.deals.managePipeline}
                    onChange={(e) => updateDealsPerm('managePipeline', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">Move Kanban Stages</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.deals.recordRevenue}
                    onChange={(e) => updateDealsPerm('recordRevenue', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Record Transaction Revenue</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.deals.closeDeals}
                    onChange={(e) => updateDealsPerm('closeDeals', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-semibold text-emerald-900">Mark Won / Closed</span>
                </label>
              </div>
            </div>

            {/* 5. System Administration & Security */}
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-950">Executive & System Privileges</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded">
                  High Impact Privileges
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.admin.importData}
                    onChange={(e) => updateAdminPerm('importData', e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800 font-medium">Import Excel / CSV</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.admin.manageUsers}
                    onChange={(e) => updateAdminPerm('manageUsers', e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800 font-medium">Manage Team Users</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.admin.manageRoles}
                    onChange={(e) => updateAdminPerm('manageRoles', e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800 font-medium">Edit RBAC Policies</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.admin.manageScoringRules}
                    onChange={(e) => updateAdminPerm('manageScoringRules', e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800">Scoring Weights</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.admin.viewAuditLogs}
                    onChange={(e) => updateAdminPerm('viewAuditLogs', e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800">View Audit Logs</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={permissions.admin.clearOrResetDatabase}
                    onChange={(e) => updateAdminPerm('clearOrResetDatabase', e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-900 font-bold">Database Reset / Zero-Data Wipe</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{editingRole ? 'Save Policy Changes' : 'Create Role Policy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
