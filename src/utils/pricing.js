// PSS Pricing Calculator
import { PRICING, CLIENT_TYPES } from './constants';

/**
 * Calculate the unit price for a single print
 * Unit Price = Base Price × Coverage Multiplier × Colour Multiplier
 */
export function calculateUnitPrice(printSize, inkCoverage, numberOfColours) {
  const basePrice = PRICING.basePrices[printSize] || 0;
  const coverageMultiplier = PRICING.coverageMultipliers[inkCoverage] || 1;
  const colourMultiplier = PRICING.colourMultipliers[numberOfColours] || 1;

  return basePrice * coverageMultiplier * colourMultiplier;
}

/**
 * Calculate volume discount percentage based on quantity
 */
export function getVolumeDiscount(quantity) {
  for (const tier of PRICING.volumeDiscounts) {
    if (quantity >= tier.minQuantity) {
      return tier.discount;
    }
  }
  return 0;
}

/**
 * Calculate screen fees based on client type and number of colours
 */
export function calculateScreenFees(clientType, numberOfColours) {
  const feePerScreen = PRICING.screenFees[clientType] || PRICING.screenFees[CLIENT_TYPES.NEW];
  return feePerScreen * numberOfColours;
}

/**
 * Calculate cloth cost for PSS supplied cloth
 */
export function calculateClothCost(linearMetres, isClientSupplied) {
  if (isClientSupplied) {
    return 0;
  }
  return linearMetres * PRICING.clothPricePerMetre;
}

/**
 * Full quote calculation
 */
