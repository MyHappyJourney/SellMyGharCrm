export type PropertyStatus = 
  | 'Self Occupied'
  | 'Rented'
  | 'Vacant'
  | 'Planning to Rent'
  | 'Planning to Sell'
  | 'Considering Both'
  | 'Sold'
  | 'Unknown';

export type SaleIntent = 
  | 'Not Interested'
  | 'Considering'
  | '6–12 Months'
  | '3–6 Months'
  | 'Within 3 Months'
  | 'Immediate';

export type RentalIntent = 
  | 'Not Interested'
  | 'Considering'
  | '6–12 Months'
  | '3–6 Months'
  | 'Within 3 Months'
  | 'Immediate';

export type IntentTimeline = SaleIntent;

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD' | 'NURTURE';

export type LeadStatus = 
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Follow Up'
  | 'Interested'
  | 'Negotiating'
  | 'Listing Created'
  | 'Converted'
  | 'Nurture'
  | 'Do Not Contact'
  | 'Lost';

export type ListingStatus = 
  | 'Not Listed'
  | 'Pending Verification'
  | 'Ready for Marketing'
  | 'Active'
  | 'On Hold'
  | 'Sold'
  | 'Rented'
  | 'Withdrawn';

export type UserRole = 
  | 'Admin'
  | 'Manager'
  | 'Sales Agent'
  | 'Telecaller'
  | 'Marketing'
  | 'Viewer';

export type ActivityType = 
  | 'Phone Call'
  | 'WhatsApp'
  | 'Email'
  | 'SMS'
  | 'Meeting'
  | 'Property Visit'
  | 'Note';

export type FollowUpType = 
  | 'Call'
  | 'WhatsApp'
  | 'Email'
  | 'Meeting'
  | 'Property Visit'
  | 'Other';

export type FollowUpStatus = 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';

export type CommunicationPermissionStatus = 
  | 'Unknown'
  | 'Permitted'
  | 'Restricted'
  | 'Opted Out'
  | 'Do Not Contact';

export type PreferredContactMethod = 'Phone Call' | 'WhatsApp' | 'Email' | 'SMS';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export interface OwnerConsent {
  communicationPermission: CommunicationPermissionStatus;
  permissionSource?: string;
  permissionDate?: string;
  optOutStatus: boolean;
  doNotContact: boolean;
  preferredCommunicationMethod: PreferredContactMethod;
  notes?: string;
}

export interface SaleInformation {
  expectedPrice?: number;
  minimumAcceptablePrice?: number;
  saleTimeline?: SaleIntent;
  reasonForSale?: string;
  loanOutstanding?: number;
  documentsStatus?: 'Clear Titles' | 'Under Loan' | 'Pending Verification' | 'Unknown';
  ownerAvailability?: 'Anytime' | 'Weekends' | 'Notice Required' | 'Out of Country';
  exclusiveMandate?: boolean;
  saleMarketingAuthorization?: boolean;
  authorizationDate?: string;
}

export interface RentalInformation {
  expectedMonthlyRent?: number;
  securityDeposit?: number;
  rentalAvailabilityDate?: string;
  furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  leaseDurationMonths?: number;
  tenantPreference?: 'Family' | 'Bachelors' | 'Company Lease' | 'Any';
  propertyManagementRequired?: boolean;
  rentalMarketingAuthorization?: boolean;
  authorizationDate?: string;
}

