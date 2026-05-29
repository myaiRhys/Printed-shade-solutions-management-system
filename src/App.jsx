import { useState, useEffect } from 'react';
import { initializeStorage } from './utils/storage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuoteBuilder from './components/QuoteBuilder';
import JobTracker from './components/JobTracker';
import ClientDatabase from './components/ClientDatabase';
import Settings from './components/Settings';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initializeStorage();
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectClientForQuote = (client) => {
    setSelectedClient(client);
    setCurrentPage('quote-builder');
  };

  const handleQuoteSaved = () => {
    setSelectedClient(null);
    handleRefresh();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={refreshKey} onNavigate={setCurrentPage} />;
      case 'quote-builder':
        return (
          <QuoteBuilder
            key={refreshKey}
            selectedClient={selectedClient}
            onQuoteSaved={handleQuoteSaved}
            onClearClient={() => setSelectedClient(null)}
          />
        );
      case 'job-tracker':
        return <JobTracker key={refreshKey} onRefresh={handleRefresh} />;
      case 'clients':
        return (
          <ClientDatabase
            key={refreshKey}
            onSelectForQuote={handleSelectClientForQuote}
          />
        );
      case 'settings':
        return <Settings key={refreshKey} />;
      default:
        return <Dashboard key={refreshKey} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-layout">
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
      />

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
