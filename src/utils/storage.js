// PSS Local Storage Management
import { INITIAL_CLIENTS, DEFAULT_COMPANY_INFO } from './constants';

const STORAGE_KEYS = {
  JOBS: 'pss_jobs',
  CLIENTS: 'pss_clients',
  QUOTES: 'pss_quotes',
  SETTINGS: 'pss_settings',
  QUOTE_COUNTER: 'pss_quote_counter'
};

/**
 * Initialize storage with default data if empty
 */
export function initializeStorage() {
  // Initialize clients if not present
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
  }

  // Initialize empty jobs array if not present
  if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([]));
  }

  // Initialize empty quotes array if not present
  if (!localStorage.getItem(STORAGE_KEYS.QUOTES)) {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify([]));
  }

  // Initialize settings if not present
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_COMPANY_INFO));
  }

  // Initialize quote counter if not present
  if (!localStorage.getItem(STORAGE_KEYS.QUOTE_COUNTER)) {
    localStorage.setItem(STORAGE_KEYS.QUOTE_COUNTER, JSON.stringify({ year: new Date().getFullYear(), count: 0 }));
  }
}

// ============ JOBS ============

export function getJobs() {
  const jobs = localStorage.getItem(STORAGE_KEYS.JOBS);
  return jobs ? JSON.parse(jobs) : [];
}

export function getJobById(id) {
  const jobs = getJobs();
  return jobs.find(job => job.id === id);
}

export function saveJob(job) {
  const jobs = getJobs();
  const existingIndex = jobs.findIndex(j => j.id === job.id);

  if (existingIndex >= 0) {
    jobs[existingIndex] = { ...jobs[existingIndex], ...job, updatedAt: new Date().toISOString() };
  } else {
    jobs.push({ ...job, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  return job;
}

export function deleteJob(id) {
  const jobs = getJobs().filter(job => job.id !== id);
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
}

export function addJobNote(jobId, noteText) {
  const jobs = getJobs();
  const jobIndex = jobs.findIndex(j => j.id === jobId);

  if (jobIndex >= 0) {
    if (!jobs[jobIndex].notes) {
      jobs[jobIndex].notes = [];
    }
    jobs[jobIndex].notes.push({
      id: `note-${Date.now()}`,
      text: noteText,
      createdAt: new Date().toISOString()
    });
    jobs[jobIndex].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  }
}

// ============ CLIENTS ============

export function getClients() {
  const clients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  return clients ? JSON.parse(clients) : [];
}

export function getClientById(id) {
  const clients = getClients();
  return clients.find(client => client.id === id);
}

export function saveClient(client) {
  const clients = getClients();
  const existingIndex = clients.findIndex(c => c.id === client.id);

  if (existingIndex >= 0) {
    clients[existingIndex] = { ...clients[existingIndex], ...client };
  } else {
    clients.push({ ...client, id: client.id || `client-${Date.now()}` });
  }

  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  return client;
}

export function deleteClient(id) {
  const clients = getClients().filter(client => client.id !== id);
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

export function updateClientRevenue(clientId, amount) {
  const clients = getClients();
  const clientIndex = clients.findIndex(c => c.id === clientId);

  if (clientIndex >= 0) {
    clients[clientIndex].totalRevenue = (clients[clientIndex].totalRevenue || 0) + amount;
    clients[clientIndex].lastOrderDate = new Date().toISOString().split('T')[0];
    clients[clientIndex].totalOrders = (clients[clientIndex].totalOrders || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }
}

// ============ QUOTES ============

export function getQuotes() {
  const quotes = localStorage.getItem(STORAGE_KEYS.QUOTES);
  return quotes ? JSON.parse(quotes) : [];
}

export function getQuoteById(id) {
  const quotes = getQuotes();
  return quotes.find(quote => quote.id === id);
}

export function saveQuote(quote) {
  const quotes = getQuotes();
  const existingIndex = quotes.findIndex(q => q.id === quote.id);

  if (existingIndex >= 0) {
    quotes[existingIndex] = { ...quotes[existingIndex], ...quote };
  } else {
    quotes.push(quote);
  }

  localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  return quote;
}

// ============ QUOTE NUMBER GENERATION ============

export function generateQuoteNumber() {
  const currentYear = new Date().getFullYear();
  let counter = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTE_COUNTER));

  // Reset counter if new year
  if (counter.year !== currentYear) {
    counter = { year: currentYear, count: 0 };
  }

  counter.count += 1;
  localStorage.setItem(STORAGE_KEYS.QUOTE_COUNTER, JSON.stringify(counter));

  const paddedCount = String(counter.count).padStart(3, '0');
  return `PSS-${currentYear}-${paddedCount}`;
}

// ============ SETTINGS ============

export function getSettings() {
  const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return settings ? JSON.parse(settings) : DEFAULT_COMPANY_INFO;
}

export function saveSettings(settings) {
  const currentSettings = getSettings();
  const updatedSettings = { ...currentSettings, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  return updatedSettings;
}

// ============ DASHBOARD STATS ============

export function getDashboardStats() {
  const jobs = getJobs();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Active jobs (not complete or cancelled)
  const activeJobs = jobs.filter(job =>
    !['COMPLETE', 'CANCELLED'].includes(job.status)
  );

  // Jobs in production
  const inProduction = jobs.filter(job => job.status === 'IN PRODUCTION');

  // Calculate revenue this month (completed jobs)
  const revenueThisMonth = jobs
    .filter(job => {
      if (job.status !== 'COMPLETE' || !job.completedDate) return false;
      const completedDate = new Date(job.completedDate);
      return completedDate.getMonth() === currentMonth &&
             completedDate.getFullYear() === currentYear;
    })
    .reduce((sum, job) => sum + (job.totalValue || 0), 0);

  // Deposits overdue (DEPOSIT DUE status for more than 5 days)
  const depositsOverdue = jobs.filter(job => {
    if (job.status !== 'DEPOSIT DUE') return false;
    const statusDate = new Date(job.statusChangedAt || job.createdAt);
    const daysDiff = Math.floor((now - statusDate) / (1000 * 60 * 60 * 24));
    return daysDiff > 5;
  });

  // Quotes unanswered (QUOTED status for more than 7 days)
  const quotesUnanswered = jobs.filter(job => {
    if (job.status !== 'QUOTED') return false;
    const statusDate = new Date(job.statusChangedAt || job.createdAt);
    const daysDiff = Math.floor((now - statusDate) / (1000 * 60 * 60 * 24));
    return daysDiff > 7;
  });

  // Deadlines within 3 days
  const upcomingDeadlines = jobs.filter(job => {
    if (!job.deadline || ['COMPLETE', 'CANCELLED', 'DISPATCHED'].includes(job.status)) return false;
    const deadlineDate = new Date(job.deadline);
    const daysDiff = Math.floor((deadlineDate - now) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 3;
  });

  return {
    activeJobs: activeJobs.length,
    inProduction: inProduction.length,
    revenueThisMonth,
    depositsOverdue,
    quotesUnanswered,
    upcomingDeadlines
  };
}

// ============ EXPORT DATA ============

export function exportAllData() {
  return {
    jobs: getJobs(),
    clients: getClients(),
    quotes: getQuotes(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  };
}

export function importData(data) {
  if (data.jobs) {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(data.jobs));
  }
  if (data.clients) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
  }
  if (data.quotes) {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(data.quotes));
  }
  if (data.settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
  }
}
