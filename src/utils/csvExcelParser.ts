import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Owner, ImportColumnMapping, DuplicateRecordCandidate, ImportSummaryReport, OwnerConsent } from '../types';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

// Normalized field mapping keywords
export const FIELD_KEYWORDS: Record<string, { label: string; keywords: string[] }> = {
  name: {
    label: 'Owner Name',
    keywords: ['name', 'owner name', 'customer name', 'client name', 'owner', 'proprietor']
  },
  coOwner: {
    label: 'Co-Owner',
    keywords: ['co - owner', 'co-owner', 'co owner', 'second owner', 'joint owner', 'coowner', 'spouse name']
  },
  flatNumber: {
    label: 'Flat / Unit Number',
    keywords: ['flat no.', 'flat no', 'flat number', 'flat', 'unit no', 'unit', 'apt no', 'door no', 'house no']
  },
  block: {
    label: 'Block / Tower',
    keywords: ['block', 'tower', 'wing', 'phase', 'building', 'tower no']
  },
  project: {
    label: 'Project Name',
    keywords: ['project', 'project name', 'society', 'community', 'property name', 'complex']
  },
  primaryPhone: {
    label: 'Primary Phone',
    keywords: ['contact number', 'contact', 'primary phone', 'phone', 'mobile', 'mobile no', 'cell', 'primary mobile']
  },
  alternatePhone1: {
    label: 'Alternate Phone 1',
    keywords: ['alternate 1', 'alt 1', 'alternate phone 1', 'alt phone 1', 'alternate mobile 1', 'alt mobile 1', 'phone 2']
  },
  alternatePhone2: {
    label: 'Alternate Phone 2',
    keywords: ['alternate 2', 'alt 2', 'alternate phone 2', 'alt phone 2', 'alternate mobile 2', 'alt mobile 2', 'phone 3']
  },
  alternatePhone3: {
    label: 'Alternate Phone 3',
    keywords: ['alternate 3', 'alt 3', 'alternate phone 3', 'alt phone 3', 'alternate mobile 3', 'phone 4']
  },
  alternatePhone4: {
    label: 'Alternate Phone 4',
    keywords: ['alternate 4', 'alt 4', 'alternate phone 4', 'alt phone 4', 'alternate mobile 4', 'phone 5']
  },
  alternatePhone5: {
    label: 'Alternate Phone 5',
    keywords: ['alternate 5', 'alt 5', 'alternate phone 5', 'alt phone 5', 'alternate mobile 5', 'phone 6']
  },
  email: {
    label: 'Email Address',
    keywords: ['email id', 'email', 'email address', 'mail', 'e-mail', 'mail id']
  },
  bhk: {
    label: 'BHK Configuration',
    keywords: ['bhk', 'configuration', 'bedrooms', 'type', 'unit type']
  },
  superBuiltUpArea: {
    label: 'Super Built-up Area (Sq.Ft)',
    keywords: ['super built-up area', 'built up area', 'area', 'sba', 'sqft', 'sq.ft', 'size']
  },
  furnishingStatus: {
    label: 'Furnishing Status',
    keywords: ['furnishing', 'furnishing status', 'furnished']
  },
  carParking: {
    label: 'Car Parking',
    keywords: ['parking', 'car parking', 'parking slots', 'car park']
  }
};

export function autoDetectColumnMappings(headers: string[]): ImportColumnMapping[] {
  return headers.map(header => {
    const cleanHeader = header.trim().toLowerCase();
    let matchedField = 'ignore';

    for (const [fieldKey, config] of Object.entries(FIELD_KEYWORDS)) {
      if (config.keywords.some(kw => cleanHeader === kw || cleanHeader.includes(kw))) {
        matchedField = fieldKey;
        break;
      }
    }

    return {
      csvHeader: header,
      crmField: matchedField
    };
  });
}

export function cleanPhoneNumber(raw: any): string {
  if (!raw) return '';
  const str = String(raw).trim();
  // Remove non-digit chars except +
  let cleaned = str.replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  
  // Normalize 10 digit Indian numbers to formatted or standard
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12 && !cleaned.startsWith('+')) {
    const core = cleaned.slice(2);
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    const core = cleaned.slice(3);
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }
  return str;
}

export function cleanEmail(raw: any): string {
  if (!raw) return '';
  const str = String(raw).trim().toLowerCase();
  // Simple check for valid email syntax
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str) ? str : str;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data as Record<string, string>[];
          resolve({
            headers,
            rows,
            totalRows: rows.length
          });
        },
        error: (err) => reject(err)
      });
    });
  } else if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse as json with raw strings
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    if (rawData.length === 0) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    const headers = Object.keys(rawData[0]);
    const rows = rawData.map(row => {
      const stringifiedRow: Record<string, string> = {};
      for (const key of headers) {
        stringifiedRow[key] = row[key] !== undefined && row[key] !== null ? String(row[key]).trim() : '';
      }
      return stringifiedRow;
    });

    return {
      headers,
      rows,
      totalRows: rows.length
    };
  } else {
    throw new Error('Unsupported file format. Please upload .xlsx, .xls, or .csv');
  }
}

