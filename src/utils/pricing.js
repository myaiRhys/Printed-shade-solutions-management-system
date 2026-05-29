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
 * Calculate how many rolls a job consumes.
 * Cloth comes on rolls, so the last roll is always counted in full.
 */
export function calculateRollsNeeded(totalPrints, printsPerRoll) {
  if (!totalPrints || !printsPerRoll || printsPerRoll <= 0) return 0;
  return Math.ceil(totalPrints / printsPerRoll);
}

/**
 * Calculate cloth cost for PSS supplied cloth.
 * Cloth is charged by whole rolls consumed, so linearMetres should be
 * (rolls needed × roll length).
 */
export function calculateClothCost(linearMetres, isClientSupplied) {
  if (isClientSupplied) {
    return 0;
  }
  return linearMetres * PRICING.clothPricePerMetre;
}

/**
 * Full quote calculation.
 *
 * Jobs are thought of by the roll: a standard roll is 50m long and 1.8m wide.
 * The number of rolls needed is derived from the layout (how many prints fit on
 * a roll) and cloth is charged by whole rolls consumed
 * (rolls needed × roll length × price per metre).
 */
export function calculateQuote({
  printSize,
  inkCoverage,
  numberOfColours,
  numberOfPrints,
  printLength,
  printHeight,
  printsPerRoll,
  clientType,
  isClientSuppliedCloth,
  rollLength = PRICING.rollLength,
  clothWidth = PRICING.clothWidth
}) {
  // Validate minimum order
  if (numberOfPrints < PRICING.minimumPrints) {
    return {
      error: `Minimum order is ${PRICING.minimumPrints} prints`,
      isValid: false
    };
  }

  // Cloth quantity is driven by the roll layout. When PSS supplies the cloth we
  // need the layout to work out how many rolls (and therefore how much cloth)
  // the job consumes. When the client supplies cloth there is no cloth charge,
  // so the layout is optional.
  let rollsNeeded = 0;
  let clothLinearMetres = 0;

  if (!isClientSuppliedCloth) {
    if (!printLength || printLength <= 0 || !printsPerRoll || printsPerRoll <= 0) {
      return {
        error: 'Enter print length and prints per roll to calculate cloth required',
        isValid: false
      };
    }
    if (printLength * printsPerRoll > rollLength) {
      return {
        error: `${printsPerRoll} prints × ${printLength}m = ${(printLength * printsPerRoll).toFixed(2)}m exceeds the ${rollLength}m roll`,
        isValid: false
      };
    }
    if (printHeight && printHeight > clothWidth) {
      return {
        error: `Print height ${printHeight}m exceeds the ${clothWidth}m cloth width`,
        isValid: false
      };
    }
    rollsNeeded = calculateRollsNeeded(numberOfPrints, printsPerRoll);
    clothLinearMetres = rollsNeeded * rollLength;
  }

  // Calculate unit price
  const unitPrice = calculateUnitPrice(printSize, inkCoverage, numberOfColours);

  // Calculate print subtotal
  const printSubtotal = unitPrice * numberOfPrints;

  // Calculate volume discount (applied to the print cost only)
  const volumeDiscountRate = getVolumeDiscount(numberOfPrints);
  const volumeDiscountAmount = printSubtotal * volumeDiscountRate;

  // Calculate screen fees
  const screenFees = calculateScreenFees(clientType, numberOfColours);

  // Calculate cloth cost (whole rolls consumed)
  const clothCost = calculateClothCost(clothLinearMetres, isClientSuppliedCloth);

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
      clothMetres: clothLinearMetres,
      clothLinearMetres,
      rollsNeeded,
      rollLength,
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
      error: `Prints too long for roll. ${printsPerRoll} prints × ${printLength}m = ${totalPrintLength.toFixed(2)}m exceeds ${rollLength}m roll`,
      isValid: false
    };
  }

  // Print must fit across the width of the cloth
  if (printHeight > clothWidth) {
    return {
      error: `Print height ${printHeight}m exceeds the ${clothWidth}m cloth width`,
      isValid: false
    };
  }

  // Calculate gap between prints (evenly distributed)
  // Formula: (rollLength - (printLength × printsPerRoll)) / (printsPerRoll + 1)
  // Gaps sit at the start, between each print, and at the end of the roll.
  const totalGapSpace = rollLength - totalPrintLength;
  const numberOfGaps = printsPerRoll + 1;
  const gapSize = totalGapSpace / numberOfGaps;

  // Calculate rolls needed and the cloth consumed (whole rolls)
  const rollsNeeded = calculateRollsNeeded(totalPrints, printsPerRoll);
  const clothLinearMetres = rollsNeeded * rollLength;

  // Calculate side margins if cloth is wider than the print
  let topBottomMargin = 0;
  if (clothWidth > printHeight) {
    topBottomMargin = ((clothWidth - printHeight) * 100) / 2; // in cm
  }

  // Generate layout description
  let layoutDescription = `${printsPerRoll} prints per roll × ${printLength}m × ${printHeight}m each, ${gapSize.toFixed(2)}m gaps (${rollsNeeded} roll${rollsNeeded !== 1 ? 's' : ''} = ${clothLinearMetres}m cloth)`;

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
    clothLinearMetres,
    totalPrints,
    topBottomMargin: parseFloat(topBottomMargin.toFixed(1)),
    rollLength,
    clothWidth,
    layoutDescription,
    // Cloth used for prints vs gaps (per roll)
    printSpacePerRoll: parseFloat(totalPrintLength.toFixed(2)),
    gapSpacePerRoll: parseFloat(totalGapSpace.toFixed(2)),
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
