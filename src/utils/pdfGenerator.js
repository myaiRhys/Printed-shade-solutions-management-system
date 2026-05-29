// PSS PDF Generator using jsPDF
import jsPDF from 'jspdf';
import { formatCurrency } from './pricing';
import { PRICING } from './constants';

/**
 * Generate Quote/Invoice PDF
 */
export function generateQuotePDF(quote, settings, isInvoice = false) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Colors
  const primaryColor = [42, 157, 143]; // #2A9D8F
  const darkText = [26, 26, 26]; // #1A1A1A
  const greyText = [102, 102, 102]; // #666666

  // Header with company branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PRINTED SHADE SOLUTIONS', margin, 25);

  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Innovative Brand Exposure Through Printed Shadenet Products', margin, 33);

  yPos = 55;

  // Document type header
  doc.setTextColor(...darkText);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(isInvoice ? 'TAX INVOICE' : 'QUOTATION', pageWidth - margin, yPos, { align: 'right' });

  yPos += 15;

  // Company details (left side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...greyText);

  const companyDetails = [
    `Email: ${settings.email || 'marketing@printedshade.co.za'}`,
    `Phone: ${settings.phone || '082 331 5379'}`,
    `Address: ${settings.address || 'Unit 10, Celie Industrial Park, Celie Rd, Retreat, Cape Town'}`,
    `Website: ${settings.website || 'www.printedshade.co.za'}`
  ];

  companyDetails.forEach((line, index) => {
    doc.text(line, margin, yPos + (index * 5));
  });

  // Quote/Invoice details (right side)
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  const docDetails = [
    [`${isInvoice ? 'Invoice' : 'Quote'} No:`, quote.quoteNumber],
    ['Date:', new Date(quote.createdAt).toLocaleDateString('en-ZA')],
    ['Valid Until:', new Date(new Date(quote.createdAt).getTime() + (PRICING.quoteValidityDays * 24 * 60 * 60 * 1000)).toLocaleDateString('en-ZA')]
  ];

  docDetails.forEach((detail, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...greyText);
    doc.text(detail[0], pageWidth - 70, yPos + (index * 5));
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(detail[1], pageWidth - margin, yPos + (index * 5), { align: 'right' });
  });

  yPos += 35;

  // Bill To section
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 35, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('BILL TO:', margin + 5, yPos + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const clientDetails = [
    quote.clientName,
    `Contact: ${quote.contactPerson}`,
    `Email: ${quote.clientEmail}`,
    `Phone: ${quote.clientPhone}`
  ].filter(Boolean);

  clientDetails.forEach((line, index) => {
    doc.text(line, margin + 5, yPos + 10 + (index * 5));
  });

  yPos += 45;

  // Job Description
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('JOB DESCRIPTION', margin, yPos);

  yPos += 8;

  // Job details table
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const jobDetails = [
    ['Number of Prints:', quote.numberOfPrints.toString()],
    ['Print Size:', quote.printSize],
    ['Number of Colours:', quote.numberOfColours.toString()],
    ['Ink Coverage:', quote.inkCoverage],
    ['Cloth Supply:', quote.clothSupply]
  ];

  if (quote.printLength) {
    jobDetails.push(['Print (L x H):', `${quote.printLength}m x ${quote.printHeight}m`]);
  }
  if (quote.printsPerRoll) {
    jobDetails.push(['Prints / Roll:', quote.printsPerRoll.toString()]);
  }
  const rollsNeeded = quote.breakdown?.rollsNeeded || quote.rollsNeeded;
  if (rollsNeeded) {
    jobDetails.push(['Rolls Needed:', `${rollsNeeded} (${quote.breakdown?.clothLinearMetres || quote.linearMetres}m)`]);
  }

  jobDetails.forEach((detail, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...greyText);
    doc.text(detail[0], margin, yPos + (index * 6));
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(detail[1], margin + 50, yPos + (index * 6));
  });

  yPos += (jobDetails.length * 6) + 13;

  // Line items table header
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPTION', margin + 3, yPos);
  doc.text('AMOUNT', pageWidth - margin - 3, yPos, { align: 'right' });

  yPos += 10;

  // Line items
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');

  const lineItems = [];

  // Print cost
  lineItems.push({
    description: `${quote.numberOfPrints} × ${quote.printSize} prints (${quote.inkCoverage} coverage, ${quote.numberOfColours} colour${quote.numberOfColours > 1 ? 's' : ''})`,
    amount: quote.breakdown.printSubtotal
  });

  // Screen fees
  if (quote.breakdown.screenFees > 0) {
    lineItems.push({
      description: `Screen setup fees (${quote.numberOfColours} screen${quote.numberOfColours > 1 ? 's' : ''})`,
      amount: quote.breakdown.screenFees
    });
  }

  // Cloth cost (charged by whole rolls consumed)
  if (quote.breakdown.clothCost > 0) {
    const rolls = quote.breakdown.rollsNeeded;
    const clothMetres = quote.breakdown.clothLinearMetres || quote.breakdown.clothMetres;
    const rollLabel = rolls ? `${rolls} roll${rolls !== 1 ? 's' : ''} = ` : '';
    lineItems.push({
      description: `Shade cloth supply (${rollLabel}${clothMetres}m @ R${PRICING.clothPricePerMetre}/m)`,
      amount: quote.breakdown.clothCost
    });
  }

  // Volume discount
  if (quote.breakdown.volumeDiscountAmount > 0) {
    lineItems.push({
      description: `Volume discount (${(quote.breakdown.volumeDiscountRate * 100).toFixed(1)}%)`,
      amount: -quote.breakdown.volumeDiscountAmount
    });
  }

  lineItems.forEach((item, index) => {
    const y = yPos + (index * 8);
    doc.text(item.description, margin + 3, y);
    doc.text(formatCurrency(item.amount), pageWidth - margin - 3, y, { align: 'right' });

    // Draw line separator
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
  });

  yPos += (lineItems.length * 8) + 10;

  // Totals section
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 80, yPos, pageWidth - margin, yPos);

  yPos += 8;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 80, yPos);
  doc.text(formatCurrency(quote.breakdown.subtotal), pageWidth - margin, yPos, { align: 'right' });

  yPos += 8;

  // VAT
  doc.text(`VAT (${(PRICING.vatRate * 100)}%):`, pageWidth - 80, yPos);
  doc.text(formatCurrency(quote.breakdown.vat), pageWidth - margin, yPos, { align: 'right' });

  yPos += 10;

  // Total
  doc.setFillColor(...primaryColor);
  doc.rect(pageWidth - 85, yPos - 5, 65, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 80, yPos + 2);
  doc.text(formatCurrency(quote.breakdown.total), pageWidth - margin - 3, yPos + 2, { align: 'right' });

  yPos += 20;

  // Payment terms
  doc.setTextColor(...darkText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT TERMS', margin, yPos);

  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...greyText);

  const paymentTerms = [
    `50% Deposit Required: ${formatCurrency(quote.breakdown.deposit)}`,
    `Balance Due on Completion: ${formatCurrency(quote.breakdown.balance)}`,
    `Quote Valid for ${PRICING.quoteValidityDays} days from date of issue`,
    '',
    'Artwork Note: Please ensure all artwork is supplied in vector format (AI, EPS, or PDF).',
    'Production will commence upon receipt of deposit and approved artwork.'
  ];

  paymentTerms.forEach((line, index) => {
    doc.text(line, margin, yPos + (index * 5));
  });

  yPos += 40;

  // Banking details
  if (settings.bankName && settings.accountNumber) {
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BANKING DETAILS', margin, yPos);

    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...greyText);

    const bankDetails = [
      `Bank: ${settings.bankName}`,
      `Account Number: ${settings.accountNumber}`,
      `Branch Code: ${settings.branchCode}`,
      `Account Type: ${settings.accountType || 'Business Current'}`,
      `Reference: ${quote.quoteNumber}`
    ];

    bankDetails.forEach((line, index) => {
      doc.text(line, margin, yPos + (index * 5));
    });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY - 5, pageWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 3, { align: 'center' });
  doc.text(`${settings.website || 'www.printedshade.co.za'} | ${settings.email || 'marketing@printedshade.co.za'}`, pageWidth / 2, footerY + 8, { align: 'center' });

  return doc;
}

