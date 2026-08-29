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
  RentalPipelineStage,
  DatabaseStatus
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

  // Database & MongoDB Sync Status
  dbStatus: DatabaseStatus;
  isDbSyncing: boolean;
  lastDbSyncTime: string | null;
  refreshDbStatus: () => Promise<void>;
  syncToDatabase: (customPayload?: any) => Promise<boolean>;

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
  const [isDbSyncing, setIsDbSyncing] = useState(false);
  const [lastDbSyncTime, setLastDbSyncTime] = useState<string | null>(null);

  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false,
    type: 'local_persistent',
    dbName: 'Connecting...',
    hasMongoUri: false,
    isSyncing: false,
    lastSyncedAt: null,
    counts: {
      owners: 0,
      properties: 0,
      saleLeads: 0,
      rentalLeads: 0,
      activities: 0,
      followUps: 0,
      users: 0,
      auditLogs: 0
    }
  });

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

  // Fetch live database status
  const refreshDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(prev => ({
          ...data,
          isSyncing: prev.isSyncing,
          lastSyncedAt: prev.lastSyncedAt
        }));
      }
    } catch (err) {
      console.warn('Could not fetch DB status:', err);
    }
  }, []);

  // Initialize data: Load from server database (MongoDB / persistent disk) first
  useEffect(() => {
    let isMounted = true;

    async function initializeCrmState() {
      try {
        refreshDbStatus();

        // 1. Read local cache first
        let localOwners: Owner[] = [];
        let localProps: Property[] = [];
        let localBuyers: Buyer[] = [];
        let localTenants: Tenant[] = [];
        let localListings: PropertyListing[] = [];
        let localTransactions: Transaction[] = [];
        let localActivities: Activity[] = [];
        let localFollowUps: FollowUpTask[] = [];
        let localSaleLeads: SaleLead[] = [];
        let localRentalLeads: RentalLead[] = [];
        let localAuditLogs: AuditLog[] = [];

        try {
          localOwners = JSON.parse(localStorage.getItem(STORAGE_KEYS.OWNERS) || '[]');
          localProps = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROPERTIES) || '[]');
          localBuyers = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUYERS) || '[]');
          localTenants = JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || '[]');
          localListings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
          localTransactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
          localActivities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
          localFollowUps = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWUPS) || '[]');
          localSaleLeads = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALE_LEADS) || '[]');
          localRentalLeads = JSON.parse(localStorage.getItem(STORAGE_KEYS.RENTAL_LEADS) || '[]');
          localAuditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
        } catch (storageErr) {
          console.warn('Could not parse localStorage cache:', storageErr);
        }

        // 2. Query server database
        const res = await fetch('/api/db/load-all');
        if (res.ok) {
          const data = await res.json();
          if (data && isMounted) {
            const serverOwners = Array.isArray(data.owners) ? data.owners : [];
            const serverProps = Array.isArray(data.properties) ? data.properties : [];
            const serverBuyers = Array.isArray(data.buyers) ? data.buyers : [];
            const serverTenants = Array.isArray(data.tenants) ? data.tenants : [];
            const serverListings = Array.isArray(data.listings) ? data.listings : [];
            const serverTrans = Array.isArray(data.transactions) ? data.transactions : [];
            const serverActivities = Array.isArray(data.activities) ? data.activities : [];
            const serverFollowUps = Array.isArray(data.followUps) ? data.followUps : [];
            const serverSaleLeads = Array.isArray(data.saleLeads) ? data.saleLeads : [];
            const serverRentalLeads = Array.isArray(data.rentalLeads) ? data.rentalLeads : [];
            const serverAuditLogs = Array.isArray(data.auditLogs) ? data.auditLogs : [];

            // Merge smartly: if server has data use server, but if server is empty while local has data, preserve local and sync up!
            let resolvedOwners = serverOwners;
            if (serverOwners.length === 0 && localOwners.length > 0) {
              resolvedOwners = localOwners;
            } else if (serverOwners.length > 0 && localOwners.length > 0) {
              // Combine and deduplicate by id
              const map = new Map<string, Owner>();
              localOwners.forEach(o => map.set(o.id, o));
              serverOwners.forEach(o => map.set(o.id, o));
              resolvedOwners = Array.from(map.values());
            }

            setOwners(resolvedOwners);
            setProperties(serverProps.length >= localProps.length ? serverProps : localProps);
            setBuyers(serverBuyers.length >= localBuyers.length ? serverBuyers : localBuyers);
            setTenants(serverTenants.length >= localTenants.length ? serverTenants : localTenants);
            setListings(serverListings.length >= localListings.length ? serverListings : localListings);
            setTransactions(serverTrans.length >= localTransactions.length ? serverTrans : localTransactions);
            setActivities(serverActivities.length >= localActivities.length ? serverActivities : localActivities);
            setFollowUps(serverFollowUps.length >= localFollowUps.length ? serverFollowUps : localFollowUps);
            setSaleLeads(serverSaleLeads.length >= localSaleLeads.length ? serverSaleLeads : localSaleLeads);
            setRentalLeads(serverRentalLeads.length >= localRentalLeads.length ? serverRentalLeads : localRentalLeads);
            setAuditLogs(serverAuditLogs.length >= localAuditLogs.length ? serverAuditLogs : localAuditLogs);

            if (Array.isArray(data.users) && data.users.length > 0) setUsers(data.users);
            if (Array.isArray(data.roles) && data.roles.length > 0) setRoles(data.roles);
            if (Array.isArray(data.scoringRules) && data.scoringRules.length > 0) setScoringRules(data.scoringRules);
            if (Array.isArray(data.templates) && data.templates.length > 0) setTemplates(data.templates);
            if (data.currentUser) setCurrentUser(data.currentUser);
            if (data.lastImportReport) setLastImportReport(data.lastImportReport);
            
            const timeStr = new Date().toLocaleTimeString();
            setLastDbSyncTime(timeStr);
            setIsLoading(false);

            // If local data had records not yet on server, sync them up immediately
            if (serverOwners.length < resolvedOwners.length) {
              fetch('/api/db/sync-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  owners: resolvedOwners,
                  properties: serverProps.length >= localProps.length ? serverProps : localProps,
                  buyers: serverBuyers.length >= localBuyers.length ? serverBuyers : localBuyers,
                  tenants: serverTenants.length >= localTenants.length ? serverTenants : localTenants,
                  listings: serverListings.length >= localListings.length ? serverListings : localListings,
                  transactions: serverTrans.length >= localTransactions.length ? serverTrans : localTransactions,
                  activities: serverActivities.length >= localActivities.length ? serverActivities : localActivities,
                  followUps: serverFollowUps.length >= localFollowUps.length ? serverFollowUps : localFollowUps,
                  saleLeads: serverSaleLeads.length >= localSaleLeads.length ? serverSaleLeads : localSaleLeads,
                  rentalLeads: serverRentalLeads.length >= localRentalLeads.length ? serverRentalLeads : localRentalLeads,
                  users: data.users || INITIAL_USERS,
                  roles: data.roles || INITIAL_ROLES,
                  currentUser: data.currentUser || INITIAL_USERS[0],
                  scoringRules: data.scoringRules || INITIAL_SCORING_RULES,
                  templates: data.templates || INITIAL_TEMPLATES,
                  auditLogs: serverAuditLogs.length >= localAuditLogs.length ? serverAuditLogs : localAuditLogs,
                  lastImportReport: data.lastImportReport
                })
              }).catch(console.error);
            }

            return;
          }
        }
      } catch (err) {
        console.warn('Server database load failed, falling back to local cache:', err);
      }

      // Fallback to localStorage if server load didn't complete
      if (isMounted) {
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
            if (storedUsers) setUsers(JSON.parse(storedUsers));
            const storedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
            if (storedRoles) setRoles(JSON.parse(storedRoles));
            const storedRules = localStorage.getItem(STORAGE_KEYS.SCORING_RULES);
            if (storedRules) setScoringRules(JSON.parse(storedRules));
            const storedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
            if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
            setAuditLogs(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]'));
          } else {
            // Clean Initial State: 0 CRM Records
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
                details: 'CRM initialized with 0 records. Ready for Excel / CSV data import.',
                entityType: 'User'
              }
            ]);
            localStorage.setItem(STORAGE_KEYS.INIT_FLAG, 'true');
          }
        } catch (e) {
          console.error('Error reading localStorage fallback:', e);
        } finally {
          setIsLoading(false);
        }
      }
    }

    initializeCrmState();

    return () => {
      isMounted = false;
    };
  }, [refreshDbStatus]);

  // Synchronize state directly to Database
  const syncToDatabase = useCallback(async (customPayload?: any): Promise<boolean> => {
    setIsDbSyncing(true);
    try {
      const payload = customPayload || {
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
        users,
        roles,
        currentUser,
        scoringRules,
        templates,
        auditLogs,
        lastImportReport
      };

      const res = await fetch('/api/db/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const timeStr = new Date().toLocaleTimeString();
        setLastDbSyncTime(timeStr);
        setDbStatus(prev => ({
          ...prev,
          lastSyncedAt: timeStr,
          counts: {
            owners: payload.owners?.length || 0,
            properties: payload.properties?.length || 0,
            saleLeads: payload.saleLeads?.length || 0,
            rentalLeads: payload.rentalLeads?.length || 0,
            activities: payload.activities?.length || 0,
            followUps: payload.followUps?.length || 0,
            users: payload.users?.length || 0,
            auditLogs: payload.auditLogs?.length || 0
          }
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Database sync failed:', e);
      return false;
    } finally {
      setIsDbSyncing(false);
    }
  }, [
    owners, properties, buyers, tenants, listings, transactions,
    activities, followUps, saleLeads, rentalLeads, users, roles,
    currentUser, scoringRules, templates, auditLogs, lastImportReport
  ]);

  // Save to localStorage & Debounced Database Sync whenever state changes
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
      console.warn('LocalStorage quota or sync warning:', e);
    }

    const timeout = setTimeout(() => {
      syncToDatabase();
    }, 800);

    return () => clearTimeout(timeout);
  }, [
    owners, properties, buyers, tenants, listings, transactions, 
    activities, followUps, saleLeads, rentalLeads, users, roles, currentUser, scoringRules, 
    templates, auditLogs, lastImportReport, isLoading, syncToDatabase
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

    // Auto-create linked Property record
    const newProperty: Property = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ownerId: newId,
      builder: 'Prestige Group',
      project: ownerData.project || 'Prestige Project',
      city: 'Bengaluru',
      block: ownerData.block || 'Tower 1',
      flatNumber: ownerData.flatNumber || 'Unit',
      propertyType: (ownerData.propertyType as any) || 'Apartment',
      bhk: ownerData.bhk || '3 BHK',
      superBuiltUpAreaSqFt: ownerData.superBuiltUpArea || 1500,
      carpetAreaSqFt: Math.round((ownerData.superBuiltUpArea || 1500) * 0.78),
      carParking: ownerData.carParking || 1,
      furnishingStatus: (ownerData.furnishingStatus as any) || 'Semi-Furnished',
      propertyStatus: ownerData.propertyStatus || 'Unknown',
      photos: [],
      isVerified: true
    };

    setOwners(prev => [newOwner, ...prev]);
    setProperties(prev => [newProperty, ...prev]);

    // If sale intent is active, auto-add to sales pipeline
    if (ownerData.saleIntent && ownerData.saleIntent !== 'Not Interested') {
      const newSaleLead: SaleLead = {
        id: `sl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ownerId: newId,
        propertyId: newProperty.id,
        stage: 'Interested',
        expectedPrice: ownerData.saleInfo?.expectedPrice || 20000000,
        leadScore: scoreResult.score,
        leadTemperature: scoreResult.temperature,
        assignedAgent: ownerData.assignedStaff || currentUser.name,
        createdAt: now,
        updatedAt: now
      };
      setSaleLeads(prev => [newSaleLead, ...prev]);
    }

    // If rental intent is active, auto-add to rental pipeline
    if (ownerData.rentalIntent && ownerData.rentalIntent !== 'Not Interested') {
      const newRentalLead: RentalLead = {
        id: `rl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ownerId: newId,
        propertyId: newProperty.id,
        stage: 'Interested',
        expectedRent: ownerData.rentalInfo?.expectedMonthlyRent || 60000,
        deposit: ownerData.rentalInfo?.securityDeposit || 300000,
        leadScore: scoreResult.score,
        leadTemperature: scoreResult.temperature,
        assignedAgent: ownerData.assignedStaff || currentUser.name,
        createdAt: now,
        updatedAt: now
      };
      setRentalLeads(prev => [newRentalLead, ...prev]);
    }

    logAudit('Record created', `Created owner record for ${newOwner.name} (${newOwner.project} - ${newOwner.flatNumber})`, newId, 'Owner');
    return newOwner;
  }, [scoringRules, currentUser, logAudit]);

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
    setProperties(prev => prev.filter(p => p.ownerId !== id));
    setSaleLeads(prev => prev.filter(sl => sl.ownerId !== id));
    setRentalLeads(prev => prev.filter(rl => rl.ownerId !== id));
    setActivities(prev => prev.filter(a => a.ownerId !== id));
    setFollowUps(prev => prev.filter(f => f.ownerId !== id));
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
    setProperties(prev => prev.filter(p => !ids.includes(p.ownerId)));
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

    // Sync pipeline leads
    if (qualification.saleIntent && qualification.saleIntent !== 'Not Interested') {
      setSaleLeads(prev => {
        const existing = prev.find(sl => sl.ownerId === id);
        if (existing) {
          return prev.map(sl => sl.ownerId === id ? {
            ...sl,
            expectedPrice: qualification.saleInfo?.expectedPrice || sl.expectedPrice,
            updatedAt: new Date().toISOString().split('T')[0]
          } : sl);
        } else {
          const newLead: SaleLead = {
            id: `sl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            ownerId: id,
            propertyId: id,
            stage: 'Interested',
            expectedPrice: qualification.saleInfo?.expectedPrice || 20000000,
            leadScore: owner.leadScore || 50,
            leadTemperature: owner.leadTemperature || 'Warm',
            assignedAgent: owner.assignedStaff || currentUser.name,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          };
          return [newLead, ...prev];
        }
      });
    }

    if (qualification.rentalIntent && qualification.rentalIntent !== 'Not Interested') {
      setRentalLeads(prev => {
        const existing = prev.find(rl => rl.ownerId === id);
        if (existing) {
          return prev.map(rl => rl.ownerId === id ? {
            ...rl,
            expectedRent: qualification.rentalInfo?.expectedMonthlyRent || rl.expectedRent,
            deposit: qualification.rentalInfo?.securityDeposit || rl.deposit,
            updatedAt: new Date().toISOString().split('T')[0]
          } : rl);
        } else {
          const newLead: RentalLead = {
            id: `rl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            ownerId: id,
            propertyId: id,
            stage: 'Interested',
            expectedRent: qualification.rentalInfo?.expectedMonthlyRent || 65000,
            deposit: qualification.rentalInfo?.securityDeposit || 300000,
            leadScore: owner.leadScore || 50,
            leadTemperature: owner.leadTemperature || 'Warm',
            assignedAgent: owner.assignedStaff || currentUser.name,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          };
          return [newLead, ...prev];
        }
      });
    }

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
    setOwners(prev => {
      const combined = [...importedOwners, ...prev];
      syncToDatabase({
        owners: combined,
        properties,
        buyers,
        tenants,
        listings,
        transactions,
        activities,
        followUps,
        saleLeads,
        rentalLeads,
        users,
        roles,
        currentUser,
        scoringRules,
        templates,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: currentUser.name,
            action: 'Database imported',
            details: `Imported ${importedOwners.length} owners from Excel/CSV file`,
            entityType: 'Owner'
          },
          ...auditLogs
        ],
        lastImportReport: report
      });
      return combined;
    });
    setLastImportReport(report);
    logAudit('Database imported', `Imported ${importedOwners.length} owners from Excel/CSV file`);
  }, [
    syncToDatabase, properties, buyers, tenants, listings, transactions,
    activities, followUps, saleLeads, rentalLeads, users, roles, currentUser,
    scoringRules, templates, auditLogs, logAudit
  ]);

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
    syncToDatabase({
      owners: DEMO_OWNERS,
      properties: DEMO_PROPERTIES,
      buyers: DEMO_BUYERS,
      tenants: DEMO_TENANTS,
      listings: DEMO_LISTINGS,
      transactions: DEMO_TRANSACTIONS,
      activities: DEMO_ACTIVITIES,
      followUps: DEMO_FOLLOWUPS,
      saleLeads: DEMO_SALE_LEADS,
      rentalLeads: DEMO_RENTAL_LEADS,
      users,
      roles,
      currentUser,
      scoringRules: INITIAL_SCORING_RULES,
      templates: INITIAL_TEMPLATES,
      auditLogs,
      lastImportReport: null
    });
    logAudit('Record created', 'Reset database to 20 fictional Prestige owners and benchmark pipeline state');
  }, [syncToDatabase, users, roles, currentUser, auditLogs, logAudit]);

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
    try {
      localStorage.removeItem(STORAGE_KEYS.OWNERS);
      localStorage.removeItem(STORAGE_KEYS.PROPERTIES);
      localStorage.removeItem(STORAGE_KEYS.BUYERS);
      localStorage.removeItem(STORAGE_KEYS.TENANTS);
      localStorage.removeItem(STORAGE_KEYS.LISTINGS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
      localStorage.removeItem(STORAGE_KEYS.FOLLOWUPS);
      localStorage.removeItem(STORAGE_KEYS.SALE_LEADS);
      localStorage.removeItem(STORAGE_KEYS.RENTAL_LEADS);
      localStorage.removeItem(STORAGE_KEYS.LAST_REPORT);
      fetch('/api/db/clear', { method: 'POST' }).catch(console.error);
    } catch (e) {
      console.warn('Clear storage error:', e);
    }
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
      dbStatus,
      isDbSyncing,
      lastDbSyncTime,
      refreshDbStatus,
      syncToDatabase,
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

