import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  
  updateScoringRule: (id: string, updates: Partial<ScoringRule>) => void;
  updateTemplate: (id: string, updates: Partial<CommunicationTemplate>) => void;
  setCurrentUser: (user: User) => void;
  logAudit: (action: AuditLog['action'], details: string, recordId?: string, entityType?: AuditLog['entityType']) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const STORAGE_KEYS = {
  OWNERS: 'smg_crm_owners_v1',
  PROPERTIES: 'smg_crm_properties_v1',
  BUYERS: 'smg_crm_buyers_v1',
  TENANTS: 'smg_crm_tenants_v1',
  LISTINGS: 'smg_crm_listings_v1',
  TRANSACTIONS: 'smg_crm_transactions_v1',
  ACTIVITIES: 'smg_crm_activities_v1',
  FOLLOWUPS: 'smg_crm_followups_v1',
  SALE_LEADS: 'smg_crm_sale_leads_v1',
  RENTAL_LEADS: 'smg_crm_rental_leads_v1',
  USERS: 'smg_crm_users_v1',
  SCORING_RULES: 'smg_crm_scoring_rules_v1',
  TEMPLATES: 'smg_crm_templates_v1',
  AUDIT_LOGS: 'smg_crm_audit_logs_v1',
  LAST_REPORT: 'smg_crm_last_report_v1'
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
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(INITIAL_SCORING_RULES);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(INITIAL_TEMPLATES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [lastImportReport, setLastImportReport] = useState<ImportSummaryReport | null>(null);

  // Initialize data from localStorage or seed with DEMO data
  useEffect(() => {
    try {
      const storedOwners = localStorage.getItem(STORAGE_KEYS.OWNERS);
      if (storedOwners) {
        setOwners(JSON.parse(storedOwners));
        setProperties(JSON.parse(localStorage.getItem(STORAGE_KEYS.PROPERTIES) || '[]'));
        setBuyers(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUYERS) || '[]'));
        setTenants(JSON.parse(localStorage.getItem(STORAGE_KEYS.TENANTS) || '[]'));
        setListings(JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]'));
        setTransactions(JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'));
        setActivities(JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]'));
        setFollowUps(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWUPS) || '[]'));
        setSaleLeads(JSON.parse(localStorage.getItem(STORAGE_KEYS.SALE_LEADS) || '[]'));
        setRentalLeads(JSON.parse(localStorage.getItem(STORAGE_KEYS.RENTAL_LEADS) || '[]'));
        setUsers(JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(INITIAL_USERS)));
        setScoringRules(JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORING_RULES) || JSON.stringify(INITIAL_SCORING_RULES)));
        setTemplates(JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || JSON.stringify(INITIAL_TEMPLATES)));
        setAuditLogs(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]'));
        const report = localStorage.getItem(STORAGE_KEYS.LAST_REPORT);
        if (report) setLastImportReport(JSON.parse(report));
      } else {
        // First load: seed with Demo Data
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
        setAuditLogs([
          {
            id: 'aud-1',
            timestamp: new Date().toISOString(),
            user: 'System',
            action: 'Record created',
            details: 'CRM initialized with 20 demo Prestige owner records, listings, and pipelines.',
            entityType: 'Owner'
          }
        ]);
      }
    } catch (e) {
      console.error('Error loading CRM state:', e);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoading) return;
    try {
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
    activities, followUps, saleLeads, rentalLeads, users, scoringRules, 
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

  const addOwner = useCallback((ownerData: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>): Owner => {
    const now = new Date().toISOString().split('T')[0];
    const newId = `own-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Calculate lead score
    const scoreResult = calculateLeadScore(ownerData, scoringRules);

    const newOwner: Owner = {
      ...ownerData,
      id: newId,
      leadScore: scoreResult.score,
      leadTemperature: scoreResult.temperature,
      createdAt: now,
      updatedAt: now
    };

    setOwners(prev => [newOwner, ...prev]);
    logAudit('Record created', `Created owner record for ${newOwner.name} (${newOwner.project}, ${newOwner.flatNumber})`, newId, 'Owner');
    return newOwner;
  }, [scoringRules, logAudit]);

  const updateOwner = useCallback((id: string, updates: Partial<Owner>) => {
    setOwners(prev => prev.map(owner => {
      if (owner.id === id) {
        const merged = { ...owner, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        const scoreResult = calculateLeadScore(merged, scoringRules);
        merged.leadScore = scoreResult.score;
        merged.leadTemperature = scoreResult.temperature;
        return merged;
      }
      return owner;
    }));
    logAudit('Record edited', `Updated details for owner ID ${id}`, id, 'Owner');
  }, [scoringRules, logAudit]);

  const deleteOwner = useCallback((id: string) => {
    const target = owners.find(o => o.id === id);
    setOwners(prev => prev.filter(o => o.id !== id));
    setProperties(prev => prev.filter(p => p.ownerId !== id));
    setSaleLeads(prev => prev.filter(s => s.ownerId !== id));
    setRentalLeads(prev => prev.filter(r => r.ownerId !== id));
    setFollowUps(prev => prev.filter(f => f.ownerId !== id));
    logAudit('Record deleted', `Deleted owner record for ${target?.name || id}`, id, 'Owner');
  }, [owners, logAudit]);

  const bulkUpdateOwners = useCallback((ids: string[], updates: Partial<Owner>) => {
    setOwners(prev => prev.map(owner => {
      if (ids.includes(owner.id)) {
        const merged = { ...owner, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        const scoreResult = calculateLeadScore(merged, scoringRules);
        merged.leadScore = scoreResult.score;
        merged.leadTemperature = scoreResult.temperature;
        return merged;
      }
      return owner;
    }));
    logAudit('Record edited', `Bulk updated ${ids.length} owner records`);
  }, [scoringRules, logAudit]);

  const bulkDeleteOwners = useCallback((ids: string[]) => {
    setOwners(prev => prev.filter(o => !ids.includes(o.id)));
    logAudit('Record deleted', `Bulk deleted ${ids.length} owner records`);
  }, [logAudit]);

  // Qualification Workflow
  const qualifyOwner = useCallback((id: string, qualification: {
    propertyStatus: Owner['propertyStatus'];
    saleIntent?: Owner['saleIntent'];
    rentalIntent?: Owner['rentalIntent'];
    saleInfo?: Owner['saleInfo'];
    rentalInfo?: Owner['rentalInfo'];
    notes?: string;
  }) => {
    setOwners(prev => prev.map(owner => {
      if (owner.id === id) {
        const updatedSaleInfo = qualification.saleInfo 
          ? { ...owner.saleInfo, ...qualification.saleInfo } 
          : owner.saleInfo;
        const updatedRentalInfo = qualification.rentalInfo 
          ? { ...owner.rentalInfo, ...qualification.rentalInfo } 
          : owner.rentalInfo;

        const merged: Owner = {
          ...owner,
          propertyStatus: qualification.propertyStatus,
          saleIntent: qualification.saleIntent || owner.saleIntent,
          rentalIntent: qualification.rentalIntent || owner.rentalIntent,
          saleInfo: updatedSaleInfo,
          rentalInfo: updatedRentalInfo,
          leadStatus: qualification.propertyStatus === 'Self Occupied' ? 'Nurture' : 'Qualified',
          updatedAt: new Date().toISOString().split('T')[0]
        };

        const scoreResult = calculateLeadScore(merged, scoringRules);
        merged.leadScore = scoreResult.score;
        merged.leadTemperature = scoreResult.temperature;

        // Auto create or update Sale / Rental Pipeline lead
        if (qualification.saleIntent && qualification.saleIntent !== 'Not Interested') {
          const existingSaleLead = saleLeads.find(sl => sl.ownerId === id);
          if (!existingSaleLead) {
            const newSaleLead: SaleLead = {
              id: `slead-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              ownerId: id,
              stage: qualification.saleInfo?.saleMarketingAuthorization ? 'Mandate/Authorization Obtained' : 'Interested',
              expectedPrice: qualification.saleInfo?.expectedPrice || 0,
              minimumPrice: qualification.saleInfo?.minimumAcceptablePrice,
              leadScore: merged.leadScore,
              leadTemperature: merged.leadTemperature,
              assignedAgent: owner.assignedStaff,
              notes: qualification.notes,
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0]
            };
            setSaleLeads(sPrev => [newSaleLead, ...sPrev]);
          }
        }

        if (qualification.rentalIntent && qualification.rentalIntent !== 'Not Interested') {
          const existingRentalLead = rentalLeads.find(rl => rl.ownerId === id);
          if (!existingRentalLead) {
            const newRentalLead: RentalLead = {
              id: `rlead-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              ownerId: id,
              stage: qualification.rentalInfo?.rentalMarketingAuthorization ? 'Authorization Obtained' : 'Interested',
              expectedRent: qualification.rentalInfo?.expectedMonthlyRent || 0,
              deposit: qualification.rentalInfo?.securityDeposit,
              leadScore: merged.leadScore,
              leadTemperature: merged.leadTemperature,
              assignedAgent: owner.assignedStaff,
              notes: qualification.notes,
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0]
            };
            setRentalLeads(rPrev => [newRentalLead, ...rPrev]);
          }
        }

        return merged;
      }
      return owner;
    }));

    // Log Activity
    const target = owners.find(o => o.id === id);
    if (target) {
      const actId = `act-${Date.now()}`;
      const now = new Date();
      const newAct: Activity = {
        id: actId,
        ownerId: id,
        type: 'Note',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        staff: currentUser.name,
        outcome: `Owner Qualified: ${qualification.propertyStatus} | Sale: ${qualification.saleIntent || 'None'} | Rent: ${qualification.rentalIntent || 'None'}`,
        notes: qualification.notes || 'Qualification form submitted.',
        createdAt: now.toISOString()
      };
      setActivities(prev => [newAct, ...prev]);
    }

    logAudit('Lead qualified', `Qualified owner ID ${id} as ${qualification.propertyStatus}`, id, 'Owner');
  }, [owners, saleLeads, rentalLeads, scoringRules, currentUser, logAudit]);

  const addActivity = useCallback((activityData: Omit<Activity, 'id' | 'createdAt'>): Activity => {
    const actId = `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newAct: Activity = {
      ...activityData,
      id: actId,
      createdAt: new Date().toISOString()
    };

    setActivities(prev => [newAct, ...prev]);

    // Update owner's contact stats
    setOwners(prev => prev.map(o => {
      if (o.id === activityData.ownerId) {
        return {
          ...o,
          lastContactDate: activityData.date,
          lastContactOutcome: activityData.outcome,
          contactAttempts: (o.contactAttempts || 0) + 1,
          nextFollowUpDate: activityData.nextFollowUpDate || o.nextFollowUpDate,
          firstContactDate: o.firstContactDate || activityData.date,
          leadStatus: o.leadStatus === 'New' ? 'Contacted' : o.leadStatus,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return o;
    }));

    // Auto schedule Follow-up Task if next date is specified
    if (activityData.nextFollowUpDate) {
      const targetOwner = owners.find(o => o.id === activityData.ownerId);
      if (targetOwner) {
        const newFollowUp: FollowUpTask = {
          id: `fol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ownerId: targetOwner.id,
          ownerName: targetOwner.name,
          phone: targetOwner.primaryPhone,
          project: targetOwner.project,
          flatNumber: targetOwner.flatNumber,
          date: activityData.nextFollowUpDate,
          time: '11:00 AM',
          type: 'Call',
          assignedAgent: activityData.staff || targetOwner.assignedStaff,
          notes: activityData.nextAction || activityData.notes,
          status: 'Pending',
          leadTemperature: targetOwner.leadTemperature,
          saleIntent: targetOwner.saleIntent,
          rentalIntent: targetOwner.rentalIntent,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setFollowUps(prev => [newFollowUp, ...prev]);
      }
    }

    logAudit('Record created', `Logged ${activityData.type} for owner ID ${activityData.ownerId}`, activityData.ownerId, 'Owner');
    return newAct;
  }, [owners, logAudit]);

  const addFollowUp = useCallback((followUpData: Omit<FollowUpTask, 'id' | 'createdAt'>): FollowUpTask => {
    const folId = `fol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newFollowUp: FollowUpTask = {
      ...followUpData,
      id: folId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setFollowUps(prev => [newFollowUp, ...prev]);

    // Update owner's next follow up
    setOwners(prev => prev.map(o => {
      if (o.id === followUpData.ownerId) {
        return {
          ...o,
          nextFollowUpDate: followUpData.date,
          nextFollowUpTime: followUpData.time,
          nextFollowUpType: followUpData.type,
          nextFollowUpNotes: followUpData.notes
        };
      }
      return o;
    }));

    return newFollowUp;
  }, []);

  const completeFollowUp = useCallback((id: string) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'Completed' } : f));
  }, []);

  const addProperty = useCallback((propData: Omit<Property, 'id'>): Property => {
    const propId = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newProp: Property = { ...propData, id: propId };
    setProperties(prev => [newProp, ...prev]);
    logAudit('Record created', `Added property ${newProp.project} ${newProp.flatNumber}`, propId, 'Property');
    return newProp;
  }, [logAudit]);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    logAudit('Record edited', `Updated property ${id}`, id, 'Property');
  }, [logAudit]);

  const addListing = useCallback((listingData: Omit<PropertyListing, 'id' | 'listingDate' | 'viewsCount' | 'enquiriesCount'>): PropertyListing => {
    const lstId = `lst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newListing: PropertyListing = {
      ...listingData,
      id: lstId,
      listingDate: new Date().toISOString().split('T')[0],
      viewsCount: 0,
      enquiriesCount: 0
    };
    setListings(prev => [newListing, ...prev]);

    // Sync listingId to owner
    setOwners(prev => prev.map(o => o.id === listingData.ownerId ? { ...o, listingId: lstId, listingStatus: listingData.listingStatus } : o));
    logAudit('Listing published', `Created listing ${newListing.listingTitle}`, lstId, 'Listing');
    return newListing;
  }, [logAudit]);

  const updateListing = useCallback((id: string, updates: Partial<PropertyListing>) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    logAudit('Record edited', `Updated listing ID ${id}`, id, 'Listing');
  }, [logAudit]);

  const addBuyer = useCallback((buyerData: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>): Buyer => {
    const now = new Date().toISOString().split('T')[0];
    const newId = `buy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newBuyer: Buyer = { ...buyerData, id: newId, createdAt: now, updatedAt: now };
    setBuyers(prev => [newBuyer, ...prev]);
    logAudit('Record created', `Added buyer ${newBuyer.name}`, newId);
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
    logAudit('Record created', 'Reset database to 20 fictional Prestige owners and pipeline demo state');
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
    logAudit('Record deleted', 'Cleared all CRM owner records and pipeline data');
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
