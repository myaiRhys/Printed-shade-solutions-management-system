// PSS Management System Constants

// Job Statuses
export const JOB_STATUSES = {
  ENQUIRY: 'ENQUIRY',
  QUOTED: 'QUOTED',
  DEPOSIT_DUE: 'DEPOSIT DUE',
  IN_PRODUCTION: 'IN PRODUCTION',
  DISPATCHED: 'DISPATCHED',
  COMPLETE: 'COMPLETE',
  ON_HOLD: 'ON HOLD',
  CANCELLED: 'CANCELLED'
};

export const STATUS_ORDER = [
  JOB_STATUSES.ENQUIRY,
  JOB_STATUSES.QUOTED,
  JOB_STATUSES.DEPOSIT_DUE,
  JOB_STATUSES.IN_PRODUCTION,
  JOB_STATUSES.DISPATCHED,
  JOB_STATUSES.COMPLETE
];

export const STATUS_ACTIONS = {
  [JOB_STATUSES.ENQUIRY]: { next: JOB_STATUSES.QUOTED, action: 'Send Quote' },
  [JOB_STATUSES.QUOTED]: { next: JOB_STATUSES.DEPOSIT_DUE, action: 'Confirm Order' },
  [JOB_STATUSES.DEPOSIT_DUE]: { next: JOB_STATUSES.IN_PRODUCTION, action: 'Mark Deposit Paid' },
  [JOB_STATUSES.IN_PRODUCTION]: { next: JOB_STATUSES.DISPATCHED, action: 'Mark Dispatched' },
  [JOB_STATUSES.DISPATCHED]: { next: JOB_STATUSES.COMPLETE, action: 'Mark Complete' },
  [JOB_STATUSES.COMPLETE]: { next: null, action: null },
  [JOB_STATUSES.ON_HOLD]: { next: null, action: 'Resume Job' },
  [JOB_STATUSES.CANCELLED]: { next: null, action: null }
};

// Client Tiers
export const CLIENT_TIERS = {
  PLATINUM: 'PLATINUM',
  VIP: 'VIP',
  REGULAR: 'REGULAR',
  OPPORTUNITY: 'OPPORTUNITY'
};

// Client Types (for pricing)
export const CLIENT_TYPES = {
  NEW: 'new',
  RETURN_WITHIN_6: 'return_within_6',
  RETURN_AFTER_6: 'return_after_6',
  LOYAL: 'loyal'
};

// Print Sizes
export const PRINT_SIZES = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  XLARGE: 'XLarge'
};

// Ink Coverage Levels
export const INK_COVERAGE = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  FULL: 'Full'
};

// Cloth Supply Options
export const CLOTH_SUPPLY = {
  PSS: 'PSS Supplied',
  CLIENT: 'Client Supplied'
};

// Pricing Configuration
export const PRICING = {
  // Base prices per print size
  basePrices: {
    [PRINT_SIZES.SMALL]: 350,
    [PRINT_SIZES.MEDIUM]: 450,
    [PRINT_SIZES.LARGE]: 550,
    [PRINT_SIZES.XLARGE]: 750
  },

  // Ink coverage multipliers
  coverageMultipliers: {
    [INK_COVERAGE.LOW]: 1.0,
    [INK_COVERAGE.MEDIUM]: 1.2,
    [INK_COVERAGE.HIGH]: 1.4,
    [INK_COVERAGE.FULL]: 1.6
  },

  // Colour multipliers
  colourMultipliers: {
    1: 1.0,
    2: 1.25,
    3: 1.5,
    4: 1.75,
    5: 2.0
  },

  // Shade cloth price per metre
  clothPricePerMetre: 55,

  // Screen fees per screen (one per colour)
  screenFees: {
    [CLIENT_TYPES.NEW]: 1850,
    [CLIENT_TYPES.RETURN_WITHIN_6]: 0,
    [CLIENT_TYPES.RETURN_AFTER_6]: 950,
    [CLIENT_TYPES.LOYAL]: 0
  },

  // Volume discounts
  volumeDiscounts: [
    { minQuantity: 200, discount: 0.15 },
    { minQuantity: 100, discount: 0.10 },
    { minQuantity: 50, discount: 0.05 },
    { minQuantity: 25, discount: 0.025 }
  ],

  // VAT rate
  vatRate: 0.15,

  // Minimum order
  minimumPrints: 5,

  // Default print height
  defaultPrintHeight: 1.8,

  // Quote validity in days
  quoteValidityDays: 30,

  // Deposit percentage
  depositPercentage: 0.5
};

