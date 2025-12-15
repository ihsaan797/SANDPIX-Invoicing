import React, { useState, useEffect } from 'react';
import { InvoiceData, User, AppSettings, InvoiceItem } from './types';
import Dashboard from './views/Dashboard';
import InvoiceList from './views/InvoiceList';
import InvoiceEditor from './views/InvoiceEditor';
import Reports from './views/Reports';
import Users from './views/Users';
import Settings from './views/Settings';
import Login from './views/Login';
import { LayoutDashboardIcon, FileTextIcon, UsersIcon, SettingsIcon, BarChartIcon, PalmTreeIcon, LogOutIcon } from './components/Icons';
import { supabase } from './lib/supabaseClient';

type ViewState = 
  | { type: 'dashboard' }
  | { type: 'invoices' }
  | { type: 'invoice-editor'; invoiceId?: string; mode?: 'edit' | 'preview'; autoPrint?: boolean }
  | { type: 'reports' }
  | { type: 'users' }
  | { type: 'settings' };

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>({ type: 'dashboard' });
  const [loading, setLoading] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  
  // App State
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'SANDPIX MALDIVES',
    companyAddress: 'Maafushi, Kaafu Atoll\nRepublic of Maldives',
    companyEmail: 'contact@sandpixmaldives.com',
    gstNumber: undefined,
    defaultTaxRate: 6,
    currencySymbol: 'MVR',
    logoUrl: undefined
  });

  const [users, setUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  // Check for persisted user session
  useEffect(() => {
    const storedUser = localStorage.getItem('sandpix_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        // Redirect viewers to invoices view by default as they don't have dashboard access
        if (user.role === 'viewer') {
          setView({ type: 'invoices' });
        }
      } catch (e) {
        localStorage.removeItem('sandpix_user');
      }
    }
    setAppInitialized(true);
  }, []);

  // Fetch Data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Settings - Always fetch settings to display logo on Login screen
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      if (settingsData) {
        setSettings({
          companyName: settingsData.company_name,
          companyAddress: settingsData.company_address,
          companyEmail: settingsData.company_email,
          gstNumber: settingsData.gst_number,
          defaultTaxRate: settingsData.default_tax_rate,
          currencySymbol: settingsData.currency_symbol,
          logoUrl: settingsData.logo_url
        });
      }

      // If no user is logged in, we only needed the settings (branding). Stop here.
      if (!currentUser) {
        return;
      }

      // 2. Fetch Users
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) {
        setUsers(usersData);
      }

      // 3. Fetch Invoices and Items
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select(`*, invoice_items (*)`);
      
      if (invoicesData) {
        const formattedInvoices: InvoiceData[] = invoicesData.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          status: inv.status,
          date: inv.date,
          dueDate: inv.due_date,
          clientName: inv.client_name,
          clientAddress: inv.client_address,
          clientEmail: inv.client_email,
          currency: inv.currency,
          taxRate: inv.tax_rate,
          notes: inv.notes,
          terms: inv.terms,
          items: inv.invoice_items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate
          }))
        }));
        setInvoices(formattedInvoices);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data when app initializes or user changes
    fetchData();
  }, [currentUser]);

  // Auth Actions
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sandpix_user', JSON.stringify(user));
    // Redirect viewers directly to invoices
    if (user.role === 'viewer') {
      setView({ type: 'invoices' });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sandpix_user');
    setView({ type: 'dashboard' });
  };

  // Sync Settings
  const handleSettingsUpdate = async (newSettingsOrFn: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    // Calculate new state
    const newSettings = typeof newSettingsOrFn === 'function' 
      ? newSettingsOrFn(settings) 
      : newSettingsOrFn;
    
    // Update local state immediately for UI responsiveness
    setSettings(newSettings);

    // Persist to Supabase
    const { error } = await supabase.from('settings').upsert({
      id: 1,
      company_name: newSettings.companyName,
      company_address: newSettings.companyAddress,
      company_email: newSettings.companyEmail,
      gst_number: newSettings.gstNumber,
      default_tax_rate: newSettings.defaultTaxRate,
      currency_symbol: newSettings.currencySymbol,
      logo_url: newSettings.logoUrl
    });

    if (error) console.error("Error saving settings:", error);
  };

  // Sync Users
  const handleUsersUpdate = async (newUsersOrFn: User[] | ((prev: User[]) => User[])) => {
    const nextUsers = typeof newUsersOrFn === 'function' ? newUsersOrFn(users) : newUsersOrFn;
    
    // Update local state immediately for responsiveness
    setUsers(nextUsers);

    // 1. Handle Deletes (Code retained for data integrity, but UI delete removed)
    const currentIds = users.map(u => u.id);
    const nextIds = nextUsers.map(u => u.id);
    
    // Only attempt to delete IDs that look like UUIDs (length > 20)
    const removedIds = currentIds.filter(id => !nextIds.includes(id) && id.length > 20);

    if (removedIds.length > 0) {
      const { error } = await supabase.from('users').delete().in('id', removedIds);
      if (error) {
        console.error("Error deleting users:", error);
        fetchData(); // Revert state from server
        return;
      }
    }

    // 2. Handle Upserts (Updates & Inserts)
    const updates = [];
    const inserts = [];

    for (const u of nextUsers) {
      if (currentIds.includes(u.id)) {
        // Existing user -> Update
        // Only update if it has a real UUID, otherwise skip to avoid temp ID errors
        if (u.id.length > 20) {
          updates.push({
             id: u.id,
             name: u.name,
             email: u.email,
             role: u.role,
             password: u.password,
             active: u.active
          });
        }
      } else {
        // New user -> Insert
        inserts.push({
           name: u.name,
           email: u.email,
           role: u.role,
           password: u.password,
           active: u.active !== false // Default to true if not set
        });
      }
    }

    if (updates.length > 0) {
      const { error } = await supabase.from('users').upsert(updates);
      if (error) console.error("Error updating users:", error);
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from('users').insert(inserts);
      if (error) console.error("Error inserting users:", error);
      // Fetch fresh data to get generated IDs for new users
      fetchData(); 
    }
  };

  // Router Actions & Data Persistence
  const handleSaveInvoice = async (data: InvoiceData) => {
    setLoading(true);

    // 1. Upsert Invoice
    const { data: savedInvoice, error: invError } = await supabase.from('invoices').upsert({
      // If the incoming ID looks like a valid UUID, use it. Otherwise undefined to let DB generate one.
      id: data.id.includes('-') && data.id.length > 20 ? data.id : undefined,
      invoice_number: data.invoiceNumber,
      status: data.status,
      date: data.date,
      due_date: data.dueDate,
      client_name: data.clientName,
      client_address: data.clientAddress,
      client_email: data.clientEmail,
      currency: data.currency,
      tax_rate: data.taxRate,
      notes: data.notes,
      terms: data.terms
    }).select().single();

    if (invError) {
      console.error("Error saving invoice", invError);
      setLoading(false);
      return;
    }

    const realId = savedInvoice.id;

    // 2. Handle Items: Delete all for this invoice and insert new
    await supabase.from('invoice_items').delete().eq('invoice_id', realId);

    const itemsToInsert = data.items.map(item => ({
      invoice_id: realId,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate
    }));

    if (itemsToInsert.length > 0) {
      await supabase.from('invoice_items').insert(itemsToInsert);
    }

    await fetchData(); // Refresh data
    setView({ type: 'invoices' });
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await supabase.from('invoices').delete().eq('id', id);
      setInvoices(prev => prev.filter(i => i.id !== id));
    }
  };

  // Views Logic
  const renderView = () => {
    if (loading && invoices.length === 0 && users.length === 0 && view.type !== 'dashboard') {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sandpix-600"></div>
        </div>
      );
    }

    switch(view.type) {
      case 'dashboard':
        return <Dashboard invoices={invoices} users={users} currency={settings.currencySymbol} />;
      case 'invoices':
        return <InvoiceList 
          invoices={invoices} 
          currency={settings.currencySymbol}
          onCreate={() => setView({ type: 'invoice-editor', mode: 'edit' })}
          onEdit={(inv) => setView({ type: 'invoice-editor', invoiceId: inv.id, mode: 'edit' })}
          onView={(inv) => setView({ type: 'invoice-editor', invoiceId: inv.id, mode: 'preview' })}
          onDownload={(inv) => setView({ type: 'invoice-editor', invoiceId: inv.id, mode: 'preview', autoPrint: true })}
          onDelete={handleDeleteInvoice}
          currentUser={currentUser!}
        />;
      case 'invoice-editor':
        const initialData = view.invoiceId ? invoices.find(i => i.id === view.invoiceId) : null;
        return <InvoiceEditor 
          initialData={initialData} 
          settings={settings}
          onSave={handleSaveInvoice}
          onBack={() => setView({ type: 'invoices' })} 
          isSaving={loading}
          initialMode={view.mode || 'edit'}
          autoPrint={view.autoPrint}
          currentUser={currentUser!}
        />;
      case 'reports':
        return <Reports invoices={invoices} currency={settings.currencySymbol} />;
      case 'users':
        return <Users users={users} setUsers={handleUsersUpdate} currentUser={currentUser!} />;
      case 'settings':
        return <Settings settings={settings} setSettings={handleSettingsUpdate} currentUser={currentUser!} />;
      default:
        return <div>Not found</div>;
    }
  };

  const navItemClass = (active: boolean) => 
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-sandpix-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`;

  if (!appInitialized) {
    return null; // or a loading spinner
  }

  // Login Gate
  if (!currentUser) {
    return <Login onLogin={handleLogin} logoUrl={settings.logoUrl} companyName={settings.companyName} />;
  }

  // If editing/viewing invoice (Print Mode checks), render simple Layout or Full screen
  if (view.type === 'invoice-editor') {
    return (
      <div className="bg-gray-100 min-h-screen">
         {renderView()}
      </div>
    );
  }

  const isViewer = currentUser.role === 'viewer';

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col no-print">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          {settings.logoUrl ? (
             <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-md" />
          ) : (
             <PalmTreeIcon className="w-8 h-8 text-sandpix-500" />
          )}
          <div>
            <h1 className="font-bold text-lg tracking-wide">SANDPIX</h1>
            <p className="text-xs text-gray-400">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-4 py-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
             Menu
          </div>
          {!isViewer && (
            <button onClick={() => setView({ type: 'dashboard' })} className={navItemClass(view.type === 'dashboard')}>
              <LayoutDashboardIcon /> Dashboard
            </button>
          )}
          <button onClick={() => setView({ type: 'invoices' })} className={navItemClass(view.type === 'invoices')}>
            <FileTextIcon /> Invoices
          </button>
          <button onClick={() => setView({ type: 'reports' })} className={navItemClass(view.type === 'reports')}>
            <BarChartIcon /> Reports
          </button>
          
          {!isViewer && (
            <>
              <div className="px-4 py-2 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                 Administration
              </div>
              <button onClick={() => setView({ type: 'users' })} className={navItemClass(view.type === 'users')}>
                <UsersIcon /> Team
              </button>
               <button onClick={() => setView({ type: 'settings' })} className={navItemClass(view.type === 'settings')}>
                <SettingsIcon /> Settings
              </button>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-sandpix-600 flex items-center justify-center text-sm font-bold">
               {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium truncate">{currentUser.name}</p>
               <p className="text-xs text-gray-400 truncate capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-300 hover:text-red-100 hover:bg-white/5 rounded-lg transition-colors w-full"
          >
            <LogOutIcon /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
}