export function detectDuplicates(
  rows: Record<string, string>[],
  mappings: ImportColumnMapping[],
  existingOwners: Owner[],
  defaultProject: string = 'Prestige Falcon City'
): { candidates: DuplicateRecordCandidate[]; newRows: Record<string, string>[] } {
  // Build lookup maps from existing owners
  const phoneMap = new Map<string, Owner>();
  const emailMap = new Map<string, Owner>();
  const flatProjectMap = new Map<string, Owner>();

  const getCleanDigits = (p: string) => p.replace(/\D/g, '').slice(-10);

  for (const owner of existingOwners) {
    if (owner.primaryPhone) {
      const digits = getCleanDigits(owner.primaryPhone);
      if (digits.length >= 10) phoneMap.set(digits, owner);
    }
    [owner.alternatePhone1, owner.alternatePhone2, owner.alternatePhone3, owner.alternatePhone4, owner.alternatePhone5].forEach(alt => {
      if (alt) {
        const digits = getCleanDigits(alt);
        if (digits.length >= 10) phoneMap.set(digits, owner);
      }
    });
    if (owner.email) {
      emailMap.set(owner.email.trim().toLowerCase(), owner);
    }
    if (owner.flatNumber && owner.project) {
      const key = `${owner.project.trim().toLowerCase()}:::${owner.flatNumber.trim().toLowerCase()}`;
      flatProjectMap.set(key, owner);
    }
  }

  const mappingDict: Record<string, string> = {};
  mappings.forEach(m => {
    if (m.crmField !== 'ignore') {
      mappingDict[m.crmField] = m.csvHeader;
    }
  });

  const candidates: DuplicateRecordCandidate[] = [];
  const newRows: Record<string, string>[] = [];

  for (const row of rows) {
    const rawPhone = mappingDict['primaryPhone'] ? row[mappingDict['primaryPhone']] : '';
    const phoneDigits = rawPhone ? getCleanDigits(rawPhone) : '';
    const rawEmail = mappingDict['email'] ? row[mappingDict['email']]?.trim().toLowerCase() : '';
    const rawFlat = mappingDict['flatNumber'] ? row[mappingDict['flatNumber']]?.trim().toLowerCase() : '';
    const rawProject = (mappingDict['project'] ? row[mappingDict['project']] : defaultProject).trim().toLowerCase();

    let duplicateFound: Owner | undefined;
    let matchedBy: 'phone' | 'email' | 'flatAndProject' | 'alternatePhone' = 'phone';

    if (phoneDigits && phoneDigits.length >= 10 && phoneMap.has(phoneDigits)) {
      duplicateFound = phoneMap.get(phoneDigits);
      matchedBy = 'phone';
    } else if (rawEmail && emailMap.has(rawEmail)) {
      duplicateFound = emailMap.get(rawEmail);
      matchedBy = 'email';
    } else if (rawFlat && flatProjectMap.has(`${rawProject}:::${rawFlat}`)) {
      duplicateFound = flatProjectMap.get(`${rawProject}:::${rawFlat}`);
      matchedBy = 'flatAndProject';
    }

    if (duplicateFound) {
      candidates.push({
        importedRow: row,
        existingOwner: duplicateFound,
        matchedBy,
        action: 'skip' // Default safe choice
      });
    } else {
      newRows.push(row);
    }
  }

  return { candidates, newRows };
}

