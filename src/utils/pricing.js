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
