import { Owner, ScoringRule, LeadTemperature } from '../types';

export function calculateLeadScore(
  owner: Partial<Owner>,
  rules?: ScoringRule[],
  customFlags?: {
    marketingAgreed?: boolean;
    priceProvided?: boolean;
    photosAvailable?: boolean;
    inspectionAvailable?: boolean;
    mandateObtained?: boolean;
    siteVisitArranged?: boolean;
  }
): { score: number; temperature: LeadTemperature; breakdown: { rule: string; points: number }[] } {
  let totalPoints = 0;
  const breakdown: { rule: string; points: number }[] = [];

  // If owner is self occupied and not selling/renting -> Nurture
  if (owner.propertyStatus === 'Self Occupied' && owner.saleIntent === 'Not Interested' && owner.rentalIntent === 'Not Interested') {
    return {
      score: 5,
      temperature: 'NURTURE',
      breakdown: [{ rule: 'Self Occupied (Staying)', points: 5 }]
    };
  }

  // 1. Sale Intent
  if (owner.saleIntent === 'Immediate') {
    totalPoints += 40;
    breakdown.push({ rule: 'Sale Intent: Immediate', points: 40 });
  } else if (owner.saleIntent === 'Within 3 Months') {
    totalPoints += 35;
    breakdown.push({ rule: 'Sale Intent: Within 3 Months', points: 35 });
  } else if (owner.saleIntent === '3–6 Months') {
    totalPoints += 25;
    breakdown.push({ rule: 'Sale Intent: 3–6 Months', points: 25 });
  } else if (owner.saleIntent === '6–12 Months') {
    totalPoints += 15;
    breakdown.push({ rule: 'Sale Intent: 6–12 Months', points: 15 });
  } else if (owner.saleIntent === 'Considering') {
    totalPoints += 10;
    breakdown.push({ rule: 'Sale Intent: Considering', points: 10 });
  }

  // 2. Rental Intent
  if (owner.rentalIntent === 'Immediate') {
    totalPoints += 35;
    breakdown.push({ rule: 'Rental Intent: Immediate', points: 35 });
  } else if (owner.rentalIntent === 'Within 3 Months') {
    totalPoints += 30;
    breakdown.push({ rule: 'Rental Intent: Within 3 Months', points: 30 });
  } else if (owner.rentalIntent === '3–6 Months') {
    totalPoints += 20;
    breakdown.push({ rule: 'Rental Intent: 3–6 Months', points: 20 });
  } else if (owner.rentalIntent === '6–12 Months') {
    totalPoints += 10;
    breakdown.push({ rule: 'Rental Intent: 6–12 Months', points: 10 });
  } else if (owner.rentalIntent === 'Considering') {
    totalPoints += 5;
    breakdown.push({ rule: 'Rental Intent: Considering', points: 5 });
  }

  // 3. Marketing authorization / mandate
  const hasMarketingAuth = owner.saleInfo?.saleMarketingAuthorization || 
    owner.rentalInfo?.rentalMarketingAuthorization || 
    customFlags?.marketingAgreed;
  if (hasMarketingAuth) {
    totalPoints += 25;
    breakdown.push({ rule: 'Owner Agrees to Marketing', points: 25 });
  }

  const hasExclusiveMandate = owner.saleInfo?.exclusiveMandate || customFlags?.mandateObtained;
  if (hasExclusiveMandate) {
    totalPoints += 30;
    breakdown.push({ rule: 'Exclusive Mandate Obtained', points: 30 });
  }

  // 4. Expected price or rent provided
  const hasPrice = (owner.saleInfo?.expectedPrice && owner.saleInfo.expectedPrice > 0) || 
    (owner.rentalInfo?.expectedMonthlyRent && owner.rentalInfo.expectedMonthlyRent > 0) ||
    customFlags?.priceProvided;
  if (hasPrice) {
    totalPoints += 10;
    breakdown.push({ rule: 'Price/Rent Information Provided', points: 10 });
  }

  // 5. Photos available
  if (customFlags?.photosAvailable) {
    totalPoints += 10;
    breakdown.push({ rule: 'Property Photos Available', points: 10 });
  }

  // 6. Inspection available
  if (owner.saleInfo?.ownerAvailability === 'Anytime' || customFlags?.inspectionAvailable) {
    totalPoints += 10;
    breakdown.push({ rule: 'Property Inspection Available', points: 10 });
  }

  // 7. Site visit arranged
  if (customFlags?.siteVisitArranged) {
    totalPoints += 20;
    breakdown.push({ rule: 'Site Visit Arranged', points: 20 });
  }

  // Determine temperature
  let temperature: LeadTemperature = 'NURTURE';
  if (totalPoints >= 70) {
    temperature = 'HOT';
  } else if (totalPoints >= 40) {
    temperature = 'WARM';
  } else if (totalPoints >= 20) {
    temperature = 'COLD';
  } else {
    temperature = 'NURTURE';
  }

  return { score: totalPoints, temperature, breakdown };
}