/**
 * Generate Job Card PDF for print floor
 */
export function generateJobCardPDF(job) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 15;

  // Colors
  const primaryColor = [42, 157, 143];
  const darkText = [26, 26, 26];
  const greyText = [102, 102, 102];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PSS JOB CARD', margin, 20);

  doc.setFontSize(14);
  doc.text(job.jobNumber, pageWidth - margin, 20, { align: 'right' });

  yPos = 45;

  // Client Info Box
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 25, 'F');

  doc.setTextColor(...darkText);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(job.clientName, margin + 5, yPos + 5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...greyText);
  doc.text(`Contact: ${job.contactPerson || 'N/A'}`, margin + 5, yPos + 13);

  // Deadline (prominent display)
  if (job.deadline) {
    doc.setFillColor(254, 243, 199); // Warning yellow
    doc.rect(pageWidth - margin - 60, yPos - 5, 60, 25, 'F');
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DEADLINE', pageWidth - margin - 30, yPos + 2, { align: 'center' });
    doc.setFontSize(12);
    doc.text(new Date(job.deadline).toLocaleDateString('en-ZA'), pageWidth - margin - 30, yPos + 12, { align: 'center' });
  }

  yPos += 35;

  // Main job specifications
  doc.setTextColor(...darkText);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('JOB SPECIFICATIONS', margin, yPos);

  yPos += 10;

  // Specs grid
  const specs = [
    ['Total Prints', job.numberOfPrints?.toString() || 'N/A'],
    ['Print Size (L x H)', job.printLength ? `${job.printLength}m x ${job.printHeight || '1.8'}m` : `${job.printHeight || '1.8'}m high`],
    ['Prints Per Roll', job.printsPerRoll?.toString() || 'N/A'],
    ['Rolls Needed', job.rollsNeeded ? `${job.rollsNeeded} (${job.linearMetres}m)` : 'N/A'],
    ['Number of Colours', job.numberOfColours?.toString() || 'N/A'],
    ['Ink Coverage', job.inkCoverage || 'N/A'],
    ['Print Type', job.printSize || 'N/A'],
    ['Cloth Supply', job.clothSupply || 'PSS Supplied']
  ];

  doc.setFontSize(10);
  const colWidth = (pageWidth - (margin * 2)) / 2;

  specs.forEach((spec, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + (col * colWidth);
    const y = yPos + (row * 15);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...greyText);
    doc.text(spec[0] + ':', x, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(spec[1], x + 45, y);

    // Draw separator line
    doc.setDrawColor(230, 230, 230);
    doc.line(x, y + 5, x + colWidth - 10, y + 5);
  });

  yPos += (Math.ceil(specs.length / 2) * 15) + 15;

  // Layout/Spacing section
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LAYOUT & SPACING NOTES', margin + 5, yPos + 1);

  yPos += 15;

  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const layoutNotes = job.layoutNotes || 'Standard layout - refer to artwork';
  const splitNotes = doc.splitTextToSize(layoutNotes, pageWidth - (margin * 2));
  doc.text(splitNotes, margin, yPos);

  yPos += (splitNotes.length * 6) + 15;

  // Special Instructions
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SPECIAL INSTRUCTIONS', margin + 5, yPos + 1);

  yPos += 15;

  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const specialInstructions = job.specialInstructions || 'None';
  const splitInstructions = doc.splitTextToSize(specialInstructions, pageWidth - (margin * 2));
  doc.text(splitInstructions, margin, yPos);

  yPos += (splitInstructions.length * 6) + 20;

  // Quality Checklist
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 50, 'F');

  doc.setTextColor(...darkText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('QUALITY CHECKLIST', margin + 5, yPos + 3);

  yPos += 12;

  const checklist = [
    '[ ] Artwork verified and approved',
    '[ ] Screens prepared and aligned',
    '[ ] Ink colours matched',
    '[ ] Test print completed',
    '[ ] Client approval (if required)',
    '[ ] Final quality inspection passed'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  checklist.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + 5 + (col * 90);
    const y = yPos + (row * 8);
    doc.text(item, x, y);
  });

  yPos += 35;

  // Sign-off section
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);

  doc.setTextColor(...greyText);
  doc.setFontSize(9);

  doc.text('Printed by:', margin, yPos);
  doc.line(margin + 25, yPos, margin + 80, yPos);

  doc.text('Date:', margin + 90, yPos);
  doc.line(margin + 100, yPos, margin + 140, yPos);

  yPos += 15;

  doc.text('QC Approved:', margin, yPos);
  doc.line(margin + 30, yPos, margin + 80, yPos);

  doc.text('Date:', margin + 90, yPos);
  doc.line(margin + 100, yPos, margin + 140, yPos);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setTextColor(...greyText);
  doc.setFontSize(8);
  doc.text(`Job Card Generated: ${new Date().toLocaleString('en-ZA')}`, margin, footerY);
  doc.text(`Job #: ${job.jobNumber}`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

/**
 * Download PDF
 */
export function downloadPDF(doc, filename) {
  doc.save(filename);
}
