import React, { useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { OwnerListView } from './components/owners/OwnerListView';
import { OwnerProfileView } from './components/owners/OwnerProfileView';
import { OwnerQualificationModal } from './components/owners/OwnerQualificationModal';
import { AddOwnerModal } from './components/owners/AddOwnerModal';
import { TelecallerView } from './components/dialer/TelecallerView';
import { SalesPipelineView } from './components/pipelines/SalesPipelineView';
import { RentalPipelineView } from './components/pipelines/RentalPipelineView';
import { ListingsView } from './components/listings/ListingsView';
import { BuyerListView } from './components/buyers/BuyerListView';
import { TenantListView } from './components/tenants/TenantListView';
import { PropertyMatcherView } from './components/matching/PropertyMatcherView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { TemplatesView } from './components/templates/TemplatesView';
import { SettingsView } from './components/settings/SettingsView';
import { ImportModal } from './components/import/ImportModal';
import { Owner } from './types';

const MainAppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  
  // Modals
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isAddOwnerOpen, setIsAddOwnerOpen] = useState<boolean>(false);
  const [qualifyingOwner, setQualifyingOwner] = useState<Owner | null>(null);

  const handleSelectOwner = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setCurrentView('owner_profile');
  };

  const handleOpenQualify = (owner: Owner) => {
    setQualifyingOwner(owner);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 selection:bg-amber-200 selection:text-amber-950">
      {/* Top Global Navigation */}
      <Navbar 
        onOpenImport={() => setIsImportOpen(true)}
        onOpenAddOwner={() => setIsAddOwnerOpen(true)}
        onSelectOwner={handleSelectOwner}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          currentView={currentView}
          onSelectView={(view) => {
            setCurrentView(view);
            if (view !== 'owner_profile') {
              setSelectedOwnerId(null);
            }
          }}
          onOpenImport={() => setIsImportOpen(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {currentView === 'dashboard' && (
            <DashboardView 
              onSelectOwner={handleSelectOwner}
              onOpenImport={() => setIsImportOpen(true)}
              onNavigate={(view) => setCurrentView(view)}
            />
          )}

          {currentView === 'owners' && (
            <OwnerListView 
              onSelectOwner={handleSelectOwner}
              onOpenImport={() => setIsImportOpen(true)}
              onOpenAddOwner={() => setIsAddOwnerOpen(true)}
              onOpenQualify={handleOpenQualify}
            />
          )}

          {currentView === 'owner_profile' && selectedOwnerId && (
            <OwnerProfileView 
              ownerId={selectedOwnerId}
              onBack={() => setCurrentView('owners')}
              onOpenQualify={handleOpenQualify}
            />
          )}

          {currentView === 'telecaller' && (
            <TelecallerView 
              onOpenQualify={handleOpenQualify}
              onSelectOwner={handleSelectOwner}
            />
          )}

          {currentView === 'sales_pipeline' && (
            <SalesPipelineView 
              onSelectOwner={handleSelectOwner}
              onOpenAddOwner={() => setIsAddOwnerOpen(true)}
            />
          )}

          {currentView === 'rental_pipeline' && (
            <RentalPipelineView 
              onSelectOwner={handleSelectOwner}
            />
          )}

          {currentView === 'listings' && (
            <ListingsView 
              onSelectOwner={handleSelectOwner}
            />
          )}

          {currentView === 'buyers' && (
            <BuyerListView 
              onNavigateToMatcher={() => setCurrentView('matcher')}
            />
          )}

          {currentView === 'tenants' && (
            <TenantListView 
              onNavigateToMatcher={() => setCurrentView('matcher')}
            />
          )}

          {currentView === 'matcher' && (
            <PropertyMatcherView 
              onSelectOwner={handleSelectOwner}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {currentView === 'templates' && (
            <TemplatesView />
          )}

          {currentView === 'users' && (
            <SettingsView initialTab="users" />
          )}

          {currentView === 'roles' && (
            <SettingsView initialTab="roles" />
          )}

          {currentView === 'settings' && (
            <SettingsView initialTab="database" />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ImportModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      <AddOwnerModal 
        isOpen={isAddOwnerOpen}
        onClose={() => setIsAddOwnerOpen(false)}
      />

      <OwnerQualificationModal 
        isOpen={Boolean(qualifyingOwner)}
        owner={qualifyingOwner}
        onClose={() => setQualifyingOwner(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <MainAppContent />
    </CrmProvider>
  );
}
