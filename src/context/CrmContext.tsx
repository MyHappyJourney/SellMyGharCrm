import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Owner, 
  Property, 
  Buyer, 
  Tenant, 
  PropertyListing, 
  Transaction, 
  Activity, 
  FollowUpTask, 
  User, 
  Role,
  RolePermissions,
  ScoringRule, 
  CommunicationTemplate, 
  AuditLog, 
  ImportSummaryReport,
  SaleLead,
  RentalLead,
  SalesPipelineStage,
  RentalPipelineStage
} from '../types';
import { 
  DEMO_OWNERS, 
  DEMO_PROPERTIES, 
  DEMO_BUYERS, 
  DEMO_TENANTS, 
  DEMO_LISTINGS, 
  DEMO_TRANSACTIONS, 
  DEMO_ACTIVITIES, 
  DEMO_FOLLOWUPS, 
  DEMO_SALE_LEADS, 
  DEMO_RENTAL_LEADS, 
  INITIAL_USERS, 
  INITIAL_ROLES,
  INITIAL_SCORING_RULES, 
  INITIAL_TEMPLATES 
} from '../data/demoData';
import { calculateLeadScore } from '../utils/scoring';

interface CrmContextType {
  // Data
  owners: Owner[];
  properties: Property[];
  buyers: Buyer[];
  tenants: Tenant[];
  listings: PropertyListing[];
  transactions: Transaction[];
  activities: Activity[];
  followUps: FollowUpTask[];
  saleLeads: SaleLead[];
  rentalLeads: RentalLead[];
  currentUser: User;
  users: User[];
  roles: Role[];
  scoringRules: ScoringRule[];
  templates: CommunicationTemplate[];
  auditLogs: AuditLog[];
  lastImportReport: ImportSummaryReport | null;
  isLoading: boolean;

  // Actions
  addOwner: (owner: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>) => Owner;
  updateOwner: (id: string, updates: Partial<Owner>) => void;
  deleteOwner: (id: string) => void;
  bulkUpdateOwners: (ids: string[], updates: Partial<Owner>) => void;
  bulkDeleteOwners: (ids: string[]) => void;
  qualifyOwner: (id: string, qualification: {
    propertyStatus: Owner['propertyStatus'];
    saleIntent?: Owner['saleIntent'];
    rentalIntent?: Owner['rentalIntent'];
    saleInfo?: Owner['saleInfo'];
    rentalInfo?: Owner['rentalInfo'];
    notes?: string;
  }) => void;
  
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Activity;
  addFollowUp: (followUp: Omit<FollowUpTask, 'id' | 'createdAt'>) => FollowUpTask;
  completeFollowUp: (id: string) => void;
  
  addProperty: (property: Omit<Property, 'id'>) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  
  addListing: (listing: Omit<PropertyListing, 'id' | 'listingDate' | 'viewsCount' | 'enquiriesCount'>) => PropertyListing;
  updateListing: (id: string, updates: Partial<PropertyListing>) => void;
  
  addBuyer: (buyer: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>) => Buyer;
  updateBuyer: (id: string, updates: Partial<Buyer>) => void;
  deleteBuyer: (id: string) => void;
  
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => Tenant;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;

  updateSaleLeadStage: (id: string, stage: SalesPipelineStage) => void;
  updateRentalLeadStage: (id: string, stage: RentalPipelineStage) => void;
  
  importOwners: (importedOwners: Owner[], report: ImportSummaryReport) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  
  // User & RBAC Management
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addRole: (role: Omit<Role, 'id' | 'isSystem'>) => Role;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  getRoleById: (roleId: string) => Role | undefined;
  hasPermission: (module: keyof RolePermissions, action: string) => boolean;

