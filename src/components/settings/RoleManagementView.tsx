import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Users, 
  Lock, 
  Check, 
  X, 
  ShieldAlert, 
  Eye,
  PhoneCall,
  Building,
  DollarSign,
  Settings
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Role } from '../../types';
import { RoleEditorModal } from './RoleEditorModal';

export const RoleManagementView: React.FC = () => {
  const { roles, users, addRole, deleteRole, updateRole } = useCrm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleOpenAdd = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleClone = (role: Role) => {
    addRole({
      name: `${role.name} (Copy)`,
      description: `Cloned from ${role.name}: ${role.description}`,
      color: role.color,
      permissions: JSON.parse(JSON.stringify(role.permissions))
    });
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem) {
      alert('System core roles cannot be deleted to preserve system integrity.');
      return;
    }
    const assignedCount = users.filter(u => u.roleId === role.id || u.role === role.name).length;
    if (assignedCount > 0) {
      alert(`Cannot delete this role because ${assignedCount} user(s) are currently assigned to it. Reassign them first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete custom role "${role.name}"?`)) {
      deleteRole(role.id);
    }
  };

  const getBadgeColorClasses = (color?: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'amber':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'rose':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'slate':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'cyan':
        return 'bg-cyan-100 text-cyan-900 border-cyan-200';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900">Role-Based Access Control (RBAC) Policies</h2>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
              {roles.length} Active Policies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Define security boundaries, data visibility rules (view all vs assigned), unmasked phone viewing rights, and administrative capabilities.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Role Policy</span>
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map(role => {
          const assignedUsers = users.filter(u => u.roleId === role.id || u.role === role.name);
          const p = role.permissions;

          return (
            <div 
              key={role.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Top Badge & System Flag */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getBadgeColorClasses(role.color)}`}>
                    {role.name}
                  </span>
                  {role.isSystem ? (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200">
                      System Core
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200">
                      Custom Policy
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] leading-relaxed">
                  {role.description || 'Configured access policy for team members.'}
                </p>

                {/* Permissions Breakdown Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    Key Permissions
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      p.owners.view === 'all' ? 'bg-blue-50 text-blue-800' : p.owners.view === 'assigned' ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      Owners: {p.owners.view === 'all' ? 'View All' : p.owners.view === 'assigned' ? 'View Assigned' : 'Hidden'}
                    </span>

                    {p.owners.viewUnmaskedPhone ? (
                      <span className="px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ✓ Unmasked Numbers
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-500">
                        Masked Phone
                      </span>
                    )}

                    {p.telecaller.access && (
                      <span className="px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-800">
                        ✓ Telecaller Queue
                      </span>
                    )}

                    {p.listings.verify && (
                      <span className="px-2 py-0.5 rounded font-medium bg-indigo-50 text-indigo-800">
                        ✓ Verify Listings
                      </span>
                    )}

                    {p.deals.recordRevenue && (
                      <span className="px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800">
                        ✓ Revenue Access
                      </span>
                    )}

                    {p.admin.manageUsers && (
                      <span className="px-2 py-0.5 rounded font-medium bg-purple-50 text-purple-800">
                        ✓ Manage Users
                      </span>
                    )}

                    {p.admin.importData && (
                      <span className="px-2 py-0.5 rounded font-medium bg-cyan-50 text-cyan-800">
                        ✓ Import Excel
                      </span>
                    )}

                    {p.admin.clearOrResetDatabase && (
                      <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">
                        ⚠️ Database Wipe
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: User Count & Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{assignedUsers.length}</span>
                  <span>{assignedUsers.length === 1 ? 'user' : 'users'} assigned</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleClone(role)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Clone Role Policy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(role)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Role Policy"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDelete(role)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Permission Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cross-Role Permission Matrix Comparison
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Live capability grid across all system & custom roles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-3 px-4 min-w-[200px]">Module Capability</th>
                {roles.map(r => (
                  <th key={r.id} className="py-3 px-3 text-center min-w-[120px]">
                    <span className="font-bold text-slate-900 block truncate">{r.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Owner CRM */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Owner CRM: Visibility</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center text-[11px] font-medium text-slate-700">
                    {r.permissions.owners.view === 'all' ? 'All Records' : r.permissions.owners.view === 'assigned' ? 'Assigned Only' : 'None'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 text-slate-700">Owner CRM: Unmasked Phone Numbers</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.owners.viewUnmaskedPhone ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 text-slate-700">Owner CRM: Delete Owner Records</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.owners.delete ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>

              {/* Telecalling */}
              <tr className="hover:bg-slate-50/50 bg-slate-50/20">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Telecaller: Lead Qualification</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.telecaller.qualifyLeads ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>

              {/* Verified Listings */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Listings: Verify & Publish Portals</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.listings.verify ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>

              {/* Deals & Revenue */}
              <tr className="hover:bg-slate-50/50 bg-slate-50/20">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Deals: Record Revenue & Close Deals</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.deals.recordRevenue ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>

              {/* System Admin */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Admin: Import Excel/CSV Data</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.admin.importData ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Admin: Manage Users & Roles</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.admin.manageUsers ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-semibold text-rose-900">Admin: Reset / Wipe Database</td>
                {roles.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center">
                    {r.permissions.admin.clearOrResetDatabase ? (
                      <Check className="h-4 w-4 text-rose-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Editor Modal */}
      <RoleEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
        }}
        editingRole={editingRole}
      />
    </div>
  );
};
