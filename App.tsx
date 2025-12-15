import React, { useState, useEffect } from 'react';
import { InvoiceData, User, AppSettings, InvoiceItem } from './types';
import Dashboard from './views/Dashboard';
import InvoiceList from './views/InvoiceList';
import InvoiceEditor from './views/InvoiceEditor';
import Reports from './views/Reports';
import Users from './views/Users';
import Settings from './views/Settings';
import { LayoutDashboardIcon, FileTextIcon, UsersIcon, SettingsIcon, BarChartIcon, PalmTreeIcon, LogOutIcon } from './components/Icons';
import { supabase } from './lib/supabaseClient';

type ViewState = 
  | { type: 'dashboard' }
  | { type: 'invoices' }
  | { type: 'invoice-editor'; invoiceId?: string }
  | { type: 'reports' }
  | { type: 'users' }
  | { type: 'settings' };

export default function App() {
  const [view, setView] = useState<ViewState>({ type: 'dashboard' });
  const [loading, setLoading] = useState(true);
  
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

  // Fetch Data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Settings
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
    fetchData();
  }, []);

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
    
    // Determine added or removed users
    // For simplicity in this demo, we'll assume we process specific add/delete actions in the View,
    // but React state setters replace the whole array.
    // To handle this cleanly with the current View props structure, we will:
    // 1. Identify if it's an Add or Delete based on length comparison or just sync the diff.
    // Ideally, Views should call onAddUser / onDeleteUser. 
    // BUT, to keep refactoring minimal, let's look at how Users.tsx works: 
    // It calls setUsers([...users, newUser]) or setUsers(filtered).
    
    // Strategy: We will perform the DB operation based on diffing logic or assume the View is updated to call specific handlers?
    // Let's modify the View props slightly? No, let's keep the prop signature matching React.Dispatch but intercept it.
    
    // Find removed IDs
    const currentIds = users.map(u => u.id);
    const nextIds = nextUsers.map(u => u.id);
    const removedIds = currentIds.filter(id => !nextIds.includes(id));
    const addedUsers = nextUsers.filter(u => !currentIds.includes(u.id));

    if (removedIds.length > 0) {
      await supabase.from('users').delete().in('id', removedIds);
    }

    if (addedUsers.length > 0) {
      const usersToInsert = addedUsers.map(u => ({
         // id: u.id, // Let Supabase generate ID or use the one from frontend if it's UUID.
         // View uses Date.now(), which isn't UUID. 
         // We should really let the View generate UUIDs or let Supabase do it.
         // For now, let's just insert name/email/role and let Supabase gen ID, then reload?
         // OR, we just update local state and insert.
         name: u.name,
         email: u.email,
         role: u.role
      }));
      await supabase.from('users').insert(usersToInsert);
      // We should ideally reload users to get real UUIDs, but for now:
      fetchData(); // Simplest way to sync IDs
      return; 
    }

    setUsers(nextUsers);
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
    if (loading && invoices.length === 0 && users.length === 0) {
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
          onCreate={() => setView({ type: 'invoice-editor' })}
          onEdit={(inv) => setView({ type: 'invoice-editor', invoiceId: inv.id })}
          onDelete={handleDeleteInvoice}
        />;
      case 'invoice-editor':
        const initialData = view.invoiceId ? invoices.find(i => i.id === view.invoiceId) : null;
        return <InvoiceEditor 
          initialData={initialData} 
          settings={settings}
          onSave={handleSaveInvoice}
          onBack={() => setView({ type: 'invoices' })} 
          isSaving={loading}
        />;
      case 'reports':
        return <Reports invoices={invoices} currency={settings.currencySymbol} />;
      case 'users':
        return <Users users={users} setUsers={handleUsersUpdate} />;
      case 'settings':
        return <Settings settings={settings} setSettings={handleSettingsUpdate} />;
      default:
        return <div>Not found</div>;
    }
  };

  const navItemClass = (active: boolean) => 
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-sandpix-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`;

  // If editing/viewing invoice (Print Mode checks), render simple Layout or Full screen
  if (view.type === 'invoice-editor') {
    return (
      <div className="bg-gray-100 min-h-screen">
         {renderView()}
      </div>
    );
  }

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
          <button onClick={() => setView({ type: 'dashboard' })} className={navItemClass(view.type === 'dashboard')}>
            <LayoutDashboardIcon /> Dashboard
          </button>
          <button onClick={() => setView({ type: 'invoices' })} className={navItemClass(view.type === 'invoices')}>
            <FileTextIcon /> Invoices
          </button>
          <button onClick={() => setView({ type: 'reports' })} className={navItemClass(view.type === 'reports')}>
            <BarChartIcon /> Reports
          </button>
          <button onClick={() => setView({ type: 'users' })} className={navItemClass(view.type === 'users')}>
            <UsersIcon /> Users
          </button>
           <button onClick={() => setView({ type: 'settings' })} className={navItemClass(view.type === 'settings')}>
            <SettingsIcon /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full">
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