  updateScoringRule: (id: string, updates: Partial<ScoringRule>) => void;
  updateTemplate: (id: string, updates: Partial<CommunicationTemplate>) => void;
  setCurrentUser: (user: User) => void;
  logAudit: (action: AuditLog['action'], details: string, recordId?: string, entityType?: AuditLog['entityType']) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const STORAGE_KEYS = {
  OWNERS: 'smg_crm_owners_v2',
  PROPERTIES: 'smg_crm_properties_v2',
  BUYERS: 'smg_crm_buyers_v2',
  TENANTS: 'smg_crm_tenants_v2',
  LISTINGS: 'smg_crm_listings_v2',
  TRANSACTIONS: 'smg_crm_transactions_v2',
  ACTIVITIES: 'smg_crm_activities_v2',
  FOLLOWUPS: 'smg_crm_followups_v2',
  SALE_LEADS: 'smg_crm_sale_leads_v2',
  RENTAL_LEADS: 'smg_crm_rental_leads_v2',
  USERS: 'smg_crm_users_v2',
  ROLES: 'smg_crm_roles_v2',
  CURRENT_USER_ID: 'smg_crm_current_user_id_v2',
  SCORING_RULES: 'smg_crm_scoring_rules_v2',
  TEMPLATES: 'smg_crm_templates_v2',
  AUDIT_LOGS: 'smg_crm_audit_logs_v2',
  LAST_REPORT: 'smg_crm_last_report_v2',
  INIT_FLAG: 'smg_crm_clean_init_done_v2'
};

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);
  const [saleLeads, setSaleLeads] = useState<SaleLead[]>([]);
  const [rentalLeads, setRentalLeads] = useState<RentalLead[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(INITIAL_SCORING_RULES);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(INITIAL_TEMPLATES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [lastImportReport, setLastImportReport] = useState<ImportSummaryReport | null>(null);

  // Initialize data: Default is 0 data as requested ("Give me a software with 0 data, i will import my data")
  useEffect(() => {
    try {
      const isInitialized = localStorage.getItem(STORAGE_KEYS.INIT_FLAG);
      
      if (isInitialized) {
        setOwners(JSON.parse(localStorage.getItem(STORAGE_KEYS.OWNERS) || '[]'));
        setProperties(JSON.parse(localStorage.getItem(STORAGE_KEYS.PROPERTIES) || '[]'));
        setBuyers(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUYERS) || '[]'));
        setTenants(JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || '[]'));
        setListings(JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]'));
        setTransactions(JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'));
        setActivities(JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]'));
        setFollowUps(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWUPS) || '[]'));
        setSaleLeads(JSON.parse(localStorage.getItem(STORAGE_KEYS.SALE_LEADS) || '[]'));
        setRentalLeads(JSON.parse(localStorage.getItem(STORAGE_KEYS.RENTAL_LEADS) || '[]'));
        
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        const parsedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
        setUsers(parsedUsers);

        const storedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
        const parsedRoles: Role[] = storedRoles ? JSON.parse(storedRoles) : INITIAL_ROLES;
        setRoles(parsedRoles);

        const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        const matchedUser = parsedUsers.find(u => u.id === currentUserId) || parsedUsers[0] || INITIAL_USERS[0];
        setCurrentUser(matchedUser);

        setScoringRules(JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORING_RULES) || JSON.stringify(INITIAL_SCORING_RULES)));
        setTemplates(JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || JSON.stringify(INITIAL_TEMPLATES)));
        setAuditLogs(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]'));
        const report = localStorage.getItem(STORAGE_KEYS.LAST_REPORT);
        if (report) setLastImportReport(JSON.parse(report));
      } else {
        // Clean Initial State: 0 CRM Records (ready for user's own spreadsheet import)
        setOwners([]);
        setProperties([]);
        setBuyers([]);
        setTenants([]);
        setListings([]);
        setTransactions([]);
        setActivities([]);
        setFollowUps([]);
        setSaleLeads([]);
        setRentalLeads([]);
        setUsers(INITIAL_USERS);
        setRoles(INITIAL_ROLES);
        setCurrentUser(INITIAL_USERS[0]);
        setScoringRules(INITIAL_SCORING_RULES);
        setTemplates(INITIAL_TEMPLATES);
        setAuditLogs([
          {
            id: 'aud-clean-start',
            timestamp: new Date().toISOString(),
            user: INITIAL_USERS[0].name,
            action: 'Record created',
            details: 'CRM deployed with 0 records in Clean Slate mode. Ready for Excel / CSV data import.',
            entityType: 'User'
          }
        ]);
        localStorage.setItem(STORAGE_KEYS.INIT_FLAG, 'true');
      }
    } catch (e) {
      console.error('Error loading CRM state:', e);
      setOwners([]);
      setProperties([]);
      setBuyers([]);
      setTenants([]);
      setListings([]);
      setTransactions([]);
      setActivities([]);
      setFollowUps([]);
      setSaleLeads([]);
      setRentalLeads([]);
      setUsers(INITIAL_USERS);
      setRoles(INITIAL_ROLES);
      setCurrentUser(INITIAL_USERS[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(STORAGE_KEYS.INIT_FLAG, 'true');
      localStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(owners));
      localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
      localStorage.setItem(STORAGE_KEYS.BUYERS, JSON.stringify(buyers));
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
      localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(followUps));
      localStorage.setItem(STORAGE_KEYS.SALE_LEADS, JSON.stringify(saleLeads));
      localStorage.setItem(STORAGE_KEYS.RENTAL_LEADS, JSON.stringify(rentalLeads));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
      localStorage.setItem(STORAGE_KEYS.SCORING_RULES, JSON.stringify(scoringRules));
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      if (lastImportReport) {
        localStorage.setItem(STORAGE_KEYS.LAST_REPORT, JSON.stringify(lastImportReport));
      }
    } catch (e) {
      console.error('Failed to sync to localStorage:', e);
    }
  }, [
    owners, properties, buyers, tenants, listings, transactions, 
    activities, followUps, saleLeads, rentalLeads, users, roles, currentUser, scoringRules, 
    templates, auditLogs, lastImportReport, isLoading
  ]);

  const logAudit = useCallback((action: AuditLog['action'], details: string, recordId?: string, entityType?: AuditLog['entityType']) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      action,
      details,
      recordId,
      entityType
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 499)]); // Keep last 500 logs
  }, [currentUser]);

  // Helper to retrieve Role definition
  const getRoleById = useCallback((roleId: string): Role | undefined => {
    return roles.find(r => r.id === roleId) || roles.find(r => r.name.toLowerCase() === roleId.toLowerCase()) || roles[0];
  }, [roles]);

  // Granular Permission Evaluation Helper
  const hasPermission = useCallback((module: keyof RolePermissions, action: string): boolean => {
    const userRole = getRoleById(currentUser.roleId) || roles.find(r => r.id === 'role-super-admin') || roles[0];
    if (!userRole) return true;
    if (userRole.id === 'role-super-admin' || userRole.name === 'Super Admin') return true;

    const modulePerms = userRole.permissions[module] as any;
    if (!modulePerms) return false;

    if (action in modulePerms) {
      const val = modulePerms[action];
      if (typeof val === 'boolean') return val;
      if (val === 'all' || val === 'assigned') return true;
      if (val === 'none') return false;
    }
    return true;
  }, [currentUser, roles, getRoleById]);

  // User Management
  const addUser = useCallback((userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const roleObj = getRoleById(userData.roleId);
    const newUser: User = {
      ...userData,
      id: newId,
      role: roleObj ? roleObj.name : userData.role,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [...prev, newUser]);
    logAudit('Permission changed', `Created team user "${newUser.name}" with role "${newUser.role}" (${newUser.department})`, newId, 'User');
    return newUser;
  }, [getRoleById, logAudit]);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        if (updates.roleId) {
          const roleObj = getRoleById(updates.roleId);
          if (roleObj) updated.role = roleObj.name;
        }
        return updated;
      }
      return u;
    }));

    // If updating current active user, reflect immediately
    if (currentUser.id === id) {
      setCurrentUser(prev => {
        const updated = { ...prev, ...updates };
        if (updates.roleId) {
          const roleObj = getRoleById(updates.roleId);
          if (roleObj) updated.role = roleObj.name;
        }
        return updated;
      });
    }

    logAudit('Permission changed', `Updated user details for "${updates.name || id}"`, id, 'User');
  }, [currentUser, getRoleById, logAudit]);

  const deleteUser = useCallback((id: string) => {
    const target = users.find(u => u.id === id);
    if (users.length <= 1) {
      alert('Cannot delete the last remaining user.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser.id === id) {
      const fallback = users.find(u => u.id !== id) || INITIAL_USERS[0];
      setCurrentUser(fallback);
    }
    logAudit('Record deleted', `Removed user ${target?.name || id}`, id, 'User');
  }, [users, currentUser, logAudit]);

  // Role Management
  const addRole = useCallback((roleData: Omit<Role, 'id' | 'isSystem'>): Role => {
    const newId = `role-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newRole: Role = {
      ...roleData,
      id: newId,
      isSystem: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setRoles(prev => [...prev, newRole]);
    logAudit('Permission changed', `Created custom role policy "${newRole.name}"`);
    return newRole;
  }, [logAudit]);

  const updateRole = useCallback((id: string, updates: Partial<Role>) => {
    setRoles(prev => prev.map(r => r.id === id ? { 
      ...r, 
      ...updates, 
      updatedAt: new Date().toISOString().split('T')[0] 
    } : r));
    logAudit('Permission changed', `Updated permission matrix for role "${updates.name || id}"`);
  }, [logAudit]);

  const deleteRole = useCallback((id: string) => {
    const target = roles.find(r => r.id === id);
    if (target?.isSystem) {
      alert('System default roles cannot be deleted.');
      return;
    }
    // Reassign users with this role to Viewer
    const fallbackRole = roles.find(r => r.id === 'role-viewer') || roles[0];
    setUsers(prev => prev.map(u => u.roleId === id ? { ...u, roleId: fallbackRole.id, role: fallbackRole.name } : u));
    setRoles(prev => prev.filter(r => r.id !== id));
    logAudit('Permission changed', `Deleted role "${target?.name || id}" and reassigned affected users to ${fallbackRole.name}`);
  }, [roles, logAudit]);

  const addOwner = useCallback((ownerData: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>): Owner => {
    const now = new Date().toISOString().split('T')[0];
    const newId = `own-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const scoreResult = calculateLeadScore({
      ...ownerData,
      id: newId,
      createdAt: now,
      updatedAt: now
    } as Owner, scoringRules);

    const newOwner: Owner = {
      ...ownerData,
      id: newId,
      leadScore: scoreResult.score,
      leadTemperature: scoreResult.temperature,
      createdAt: now,
      updatedAt: now
    };

    setOwners(prev => [newOwner, ...prev]);
    logAudit('Record created', `Created owner record for ${newOwner.name} (${newOwner.project} - ${newOwner.flatNumber})`, newId, 'Owner');
    return newOwner;
  }, [scoringRules, logAudit]);

  const updateOwner = useCallback((id: string, updates: Partial<Owner>) => {
    setOwners(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        const scoreResult = calculateLeadScore(updated, scoringRules);
        updated.leadScore = scoreResult.score;
        updated.leadTemperature = scoreResult.temperature;
        return updated;
      }
      return o;
    }));
    logAudit('Record edited', `Updated owner record ${id}`, id, 'Owner');
  }, [scoringRules, logAudit]);

  const deleteOwner = useCallback((id: string) => {
    setOwners(prev => prev.filter(o => o.id !== id));
    logAudit('Record deleted', `Deleted owner record ${id}`, id, 'Owner');
  }, [logAudit]);

  const bulkUpdateOwners = useCallback((ids: string[], updates: Partial<Owner>) => {
    setOwners(prev => prev.map(o => {
      if (ids.includes(o.id)) {
        const updated = { ...o, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        const scoreResult = calculateLeadScore(updated, scoringRules);
        updated.leadScore = scoreResult.score;
        updated.leadTemperature = scoreResult.temperature;
        return updated;
      }
      return o;
    }));
    logAudit('Record edited', `Bulk updated ${ids.length} owner records`);
  }, [scoringRules, logAudit]);

  const bulkDeleteOwners = useCallback((ids: string[]) => {
    setOwners(prev => prev.filter(o => !ids.includes(o.id)));
    logAudit('Record deleted', `Bulk deleted ${ids.length} owner records`);
  }, [logAudit]);

  const qualifyOwner = useCallback((id: string, qualification: {
    propertyStatus: Owner['propertyStatus'];
    saleIntent?: Owner['saleIntent'];
    rentalIntent?: Owner['rentalIntent'];
    saleInfo?: Owner['saleInfo'];
    rentalInfo?: Owner['rentalInfo'];
    notes?: string;
  }) => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return;

    const updates: Partial<Owner> = {
      propertyStatus: qualification.propertyStatus,
      saleIntent: qualification.saleIntent || owner.saleIntent,
      rentalIntent: qualification.rentalIntent || owner.rentalIntent,
      saleInfo: qualification.saleInfo || owner.saleInfo,
      rentalInfo: qualification.rentalInfo || owner.rentalInfo,
      lastContactDate: new Date().toISOString().split('T')[0],
      leadStatus: 'Qualified'
    };

    updateOwner(id, updates);

    // Also record activity
    const newActivity: Activity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ownerId: id,
      type: 'Phone Call',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staff: currentUser.name,
      outcome: `Qualified as ${qualification.propertyStatus}`,
      notes: qualification.notes || `Owner qualified. Status: ${qualification.propertyStatus}`,
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);

    logAudit('Lead qualified', `Owner ${owner.name} qualified as ${qualification.propertyStatus}`, id, 'Owner');
  }, [owners, updateOwner, currentUser, logAudit]);

  const addActivity = useCallback((actData: Omit<Activity, 'id' | 'createdAt'>): Activity => {
    const newAct: Activity = {
      ...actData,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [newAct, ...prev]);
    return newAct;
  }, []);

  const addFollowUp = useCallback((followUpData: Omit<FollowUpTask, 'id' | 'createdAt'>): FollowUpTask => {
    const newFollowUp: FollowUpTask = {
      ...followUpData,
      id: `fu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setFollowUps(prev => [newFollowUp, ...prev]);
    return newFollowUp;
  }, []);

  const completeFollowUp = useCallback((id: string) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'Completed' } : f));
  }, []);

  const addProperty = useCallback((propData: Omit<Property, 'id'>): Property => {
    const newId = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newProp: Property = { ...propData, id: newId };
    setProperties(prev => [newProp, ...prev]);
    return newProp;
  }, []);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addListing = useCallback((listingData: Omit<PropertyListing, 'id' | 'listingDate' | 'viewsCount' | 'enquiriesCount'>): PropertyListing => {
    const newId = `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newListing: PropertyListing = {
      ...listingData,
      id: newId,
      listingDate: new Date().toISOString().split('T')[0],
      viewsCount: 0,
      enquiriesCount: 0
    };
    setListings(prev => [newListing, ...prev]);
    logAudit('Listing published', `Created listing: ${newListing.listingTitle}`, newId, 'Listing');
    return newListing;
  }, [logAudit]);

  const updateListing = useCallback((id: string, updates: Partial<PropertyListing>) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const addBuyer = useCallback((buyerData: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>): Buyer => {
    const now = new Date().toISOString().split('T')[0];
    const newId = `buy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newBuyer: Buyer = { ...buyerData, id: newId, createdAt: now, updatedAt: now };
    setBuyers(prev => [newBuyer, ...prev]);
    logAudit('Record created', `Added buyer requirement for ${newBuyer.name}`, newId);
    return newBuyer;
  }, [logAudit]);

  const updateBuyer = useCallback((id: string, updates: Partial<Buyer>) => {
    setBuyers(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : b));
  }, []);

  const deleteBuyer = useCallback((id: string) => {
    setBuyers(prev => prev.filter(b => b.id !== id));
  }, []);

  const addTenant = useCallback((tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Tenant => {
    const now = new Date().toISOString().split('T')[0];
    const newId = `ten-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTenant: Tenant = { ...tenantData, id: newId, createdAt: now, updatedAt: now };
    setTenants(prev => [newTenant, ...prev]);
    logAudit('Record created', `Added tenant ${newTenant.name}`, newId);
    return newTenant;
  }, [logAudit]);

  const updateTenant = useCallback((id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : t));
  }, []);

  const deleteTenant = useCallback((id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
  }, []);

  const addTransaction = useCallback((txData: Omit<Transaction, 'id'>): Transaction => {
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTx: Transaction = { ...txData, id: txId };
    setTransactions(prev => [newTx, ...prev]);
    logAudit('Record created', `Recorded transaction of ₹${newTx.agreedPriceOrRent.toLocaleString()} (${newTx.dealType})`, txId, 'Transaction');
    return newTx;
  }, [logAudit]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }, []);

  const updateSaleLeadStage = useCallback((id: string, stage: SalesPipelineStage) => {
    setSaleLeads(prev => prev.map(sl => sl.id === id ? { ...sl, stage, updatedAt: new Date().toISOString().split('T')[0] } : sl));
  }, []);

  const updateRentalLeadStage = useCallback((id: string, stage: RentalPipelineStage) => {
    setRentalLeads(prev => prev.map(rl => rl.id === id ? { ...rl, stage, updatedAt: new Date().toISOString().split('T')[0] } : rl));
  }, []);

  const importOwners = useCallback((importedOwners: Owner[], report: ImportSummaryReport) => {
    setOwners(prev => [...importedOwners, ...prev]);
    setLastImportReport(report);
    logAudit('Database imported', `Imported ${importedOwners.length} owners from Excel/CSV file`);
  }, [logAudit]);

  const resetToDemoData = useCallback(() => {
    setOwners(DEMO_OWNERS);
    setProperties(DEMO_PROPERTIES);
    setBuyers(DEMO_BUYERS);
    setTenants(DEMO_TENANTS);
    setListings(DEMO_LISTINGS);
    setTransactions(DEMO_TRANSACTIONS);
    setActivities(DEMO_ACTIVITIES);
    setFollowUps(DEMO_FOLLOWUPS);
    setSaleLeads(DEMO_SALE_LEADS);
    setRentalLeads(DEMO_RENTAL_LEADS);
    setScoringRules(INITIAL_SCORING_RULES);
    setTemplates(INITIAL_TEMPLATES);
    setLastImportReport(null);
    logAudit('Record created', 'Reset database to 20 fictional Prestige owners and benchmark pipeline state');
  }, [logAudit]);

  const clearAllData = useCallback(() => {
    setOwners([]);
    setProperties([]);
    setBuyers([]);
    setTenants([]);
    setListings([]);
    setTransactions([]);
    setActivities([]);
    setFollowUps([]);
    setSaleLeads([]);
    setRentalLeads([]);
    setLastImportReport(null);
    logAudit('Record deleted', 'Cleared all CRM records to clean slate (0 records)');
  }, [logAudit]);

  const updateScoringRule = useCallback((id: string, updates: Partial<ScoringRule>) => {
    setScoringRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    logAudit('Record edited', `Updated scoring rule ${id}`);
  }, [logAudit]);

  const updateTemplate = useCallback((id: string, updates: Partial<CommunicationTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    logAudit('Record edited', `Updated communication template ${id}`);
  }, [logAudit]);

  return (
    <CrmContext.Provider value={{
      owners,
      properties,
      buyers,
      tenants,
      listings,
      transactions,
      activities,
      followUps,
      saleLeads,
      rentalLeads,
      currentUser,
      users,
      roles,
      scoringRules,
      templates,
      auditLogs,
      lastImportReport,
      isLoading,
      addOwner,
      updateOwner,
      deleteOwner,
      bulkUpdateOwners,
      bulkDeleteOwners,
      qualifyOwner,
      addActivity,
      addFollowUp,
      completeFollowUp,
      addProperty,
      updateProperty,
      addListing,
      updateListing,
      addBuyer,
      updateBuyer,
      deleteBuyer,
      addTenant,
      updateTenant,
      deleteTenant,
      addTransaction,
      updateTransaction,
      updateSaleLeadStage,
      updateRentalLeadStage,
      importOwners,
      resetToDemoData,
      clearAllData,
      addUser,
      updateUser,
      deleteUser,
      addRole,
      updateRole,
      deleteRole,
      getRoleById,
      hasPermission,
      updateScoringRule,
      updateTemplate,
      setCurrentUser,
      logAudit
    }}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};

