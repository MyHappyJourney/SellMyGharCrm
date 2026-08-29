import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Building2, Phone, Mail, Percent, Briefcase, CheckCircle } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { User, UserRole } from '../../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: User | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  editingUser
}) => {
  const { roles, addUser, updateUser } = useCrm();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || 'role-super-admin');
  const [department, setDepartment] = useState('Sales');
  const [designation, setDesignation] = useState('Senior Property Advisor');
  const [branch, setBranch] = useState('Bengaluru Central HQ');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [commissionPercentage, setCommissionPercentage] = useState<number>(15);
  const [assignedProjects, setAssignedProjects] = useState<string>('Prestige Falcon City, Prestige Shantiniketan');

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || '');
      setEmail(editingUser.email || '');
      setPhone(editingUser.phone || '');
      setRoleId(editingUser.roleId || roles.find(r => r.name === editingUser.role)?.id || roles[0]?.id || '');
      setDepartment(editingUser.department || 'Sales');
      setDesignation(editingUser.designation || 'Property Advisor');
      setBranch(editingUser.branch || 'Bengaluru Central HQ');
      setStatus(editingUser.status || 'Active');
      setCommissionPercentage(editingUser.commissionPercentage ?? 15);
      setAssignedProjects(editingUser.assignedProjects?.join(', ') || 'All Prestige Projects');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRoleId(roles[1]?.id || roles[0]?.id || 'role-sales-manager');
      setDepartment('Sales');
      setDesignation('Sales Executive');
      setBranch('Bengaluru Central HQ');
      setStatus('Active');
      setCommissionPercentage(15);
      setAssignedProjects('Prestige Falcon City, Prestige Lakeside Habitat');
    }
  }, [editingUser, roles, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please provide at least a User Name and Work Email.');
      return;
    }

    const projectsList = assignedProjects
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const selectedRole = roles.find(r => r.id === roleId);

    if (editingUser) {
      updateUser(editingUser.id, {
        name,
        email,
        phone,
        roleId,
        role: (selectedRole?.name || 'Sales Agent') as UserRole,
        department,
        designation,
        branch,
        status,
        commissionPercentage: Number(commissionPercentage),
        assignedProjects: projectsList.length ? projectsList : ['All Projects']
      });
    } else {
      addUser({
        name,
        email,
        phone,
        roleId,
        role: (selectedRole?.name || 'Sales Agent') as UserRole,
        department,
        designation,
        branch,
        status,
        commissionPercentage: Number(commissionPercentage),
        assignedProjects: projectsList.length ? projectsList : ['All Projects'],
        lastLogin: 'Never'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingUser ? `Edit Team Member: ${editingUser.name}` : 'Provision New CRM User'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure user identity, system role, department, and branch assignments.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Identity Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
              <span>User Profile & Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh.k@sellmyghar.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Mobile / Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. +91 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Portfolio Advisor"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Role & Access Policy */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>Role Assignment & Security Level</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Role (RBAC Policy) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isSystem ? '(Default Policy)' : '(Custom Role)'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {roles.find(r => r.id === roleId)?.description || 'Grants specific dataset and feature permissions.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Sales">Sales & Business Development</option>
                  <option value="Telecalling">Telecalling & Lead Verification</option>
                  <option value="Field Operations">Field Operations & Inspections</option>
                  <option value="Inventory & Listings">Inventory & Listings Management</option>
                  <option value="Management">Executive Management</option>
                  <option value="Compliance">Compliance & Auditing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch / Operating Hub
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru Central HQ"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <div className="flex items-center space-x-3 pt-1">
                  <label className="inline-flex items-center cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={status === 'Active'}
                      onChange={() => setStatus('Active')}
                      className="text-blue-600 focus:ring-blue-500 mr-1.5"
                    />
                    Active (Allowed Login)
                  </label>
                  <label className="inline-flex items-center cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={status === 'Inactive'}
                      onChange={() => setStatus('Inactive')}
                      className="text-slate-400 focus:ring-slate-400 mr-1.5"
                    />
                    Inactive (Suspended)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Scope */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Percent className="h-3.5 w-3.5 text-blue-600" />
              <span>Commission Split & Assigned Prestige Projects</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal Commission (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Prestige Projects (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prestige Shantiniketan, Prestige Lakeside Habitat, Prestige Golfshire"
                  value={assignedProjects}
                  onChange={(e) => setAssignedProjects(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Enter "All Prestige Projects" for unrestricted project assignment.</p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
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
              <CheckCircle className="h-4 w-4" />
              <span>{editingUser ? 'Save User Changes' : 'Create User Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
