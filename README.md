# PSS Management System

A complete web-based management system for Printed Shadenet Solutions (PSS), a screen printing business in Cape Town.

## Features

- **Dashboard** - Summary stats, alerts for overdue deposits/quotes, deadline warnings
- **Quote Builder** - Live pricing calculator with all business pricing logic
- **Job Tracker** - Track jobs through all stages with status management
- **Job Card Generator** - Print-ready job cards for the production floor
- **Client Database** - Searchable client list with tier management
- **PDF Generation** - Professional quotes and job cards

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Pricing Logic

The system implements the following pricing structure:

### Base Prices (per print)
- Small: R350
- Medium: R450
- Large: R550
- XLarge: R750

### Multipliers
- **Ink Coverage**: Low (1.0x), Medium (1.2x), High (1.4x), Full (1.6x)
- **Colours**: 1 (1.0x), 2 (1.25x), 3 (1.5x), 4 (1.75x), 5 (2.0x)

### Additional Charges
- Shade cloth (PSS supplied): R55/metre
- Screen fees (new client): R1,850/screen
- Screen fees (return after 6 months): R950/screen
- Screen fees (loyal/return within 6 months): R0

### Discounts
- 25+ prints: 2.5%
- 50+ prints: 5%
- 100+ prints: 10%
- 200+ prints: 15%

### Other
- VAT: 15%
- Deposit: 50%
- Minimum order: 5 prints

## Job Statuses

Jobs flow through these stages:
1. ENQUIRY
2. QUOTED
3. DEPOSIT DUE
4. IN PRODUCTION
5. DISPATCHED
6. COMPLETE

Additional statuses: ON HOLD, CANCELLED

## Data Storage

All data is stored in browser localStorage. Use the Settings > Data Management section to:
- Export backups
- Import backups
- Clear all data

## Tech Stack

- React 19
- Vite
- jsPDF for PDF generation
- Custom CSS (no UI libraries)

## Brand Colours

- Primary teal: #2A9D8F
- Dark teal: #1F7A6E
- Light teal: #E8F6F4
- Dark text: #1A1A1A
- Grey: #666666
- Background: #F5F5F5