export function createOwnerFromRow(
  row: Record<string, string>,
  mappings: ImportColumnMapping[],
  defaultProject: string = 'Prestige Properties Bengaluru'
): Owner {
  const getVal = (field: string) => {
    const mapping = mappings.find(m => m.crmField === field);
    return mapping && row[mapping.csvHeader] ? row[mapping.csvHeader].trim() : '';
  };

  const name = getVal('name') || 'Unknown Owner';
  const coOwner = getVal('coOwner');
  const flatNumber = getVal('flatNumber') || 'TBD';
  const block = getVal('block') || 'Main Block';
  const project = getVal('project') || defaultProject;
  const primaryPhone = cleanPhoneNumber(getVal('primaryPhone')) || '+91 00000 00000';
  const alternatePhone1 = cleanPhoneNumber(getVal('alternatePhone1'));
  const alternatePhone2 = cleanPhoneNumber(getVal('alternatePhone2'));
  const alternatePhone3 = cleanPhoneNumber(getVal('alternatePhone3'));
  const alternatePhone4 = cleanPhoneNumber(getVal('alternatePhone4'));
  const alternatePhone5 = cleanPhoneNumber(getVal('alternatePhone5'));
  const email = cleanEmail(getVal('email'));
  const bhk = getVal('bhk') || '3 BHK';
  const superBuiltUpArea = Number(getVal('superBuiltUpArea')) || undefined;
  const furnishingStatus = getVal('furnishingStatus') || 'Unknown';
  const carParking = Number(getVal('carParking')) || 1;

  const defaultConsent: OwnerConsent = {
    communicationPermission: 'Unknown',
    optOutStatus: false,
    doNotContact: false,
    preferredCommunicationMethod: 'Phone Call'
  };

  const id = `own-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString().split('T')[0];

  return {
    id,
    name,
    coOwner: coOwner || undefined,
    primaryPhone,
    alternatePhone1: alternatePhone1 || undefined,
    alternatePhone2: alternatePhone2 || undefined,
    alternatePhone3: alternatePhone3 || undefined,
    alternatePhone4: alternatePhone4 || undefined,
    alternatePhone5: alternatePhone5 || undefined,
    email: email || undefined,
    project,
    flatNumber,
    block,
    propertyType: 'Apartment',
    bhk,
    superBuiltUpArea,
    carParking,
    furnishingStatus,

    // Initial state: STRICT UNKNOWN
    propertyStatus: 'Unknown',
    saleIntent: 'Not Interested',
    rentalIntent: 'Not Interested',

    leadScore: 0,
    leadTemperature: 'COLD',
    leadStatus: 'New',
    priority: 'Medium',
    source: 'Excel/CSV Import',
    assignedStaff: 'Karthik Rao',

    contactAttempts: 0,
    listingStatus: 'Not Listed',
    consent: defaultConsent,
    originalImportedData: { ...row },
    createdAt: now,
    updatedAt: now
  };
}

export function generateSampleExcelBuffer(count: number = 25): Uint8Array {
  const sampleProjects = [
    'Prestige Falcon City',
    'Prestige Lakeside Habitat',
    'Prestige Shantiniketan',
    'Prestige Finsbury Park',
    'Prestige Jindal City',
    'Prestige City Avalon Park',
    'Prestige Willow Park'
  ];

  const firstNames = ['Arun', 'Venkatesh', 'Deepa', 'Sandeep', 'Meenakshi', 'Gaurav', 'Shweta', 'Naveen', 'Swati', 'Pawan', 'Pooja', 'Mahesh', 'Divya', 'Sanjay', 'Rohit'];
  const lastNames = ['Murthy', 'Kulkarni', 'Iyer', 'Reddy', 'Sharma', 'Nambiar', 'Patel', 'Menon', 'Chatterjee', 'Shetty', 'Bhat', 'Varma', 'Deshmukh', 'Joshi', 'Gupta'];
  const blocks = ['Tower 1', 'Tower 2', 'Tower 3', 'Tower 4', 'Block A', 'Block B', 'Phase 1', 'Regent', 'Hyde'];

  const rows: Record<string, string>[] = [];

  for (let i = 1; i <= count; i++) {
    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[(i + 3) % lastNames.length];
    const name = `${fname} ${lname}`;
    const coOwner = i % 2 === 0 ? `Anita ${lname}` : (i % 3 === 0 ? `Suresh ${lname}` : '');
    const flatNo = `${blocks[i % blocks.length].slice(0, 1)}${Math.floor(i / 10) + 1}-${(i % 20) + 101}`;
    const block = blocks[i % blocks.length];
    const project = sampleProjects[i % sampleProjects.length];
    const phone = `9845${String(100000 + i * 37).slice(0, 6)}`;
    const alt1 = i % 2 === 0 ? `9740${String(200000 + i * 43).slice(0, 6)}` : '';
    const alt2 = i % 3 === 0 ? `9900${String(300000 + i * 51).slice(0, 6)}` : '';
    const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@gmail.com`;

    rows.push({
      'Name': name,
      'Co - Owner': coOwner,
      'Flat No.': flatNo,
      'Block': block,
      'Project': project,
      'Contact Number': phone,
      'Alternate 1': alt1,
      'Alternate 2': alt2,
      'Alternate 3': '',
      'Alternate 4': '',
      'Alternate 5': '',
      'Email Id': email
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prestige Owners');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

export function exportToCSV(data: Record<string, any>[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportOwnersToCsv(owners: Owner[], filename: string = 'SellMyGhar_Owners.csv') {
  const flattened = owners.map(o => ({
    'Name': o.name,
    'Co - Owner': o.coOwner || '',
    'Flat No.': o.flatNumber,
    'Block': o.block,
    'Project': o.project,
    'BHK': o.bhk,
    'Contact Number': o.primaryPhone,
    'Alternate 1': o.alternatePhone1 || '',
    'Alternate 2': o.alternatePhone2 || '',
    'Alternate 3': o.alternatePhone3 || '',
    'Email Id': o.email || '',
    'Property Status': o.propertyStatus,
    'Sale Intent': o.saleIntent,
    'Rental Intent': o.rentalIntent,
    'Expected Price': o.saleInfo?.expectedPrice || '',
    'Expected Rent': o.rentalInfo?.expectedMonthlyRent || '',
    'Lead Score': o.leadScore,
    'Lead Temperature': o.leadTemperature,
    'Assigned Staff': o.assignedStaff,
    'Do Not Call': o.consent?.doNotContact ? 'Yes' : 'No'
  }));

  exportToCSV(flattened, filename);
}

export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = 'CRM Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
