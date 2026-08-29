import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isConnecting = false;
let lastConnectionError: string | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_STORE_FILE = path.join(DATA_DIR, 'crm_store.json');

// Ensure local backup directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data directory:', e);
  }
}

// Initial Empty Structure
const DEFAULT_EMPTY_STATE = {
  owners: [],
  properties: [],
  buyers: [],
  tenants: [],
  listings: [],
  transactions: [],
  activities: [],
  followUps: [],
  saleLeads: [],
  rentalLeads: [],
  users: [],
  roles: [],
  currentUser: null,
  scoringRules: [],
  templates: [],
  auditLogs: [],
  lastImportReport: null,
  isInitialized: true
};

export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_CONNECTION_STRING;
  
  if (!uri) {
    return null;
  }

  if (mongoDb) {
    return mongoDb;
  }

  if (isConnecting) {
    // Wait briefly for connection
    await new Promise(resolve => setTimeout(resolve, 500));
    return mongoDb;
  }

  isConnecting = true;
  try {
    const dbName = process.env.MONGODB_DB_NAME || 'sellmyghar_crm';
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    lastConnectionError = null;
    console.log(`[MongoDB] Connected successfully to database: ${dbName}`);

    // Create helpful indices in background
    try {
      await mongoDb.collection('owners').createIndex({ id: 1 }, { unique: true });
      await mongoDb.collection('owners').createIndex({ primaryPhone: 1 });
      await mongoDb.collection('owners').createIndex({ project: 1 });
      await mongoDb.collection('owners').createIndex({ leadScore: -1 });
    } catch (idxErr) {
      console.warn('[MongoDB] Index creation notice:', idxErr);
    }

    return mongoDb;
  } catch (err: any) {
    console.error('[MongoDB] Connection error:', err.message);
    lastConnectionError = err.message;
    mongoClient = null;
    mongoDb = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

// Read from Local File Store (used as fallback or when MongoDB URI is not yet configured)
export function readLocalStore(): any {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[Local DB] Error reading local store:', err);
  }
  return { ...DEFAULT_EMPTY_STATE };
}

// Write to Local File Store
export function writeLocalStore(state: any): void {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Local DB] Error writing to local store:', err);
  }
}

export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  type: 'mongodb' | 'local_persistent';
  dbName: string;
  hasMongoUri: boolean;
  error?: string | null;
  counts: {
    owners: number;
    properties: number;
    saleLeads: number;
    rentalLeads: number;
    activities: number;
    followUps: number;
    users: number;
    auditLogs: number;
  };
}> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_CONNECTION_STRING;
  const db = await getMongoDb();

  if (db) {
    try {
      const [owners, properties, saleLeads, rentalLeads, activities, followUps, users, auditLogs] = await Promise.all([
        db.collection('owners').countDocuments(),
        db.collection('properties').countDocuments(),
        db.collection('saleLeads').countDocuments(),
        db.collection('rentalLeads').countDocuments(),
        db.collection('activities').countDocuments(),
        db.collection('followUps').countDocuments(),
        db.collection('users').countDocuments(),
        db.collection('auditLogs').countDocuments()
      ]);

      return {
        connected: true,
        type: 'mongodb',
        dbName: db.databaseName,
        hasMongoUri: !!uri,
        error: null,
        counts: {
          owners,
          properties,
          saleLeads,
          rentalLeads,
          activities,
          followUps,
          users,
          auditLogs
        }
      };
    } catch (e: any) {
      return {
        connected: false,
        type: 'local_persistent',
        dbName: 'Local Persistent Store (Fallback)',
        hasMongoUri: !!uri,
        error: e.message,
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
      };
    }
  }

  // Local file fallback
  const local = readLocalStore();
  return {
    connected: false,
    type: 'local_persistent',
    dbName: 'Local Disk Store (data/crm_store.json)',
    hasMongoUri: !!uri,
    error: lastConnectionError || (uri ? 'Connecting to MongoDB...' : 'MONGODB_URI environment variable not configured yet'),
    counts: {
      owners: local.owners?.length || 0,
      properties: local.properties?.length || 0,
      saleLeads: local.saleLeads?.length || 0,
      rentalLeads: local.rentalLeads?.length || 0,
      activities: local.activities?.length || 0,
      followUps: local.followUps?.length || 0,
      users: local.users?.length || 0,
      auditLogs: local.auditLogs?.length || 0
    }
  };
}