export function calculateQuote({
  printSize,
  inkCoverage,
  numberOfColours,
  numberOfPrints,
  linearMetres,
  clientType,
  isClientSuppliedCloth
}) {
  // Validate minimum order
  if (numberOfPrints < PRICING.minimumPrints) {
    return {
      error: `Minimum order is ${PRICING.minimumPrints} prints`,
      isValid: false
    };
  }

  // Calculate unit price
  const unitPrice = calculateUnitPrice(printSize, inkCoverage, numberOfColours);

  // Calculate print subtotal
  const printSubtotal = unitPrice * numberOfPrints;

  // Calculate volume discount
  const volumeDiscountRate = getVolumeDiscount(numberOfPrints);
  const volumeDiscountAmount = printSubtotal * volumeDiscountRate;

  // Calculate screen fees
  const screenFees = calculateScreenFees(clientType, numberOfColours);

  // Calculate cloth cost
  const clothCost = calculateClothCost(linearMetres, isClientSuppliedCloth);

  // Calculate subtotal before VAT
  const subtotalBeforeDiscount = printSubtotal + screenFees + clothCost;
  const subtotal = subtotalBeforeDiscount - volumeDiscountAmount;

  // Calculate VAT
  const vat = subtotal * PRICING.vatRate;

  // Calculate total
  const total = subtotal + vat;

  // Calculate deposit
  const deposit = total * PRICING.depositPercentage;
  const balance = total - deposit;

  return {
    isValid: true,
    breakdown: {
      unitPrice,
      numberOfPrints,
      printSubtotal,
      volumeDiscountRate,
      volumeDiscountAmount,
      screenFees,
      clothCost,
      clothMetres: isClientSuppliedCloth ? 0 : linearMetres,
      clothPricePerMetre: PRICING.clothPricePerMetre,
      subtotal,
      vatRate: PRICING.vatRate,
      vat,
      total,
      deposit,
      balance
    }
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('ZAR', 'R');
}

/**
 * Format percentage for display
 */
export function formatPercentage(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Get client type label for display
 */
export function getClientTypeLabel(clientType) {
  const labels = {
    [CLIENT_TYPES.NEW]: 'New Client',
    [CLIENT_TYPES.RETURN_WITHIN_6]: 'Return (within 6 months)',
    [CLIENT_TYPES.RETURN_AFTER_6]: 'Return (after 6 months)',
    [CLIENT_TYPES.LOYAL]: 'Loyal/Regular Client'
  };
  return labels[clientType] || clientType;
}

/**
 * Get screen fee description
 */
export function getScreenFeeDescription(clientType) {
  const fee = PRICING.screenFees[clientType];
  if (fee === 0) {
    return 'Screen fees waived';
  }
  return `R${fee.toLocaleString()} per screen`;
}

/**
 * Calculate layout/spacing for prints on a roll
 * Based on formula from spreadsheet:
 * Gap = (rollLength - (printLength × printsPerRoll)) / (printsPerRoll + 1)
 *
 * @param {number} printLength - Length of each print in metres
 * @param {number} printHeight - Height of each print in metres
 * @param {number} totalPrints - Total number of prints ordered
 * @param {number} printsPerRoll - Number of prints per roll
 * @param {number} clothWidth - Width of cloth (default 1.8m)
 * @param {number} rollLength - Length of roll (default 50m)
 */
export function calculateSpacing({
  printLength,
  printHeight,
  totalPrints,
  printsPerRoll,
  clothWidth = PRICING.clothWidth,
  rollLength = PRICING.rollLength
}) {
  // Validate inputs
  if (!printLength || !printHeight || !totalPrints || !printsPerRoll) {
    return null;
  }

  if (printsPerRoll <= 0 || printLength <= 0) {
    return null;
  }

  // Check if prints fit on the roll
  const totalPrintLength = printLength * printsPerRoll;
  if (totalPrintLength > rollLength) {
    return {
      error: `Prints too long for roll. ${printsPerRoll} prints × ${printLength}m = ${totalPrintLength}m exceeds ${rollLength}m roll`,
      isValid: false
    };
  }

  // Calculate gap between prints (evenly distributed)
  // Formula: (rollLength - (printLength × printsPerRoll)) / (printsPerRoll + 1)
  const totalGapSpace = rollLength - totalPrintLength;
  const numberOfGaps = printsPerRoll + 1; // gaps at start, between each print, and at end
  const gapSize = totalGapSpace / numberOfGaps;

  // Calculate rolls needed
  const rollsNeeded = Math.ceil(totalPrints / printsPerRoll);

  // Calculate margins if cloth is wider than print
  let topBottomMargin = 0;
  if (clothWidth > printHeight) {
    topBottomMargin = ((clothWidth - printHeight) * 100) / 2; // in cm
  }

  // Generate layout description
  let layoutDescription = `${printsPerRoll} prints per roll × ${printLength}m × ${printHeight}m each, ${gapSize.toFixed(2)}m gaps (${rollsNeeded} roll${rollsNeeded !== 1 ? 's' : ''} needed)`;

  if (topBottomMargin > 0) {
    layoutDescription += `, Margins: ${topBottomMargin.toFixed(0)}cm top/bottom`;
  }

  return {
    isValid: true,
    printsPerRoll,
    printLength,
    printHeight,
    gapSize: parseFloat(gapSize.toFixed(2)),
    rollsNeeded,
    totalPrints,
    topBottomMargin: parseFloat(topBottomMargin.toFixed(1)),
    rollLength,
    clothWidth,
    layoutDescription,
    // Additional useful calculations
    usedSpacePerRoll: totalPrintLength,
    wastedSpacePerRoll: parseFloat((rollLength - totalPrintLength - (gapSize * 2)).toFixed(2)), // excluding end gaps
    efficiency: parseFloat(((totalPrintLength / rollLength) * 100).toFixed(1))
  };
}

/**
 * Suggest optimal prints per roll based on print length and roll length
 */
export function suggestPrintsPerRoll(printLength, rollLength = PRICING.rollLength, minGap = 1) {
  if (!printLength || printLength <= 0) return [];

  const suggestions = [];

  // Try different print counts and calculate gaps
  for (let prints = 1; prints <= 20; prints++) {
    const totalPrintLength = printLength * prints;
    if (totalPrintLength > rollLength - minGap) break; // Need at least minGap margin

    const totalGapSpace = rollLength - totalPrintLength;
    const gapSize = totalGapSpace / (prints + 1);

    if (gapSize >= minGap) {
      suggestions.push({
        printsPerRoll: prints,
        gapSize: parseFloat(gapSize.toFixed(2)),
        efficiency: parseFloat(((totalPrintLength / rollLength) * 100).toFixed(1))
      });
    }
  }

  return suggestions;
}