// Alert thresholds
export const ALERT_THRESHOLDS = {
  DEPOSIT_OVERDUE_DAYS: 5,
  QUOTE_UNANSWERED_DAYS: 7,
  DEADLINE_WARNING_DAYS: 3
};

// Company Info (default values)
export const DEFAULT_COMPANY_INFO = {
  name: 'Printed Shade Solutions',
  tagline: 'Innovative Brand Exposure Through Printed Shadenet Products',
  email: 'marketing@printedshade.co.za',
  phone: '082 331 5379',
  address: 'Unit 10, Celie Industrial Park, Celie Rd, Retreat, Cape Town',
  website: 'www.printedshade.co.za',
  bankName: '',
  accountNumber: '',
  branchCode: '',
  accountType: 'Business Current'
};

// Pre-loaded clients
export const INITIAL_CLIENTS = [
  {
    id: 'client-1',
    companyName: 'Washirika 3 Oaks',
    shortName: 'W3O',
    contactPerson: 'Yolande Hunter',
    phone: '021 671 6250',
    email: 'yolande@w3o.co.za',
    address: '76 Strand Street, Woodstock',
    vatNumber: '4520219694',
    tier: CLIENT_TIERS.PLATINUM,
    totalRevenue: 216114,
    lastOrderDate: '2025-03-27',
    totalOrders: 9,
    notes: 'PLATINUM CLIENT - Most valuable client with true partnership potential. Multi-branch operations across Cape Town + Johannesburg. Two-color printing specialist.',
    preferredColours: 'Green and white',
    typicalQuantity: '40+ prints per order'
  },
  {
    id: 'client-2',
    companyName: 'Isipani Construction (Pty) Ltd',
    shortName: 'Isipani',
    contactPerson: 'Lyndall Sheldon',
    phone: '021 868 3008',
    email: 'lyndall@isipani.co.za',
    address: '',
    vatNumber: '',
    tier: CLIENT_TIERS.VIP,
    totalRevenue: 125368,
    lastOrderDate: '2024-12-04',
    totalOrders: 5,
    notes: 'VIP CLIENT - Highest average order value, growing from R24k to R49k orders. Premium construction client.',
    preferredColours: '',
    typicalQuantity: ''
  },
  {
    id: 'client-3',
    companyName: 'Tri-Star Construction',
    shortName: 'Tri-Star',
    contactPerson: 'Charmagne Monk',
    phone: '084 510 5692',
    email: 'charmagne@tri-star.co.za',
    address: '',
    vatNumber: '',
    tier: CLIENT_TIERS.VIP,
    totalRevenue: 112010,
    lastOrderDate: '2025-06-13',
    totalOrders: 4,
    notes: 'BREAKTHROUGH CLIENT - Recent R52,900 order shows major project expansion. PLATINUM potential.',
    preferredColours: '',
    typicalQuantity: ''
  },
  {
    id: 'client-4',
    companyName: 'Boundary Secure Fencing PTY LTD',
    shortName: 'Boundary Secure',
    contactPerson: 'Bradley Oldfield',
    phone: '082 598 4410',
    email: 'brad@boundarysecure.co.za',
    address: '',
    vatNumber: '',
    tier: CLIENT_TIERS.VIP,
    totalRevenue: 91911,
    lastOrderDate: '2025-04-25',
    totalOrders: 6,
    notes: 'VIP CLIENT - Consistent repeat client specializing in property development. Works with Sitari Country Estate projects.',
    preferredColours: '',
    typicalQuantity: ''
  },
  {
    id: 'client-5',
    companyName: 'Remey Construction (Pty) Ltd',
    shortName: 'Remey',
    contactPerson: 'Marius Grobler',
    phone: '021 883 2616',
    email: 'buyer@remey.co.za',
    address: '9 Papegaai Street, Stellenbosch, 7600',
    vatNumber: '4730202969',
    tier: CLIENT_TIERS.VIP,
    totalRevenue: 89125,
    lastOrderDate: '2025-02-20',
    totalOrders: 8,
    notes: 'VIP CLIENT - Most frequent client (8 orders). Stellenbosch-based, reliable repeat business. 5 prints per roll with 6.6m gaps.',
    preferredColours: 'One colour',
    typicalQuantity: '39 logos per order'
  },
  {
    id: 'client-6',
    companyName: 'JNA Group (Pty) Ltd',
    shortName: 'JNA',
    contactPerson: 'Tania Schoeman',
    phone: '021 919 8397',
    email: 'buyer@jnagroup.co.za',
    address: '',
    vatNumber: '',
    tier: CLIENT_TIERS.VIP,
    totalRevenue: 66309,
    lastOrderDate: '2025-05-12',
    totalOrders: 6,
    notes: 'VIP CLIENT - Multi-division construction group. Consolidated entity across Projects, Group, and Thatchers divisions.',
    preferredColours: '',
    typicalQuantity: ''
  },
  {
    id: 'client-7',
    companyName: 'Eddie Stemmet Bouers (PTY) LTD',
    shortName: 'ESB',
    contactPerson: 'Denise Stoop',
    phone: '+27 23 614 1211',
    email: 'denise@esbou.co.za',
    address: '',
    vatNumber: '',
    tier: CLIENT_TIERS.REGULAR,
    totalRevenue: 62878,
    lastOrderDate: '2024-10-08',
    totalOrders: 3,
    notes: 'REPEAT CLIENT - Regional construction company, 3 orders totaling R62k.',
    preferredColours: '',
    typicalQuantity: ''
  },
  {
    id: 'client-8',
    companyName: 'R + N Master Builders Cape',
    shortName: 'R+N',
    contactPerson: 'Charles Adonis',
    phone: '021 422 3580',
    email: 'charles@r-n.co.za',
    address: '',
    vatNumber: '',
    tier: CLIENT_TIERS.REGULAR,
    totalRevenue: 47656,
    lastOrderDate: '2024-08-21',
    totalOrders: 3,
    notes: 'REPEAT CLIENT - 3 orders totaling R47k. Needs reactivation for continued business.',
    preferredColours: '',
    typicalQuantity: ''
  },
  {
    id: 'client-9',
    companyName: 'Faumba Holdings (Pty) Ltd t/a Longworth & Faul',
    shortName: 'Longworth & Faul',
    contactPerson: 'Carmen Baron',
    phone: '021 862 2120',
    email: 'buyer@longworthfaul.co.za',
    address: '16 Zuidmeer St, Huguenot, Paarl, 7646',
    vatNumber: '',
    tier: CLIENT_TIERS.REGULAR,
    totalRevenue: 37697,
    lastOrderDate: '2025-04-30',
    totalOrders: 3,
    notes: 'REPEAT CLIENT - Paarl-based client, 3 orders over time. Geographic diversification value, stable small orders.',
    preferredColours: '',
    typicalQuantity: ''
  },
  {
    id: 'client-10',
    companyName: 'Martin & East',
    shortName: 'Martin & East',
    contactPerson: 'Cheryl Kampies',
    phone: '021 761 3474',
    email: 'buying@megroup.co.za',
    address: '3 Mercury Crescent, Hillstar, Wetton, 7780',
    vatNumber: '',
    tier: CLIENT_TIERS.OPPORTUNITY,
    totalRevenue: 0,
    lastOrderDate: null,
    totalOrders: 0,
    notes: 'OPPORTUNITY - New potential client.',
    preferredColours: '',
    typicalQuantity: ''
  }
];