// Load entire CRM state
export async function loadAllData(): Promise<any> {
  const db = await getMongoDb();
  
  if (db) {
    try {
      const [
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
        scoringRules,
        templates,
        auditLogs,
        settingsDoc
      ] = await Promise.all([
        db.collection('owners').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('properties').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('buyers').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('tenants').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('listings').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('transactions').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('activities').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('followUps').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('saleLeads').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('rentalLeads').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('users').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('roles').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('scoringRules').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('templates').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('auditLogs').find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(500).toArray(),
        db.collection('app_settings').findOne({ _id: 'global_state' as any })
      ]);

      const state = {
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
        users: users.length > 0 ? users : undefined,
        roles: roles.length > 0 ? roles : undefined,
        currentUser: settingsDoc?.currentUser || null,
        scoringRules: scoringRules.length > 0 ? scoringRules : undefined,
        templates: templates.length > 0 ? templates : undefined,
        auditLogs,
        lastImportReport: settingsDoc?.lastImportReport || null,
        isInitialized: settingsDoc?.isInitialized ?? true
      };

      // Also mirror to local disk backup
      writeLocalStore(state);

      return state;
    } catch (err) {
      console.error('[MongoDB] Error reading collections:', err);
    }
  }

  // Fallback to local store
  return readLocalStore();
}

// Sync/Save entire state (used after imports, bulk actions, or live state sync)
export async function syncAllData(state: any): Promise<boolean> {
  // Always update local disk backup immediately
  writeLocalStore(state);

  const db = await getMongoDb();
  if (!db) {
    return true; // Saved to local disk
  }

  try {
    const collectionsToSync: Array<{ name: string; data: any[] }> = [
      { name: 'owners', data: state.owners || [] },
      { name: 'properties', data: state.properties || [] },
      { name: 'buyers', data: state.buyers || [] },
      { name: 'tenants', data: state.tenants || [] },
      { name: 'listings', data: state.listings || [] },
      { name: 'transactions', data: state.transactions || [] },
      { name: 'activities', data: state.activities || [] },
      { name: 'followUps', data: state.followUps || [] },
      { name: 'saleLeads', data: state.saleLeads || [] },
      { name: 'rentalLeads', data: state.rentalLeads || [] },
      { name: 'users', data: state.users || [] },
      { name: 'roles', data: state.roles || [] },
      { name: 'scoringRules', data: state.scoringRules || [] },
      { name: 'templates', data: state.templates || [] },
      { name: 'auditLogs', data: state.auditLogs || [] },
    ];

    // For large collections, replace efficiently
    for (const item of collectionsToSync) {
      const col = db.collection(item.name);
      await col.deleteMany({});
      if (item.data.length > 0) {
        await col.insertMany(item.data.map(doc => ({ ...doc })));
      }
    }

    // Save global settings & metadata
    await db.collection('app_settings').updateOne(
      { _id: 'global_state' as any },
      {
        $set: {
          currentUser: state.currentUser,
          lastImportReport: state.lastImportReport,
          isInitialized: true,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    return true;
  } catch (err: any) {
    console.error('[MongoDB] Error in syncAllData:', err.message);
    return false;
  }
}

// Clear all database records
export async function clearAllDatabase(): Promise<boolean> {
  const emptyState = { ...DEFAULT_EMPTY_STATE };
  writeLocalStore(emptyState);

  const db = await getMongoDb();
  if (db) {
    try {
      const colNames = ['owners', 'properties', 'buyers', 'tenants', 'listings', 'transactions', 'activities', 'followUps', 'saleLeads', 'rentalLeads', 'auditLogs'];
      for (const name of colNames) {
        await db.collection(name).deleteMany({});
      }
      await db.collection('app_settings').deleteMany({});
    } catch (e) {
      console.error('[MongoDB] Error clearing database:', e);
    }
  }

  return true;
}