export interface Property {
  id: string;
  ownerId: string;
  builder: string;
  project: string;
  city: string;
  block: string;
  flatNumber: string;
  propertyType: 'Apartment' | 'Villa' | 'Penthouse' | 'Plot' | 'Commercial' | 'Independent House';
  bhk: string;
  superBuiltUpAreaSqFt?: number;
  carpetAreaSqFt?: number;
  carParking?: number;
  furnishingStatus?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  floor?: number;
  totalFloors?: number;
  propertyStatus: PropertyStatus;
  documentStatus?: string;
  inspectionAvailable?: boolean;
  exclusiveMandate?: boolean;
  photos: string[];
  videoUrl?: string;
  isVerified: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Owner {
  id: string;
  name: string;
  coOwner?: string;
  primaryPhone: string;
  alternatePhone1?: string;
  alternatePhone2?: string;
  alternatePhone3?: string;
  alternatePhone4?: string;
  alternatePhone5?: string;
  email?: string;
  
  // Property details (Primary/first property)
  project: string;
  flatNumber: string;
  block: string;
  propertyType: string;
  bhk: string;
  superBuiltUpArea?: number;
  carParking?: number;
  furnishingStatus?: string;

  // Statuses & Intents
  propertyStatus: PropertyStatus;
  saleIntent: SaleIntent;
  rentalIntent: RentalIntent;
  
  // Sale & Rental Specifics
  saleInfo?: SaleInformation;
  rentalInfo?: RentalInformation;

  // CRM Scoring & Pipeline
  leadScore: number;
  leadTemperature: LeadTemperature;
  leadStatus: LeadStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  source: string;
  campaign?: string;
  assignedStaff: string;
  
  // Contacts & Follow-ups
  contactAttempts: number;
  firstContactDate?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  nextFollowUpType?: FollowUpType;
  nextFollowUpNotes?: string;
  lastContactOutcome?: string;

  // Listing
  listingStatus: ListingStatus;
  listingId?: string;

  // Consent & Privacy
  consent: OwnerConsent;

  // Raw original imported data preserve
  originalImportedData?: Record<string, string | number | undefined>;

  // Metadata
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface Activity {
  id: string;
  ownerId: string;
  propertyId?: string;
  type: ActivityType;
  date: string;
  time: string;
  staff: string;
  outcome: string;
  notes: string;
  nextAction?: string;
  nextFollowUpDate?: string;
  createdAt: string;
}

export interface FollowUpTask {
  id: string;
  ownerId: string;
  ownerName: string;
  phone: string;
  project: string;
  flatNumber: string;
  date: string;
  time: string;
  type: FollowUpType;
  assignedAgent: string;
  notes: string;
  status: FollowUpStatus;
  leadTemperature: LeadTemperature;
  saleIntent: SaleIntent;
  rentalIntent: RentalIntent;
  createdAt: string;
}

export type SalesPipelineStage = 
  | 'Potential Seller'
  | 'Contacted'
  | 'Interested'
  | 'Price Discussed'
  | 'Property Verified'
  | 'Property Inspection Done'
  | 'Marketing Authorization Requested'
  | 'Mandate/Authorization Obtained'
  | 'Listing Ready'
  | 'Listing Created'
  | 'Active Listing'
  | 'Buyer Enquiry'
  | 'Buyer Site Visits'
  | 'Site Visit'
  | 'Offer Received'
  | 'Offer Received / Negotiation'
  | 'Negotiation'
  | 'Token Received / Agreement'
  | 'Agreement'
  | 'Sale Closed'
  | 'Closed - Won'
  | 'Closed - Lost'
  | 'Lost/Withdrawn';

export type RentalPipelineStage = 
  | 'Potential Landlord'
  | 'Contacted'
  | 'Interested'
  | 'Rent Discussed'
  | 'Property Verified'
  | 'Inspection Done'
  | 'Authorization Obtained'
  | 'Listing Ready'
  | 'Listing Created'
  | 'Active Rental Listing'
  | 'Tenant Enquiry'
  | 'Tenant Viewings'
  | 'Property Visit'
  | 'Tenant Shortlisted'
  | 'Terms Agreed / Token'
  | 'Agreement Executed / Move-In'
  | 'Negotiation'
  | 'Agreement'
  | 'Rented'
  | 'Closed'
  | 'Closed - Rented'
  | 'Closed - Lost'
  | 'Withdrawn';

export interface SaleLead {
  id: string;
  ownerId: string;
  propertyId?: string;
  stage: SalesPipelineStage;
  expectedPrice: number;
  minimumPrice?: number;
  leadScore: number;
  leadTemperature: LeadTemperature;
  assignedAgent: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalLead {
  id: string;
  ownerId: string;
  propertyId?: string;
  stage: RentalPipelineStage;
  expectedRent: number;
  deposit?: number;
  leadScore: number;
  leadTemperature: LeadTemperature;
  assignedAgent: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BuyerStatus = 
  | 'New'
  | 'Qualified'
  | 'Shortlisted'
  | 'Property Shared'
  | 'Site Visit'
  | 'Negotiation'
  | 'Booked'
  | 'Closed'
  | 'Lost';

export interface Buyer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budgetMin?: number;
  budgetMax: number;
  preferredProject?: string;
  preferredProjects?: string[];
  preferredBhk?: string | string[];
  minimumBhk?: string;
  maximumBhk?: string;
  fundingType?: 'Home Loan' | 'Self Funded' | 'Combination';
  buyerStage?: string;
  urgency?: 'Immediate' | 'Within 1 Month' | '1-3 Months' | 'Flexible';
  purpose?: 'Self Use' | 'Investment' | 'Both';
  paymentMode?: 'Home Loan' | 'Cash / Self Funded' | 'Combination';
  purchaseTimeline?: 'Immediate' | 'Within 1 Month' | '1-3 Months' | '3-6 Months';
  preferredLocation?: string;
  requirements?: string;
  leadScore?: number;
  assignedAgent?: string;
  lastContact?: string;
  nextFollowUp?: string;
  status?: BuyerStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type TenantStatus = 
  | 'New'
  | 'Qualified'
  | 'Shortlisted'
  | 'Property Shared'
  | 'Property Visit'
  | 'Negotiation'
  | 'Agreement'
  | 'Rented'
  | 'Lost';

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budget?: number;
  budgetMax?: number;
  companyName?: string;
  tenantCategory?: 'Family' | 'Bachelors' | 'Company Lease';
  preferredProject?: string;
  preferredProjects?: string[];
  bhk?: string;
  preferredBhk?: string | string[];
  furnishedRequirement?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished' | 'Any';
  moveInDate?: string;
  leaseDuration?: string;
  tenantType?: 'Family' | 'Bachelors' | 'Corporate Lease' | 'Any';
  tenantStage?: string;
  requirements?: string;
  leadScore?: number;
  status?: TenantStatus;
  assignedAgent?: string;
  lastContact?: string;
  nextFollowUp?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyListing {
  id: string;
  propertyId?: string;
  ownerId: string;
  listingType: 'Sale' | 'Rent' | 'Both';
  listingTitle: string;
  listingDescription?: string;
  description?: string;
  project: string;
  flatNumber?: string;
  builder?: string;
  city?: string;
  bhk: string;
  superBuiltUpArea?: number;
  areaSqFt?: number;
  parking?: number;
  furnishing?: string;
  floor?: string;
  price?: number;
  expectedPrice?: number;
  expectedRent?: number;
  rentPerMonth?: number;
  securityDeposit?: number;
  photos?: string[];
  videoUrl?: string;
  isVerified?: boolean;
  verifiedBy?: string;
  portalPublished?: string[];
  propertyVerificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  ownerAuthorizationStatus?: 'Pending' | 'Authorized' | 'Exclusive Mandate';
  listingStatus: ListingStatus | 'Active' | 'Under Offer' | 'Sold' | 'Rented' | 'Inactive';
  listingDate?: string;
  viewsCount?: number;
  enquiriesCount?: number;
  isPublic?: boolean;
}

export interface Transaction {
  id: string;
  dealType: 'Sale' | 'Rental' | 'Resale';
  propertyId?: string;
  ownerId?: string;
  buyerOrTenantId?: string;
  buyerOrTenantName?: string;
  project?: string;
  flatNumber?: string;
  siteVisitDate?: string;
  dealStage?: string;
  negotiationStatus?: 'Ongoing' | 'Agreed' | 'Agreement Signed' | 'Completed' | 'Cancelled';
  agreedPriceOrRent: number;
  transactionStatus?: 'Site Visit' | 'Negotiation' | 'Token Received' | 'Agreement' | 'Deal Closed' | 'Cancelled';
  closingDate?: string;
  dealClosedDate?: string;
  brokeragePercentage?: number;
  brokerageFee: number;
  brokerageAmount?: number;
  sellerOrLandlordSideAmount?: number;
  buyerOrTenantSideAmount?: number;
  paymentStatus?: 'Pending' | 'Partial' | 'Collected';
  paymentDate?: string;
  assignedAgent?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 
    | 'Record created'
    | 'Record edited'
    | 'Record deleted'
    | 'Export performed'
    | 'Permission changed'
    | 'Listing published'
    | 'Owner authorization changed'
    | 'Database imported'
    | 'Lead qualified';
  details: string;
  recordId?: string;
  entityType?: 'Owner' | 'Property' | 'Listing' | 'Transaction' | 'User';
}

export interface ScoringRule {
  id: string;
  label: string;
  category: 'Sale Intent' | 'Rental Intent' | 'Marketing' | 'Information' | 'Visits';
  condition: string;
  points: number;
  enabled: boolean;
}

export interface CommunicationTemplate {
  id: string;
  title: string;
  name?: string;
  channel: 'WhatsApp' | 'Email' | 'SMS';
  audience: 'Owner' | 'Buyer' | 'Tenant';
  type: string;
  category?: 'Initial Verification' | 'Rental Interest' | 'Sale Interest' | 'Follow-up' | 'Custom';
  subject?: string;
  content: string;
  body?: string;
  isDefault?: boolean;
}

export interface ImportColumnMapping {
  csvHeader: string;
  crmField: string;
  sampleValue?: string;
}

export interface DuplicateRecordCandidate {
  importedRow: Record<string, string>;
  existingOwner: Owner;
  matchedBy: 'phone' | 'email' | 'flatAndProject' | 'alternatePhone';
  action: 'skip' | 'update' | 'create_new' | 'merge';
}

export interface ImportSummaryReport {
  totalRows: number;
  importedCount?: number;
  newRecords?: number;
  duplicateRecords?: number;
  duplicateCount?: number;
  updatedRecords?: number;
  updatedCount?: number;
  skippedRecords?: number;
  skippedCount?: number;
  invalidPhoneNumbers?: number;
  invalidPhones?: number;
  invalidEmails?: number;
  missingNames?: number;
  missingPhones?: number;
  missingFlatNumbers?: number;
  missingMandatoryFields?: number;
  errors?: { row: number; reason: string; data: Record<string, any> }[];
  importedAt?: string;
  importDate?: string;
}
