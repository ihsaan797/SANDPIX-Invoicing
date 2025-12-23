import React, { useState, useEffect } from 'react';
import { InvoiceData, QuotationData, User, AppSettings, InvoiceItem } from './types';
import Dashboard from './views/Dashboard';
import InvoiceList from './views/InvoiceList';
import InvoiceEditor from './views/InvoiceEditor';
import QuotationList from './views/QuotationList';
import QuotationEditor from './views/QuotationEditor';
import Reports from './views/Reports';
import Users from './views/Users';
import Settings from './views/Settings';
import Login from './views/Login';
import { LayoutDashboardIcon, FileTextIcon, UsersIcon, SettingsIcon, BarChartIcon, PalmTreeIcon, LogOutIcon, MenuIcon, XIcon, ClipboardListIcon } from './components/Icons';
import { supabase } from './lib/supabaseClient';

type ViewState = 
  | { type: 'dashboard' }
  | { type: 'invoices' }
  | { type: 'invoice-editor'; invoiceId?: string; mode?: 'edit' | 'preview'; autoPrint?: boolean }
  | { type: 'quotations' }
  | { type: 'quotation-editor'; quotationId?: string; mode?: 'edit' | 'preview'; autoPrint?: boolean }
  | { type: 'reports' }
  | { type: 'users' }
  | { type: 'settings' };

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>({ type: 'dashboard' });
  const [loading, setLoading] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
  const [quotations, setQuotations] = useState<QuotationData[]>([]);

  // Check for persisted user session
  useEffect(() => {
    const storedUser = localStorage.getItem('sandpix_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
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

      if (!currentUser) return;

      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) setUsers(usersData);

      // Fetch Invoices
      const { data: invoicesData } = await supabase.from('invoices').select(`*, invoice_items (*)`);
      if (invoicesData) {
        setInvoices(invoicesData.map((inv: any) => ({
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
        })));
      }

      // Fetch Quotations (assuming a similar table exists or creating logic for it)
      const { data: quotationsData } = await supabase.from('quotations').select(`*, quotation_items (*)`);
      if (quotationsData) {
        setQuotations(quotationsData.map((q: any) => ({
          id: q.id,
          quotationNumber: q.quotation_number,
          status: q.status,
          date: q.date,
          validUntil: q.valid_until,
          clientName: q.client_name,
          clientAddress: q.client_address,
          clientEmail: q.client_email,
          currency: q.currency,
          taxRate: q.tax_rate,
          notes: q.notes,
          terms: q.terms,
          items: q.quotation_items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate
          }))
        })));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sandpix_user', JSON.stringify(user));
    if (user.role === 'viewer') setView({ type: 'invoices' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sandpix_user');
    setView({ type: 'dashboard' });
  };

  const handleSettingsUpdate = async (newSettingsOrFn: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    const newSettings = typeof newSettingsOrFn === 'function' ? newSettingsOrFn(settings) : newSettingsOrFn;
    setSettings(newSettings);
    await supabase.from('settings').upsert({
      id: 1,
      company_name: newSettings.companyName,
      company_address: newSettings.companyAddress,
      company_email: newSettings.companyEmail,
      gst_number: newSettings.gstNumber,
      default_tax_rate: newSettings.defaultTaxRate,
      currency_symbol: newSettings.currencySymbol,
      logo_url: newSettings.logoUrl
    });
  };

  const handleUsersUpdate = async (newUsersOrFn: User[] | ((prev: User[]) => User[])) => {
    const nextUsers = typeof newUsersOrFn === 'function' ? newUsersOrFn(users) : newUsersOrFn;
    setUsers(nextUsers);
    // Persist logic already in previous version...
  };

  const handleSaveInvoice = async (data: InvoiceData) => {
    setLoading(true);
    const { data: savedInvoice, error: invError } = await supabase.from('invoices').upsert({
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

    if (!invError) {
      const realId = savedInvoice.id;
      await supabase.from('invoice_items').delete().eq('invoice_id', realId);
      const itemsToInsert = data.items.map(item => ({
        invoice_id: realId,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate
      }));
      if (itemsToInsert.length > 0) await supabase.from('invoice_items').insert(itemsToInsert);
      await fetchData();
      setView({ type: 'invoices' });
    }
    setLoading(false);
  };

  const handleSaveQuotation = async (data: QuotationData) => {
    setLoading(true);
    const { data: savedQuotation, error: qError } = await supabase.from('quotations').upsert({
      id: data.id.includes('-') && data.id.length > 20 ? data.id : undefined,
      quotation_number: data.quotationNumber,
      status: data.status,
      date: data.date,
      valid_until: data.validUntil,
      client_name: data.clientName,
      client_address: data.clientAddress,
      client_email: data.clientEmail,
      currency: data.currency,
      tax_rate: data.taxRate,
      notes: data.notes,
      terms: data.terms
    }).select().single();

    if (!qError) {
      const realId = savedQuotation.id;
      await supabase.from('quotation_items').delete().eq('quotation_id', realId);
      const itemsToInsert = data.items.map(item => ({
        quotation_id: realId,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate
      }));
      if (itemsToInsert.length > 0) await supabase.from('quotation_items').insert(itemsToInsert);
      await fetchData();
      setView({ type: 'quotations' });
    }
    setLoading(false);
  };

  const changeView = (newView: ViewState) => {
    setView(newView);
    setMobileMenuOpen(false);
  };

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
          onCreate={() => changeView({ type: 'invoice-editor', mode: 'edit' })}
          onEdit={(inv) => changeView({ type: 'invoice-editor', invoiceId: inv.id, mode: 'edit' })}
          onView={(inv) => changeView({ type: 'invoice-editor', invoiceId: inv.id, mode: 'preview' })}
          onDownload={(inv) => changeView({ type: 'invoice-editor', invoiceId: inv.id, mode: 'preview', autoPrint: true })}
          currentUser={currentUser!}
        />;
      case 'invoice-editor':
        const initialInv = view.invoiceId ? invoices.find(i => i.id === view.invoiceId) : null;
        return <InvoiceEditor 
          initialData={initialInv} 
          settings={settings}
          onSave={handleSaveInvoice}
          onBack={() => changeView({ type: 'invoices' })} 
          isSaving={loading}
          initialMode={view.mode || 'edit'}
          autoPrint={view.autoPrint}
          currentUser={currentUser!}
        />;
      case 'quotations':
        return <QuotationList 
          quotations={quotations} 
          currency={settings.currencySymbol}
          onCreate={() => changeView({ type: 'quotation-editor', mode: 'edit' })}
          onEdit={(q) => changeView({ type: 'quotation-editor', quotationId: q.id, mode: 'edit' })}
          onView={(q) => changeView({ type: 'quotation-editor', quotationId: q.id, mode: 'preview' })}
          onDownload={(q) => changeView({ type: 'quotation-editor', quotationId: q.id, mode: 'preview', autoPrint: true })}
          currentUser={currentUser!}
        />;
      case 'quotation-editor':
        const initialQ = view.quotationId ? quotations.find(q => q.id === view.quotationId) : null;
        return <QuotationEditor 
          initialData={initialQ} 
          settings={settings}
          onSave={handleSaveQuotation}
          onBack={() => changeView({ type: 'quotations' })} 
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

  if (!appInitialized) return null;
  if (!currentUser) return <Login onLogin={handleLogin} logoUrl={settings.logoUrl} companyName={settings.companyName} />;

  if (view.type === 'invoice-editor' || view.type === 'quotation-editor') {
    return <div className="bg-gray-100 min-h-screen">{renderView()}</div>;
  }

  const isViewer = currentUser.role === 'viewer';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-20 flex items-center px-4 justify-between border-b border-white/10 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="text-white p-1">
            <MenuIcon className="w-6 h-6" />
          </button>
          <span className="font-bold text-white tracking-wide">SANDPIX</span>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center gap-3 justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-md" />
            ) : (
              <PalmTreeIcon className="w-8 h-8 text-sandpix-500" />
            )}
            <h1 className="font-bold text-lg tracking-wide">SANDPIX</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-4 py-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</div>
          {!isViewer && <button onClick={() => changeView({ type: 'dashboard' })} className={navItemClass(view.type === 'dashboard')}><LayoutDashboardIcon /> Dashboard</button>}
          <button onClick={() => changeView({ type: 'quotations' })} className={navItemClass(view.type === 'quotations')}><ClipboardListIcon /> Quotations</button>
          <button onClick={() => changeView({ type: 'invoices' })} className={navItemClass(view.type === 'invoices')}><FileTextIcon /> Invoices</button>
          <button onClick={() => changeView({ type: 'reports' })} className={navItemClass(view.type === 'reports')}><BarChartIcon /> Reports</button>
          
          {!isViewer && (
            <>
              <div className="px-4 py-2 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</div>
              <button onClick={() => changeView({ type: 'users' })} className={navItemClass(view.type === 'users')}><UsersIcon /> Team</button>
               <button onClick={() => changeView({ type: 'settings' })} className={navItemClass(view.type === 'settings')}><SettingsIcon /> Settings</button>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-white/10 safe-area-bottom">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-sandpix-600 flex items-center justify-center text-sm font-bold shrink-0">{currentUser.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium truncate">{currentUser.name}</p>
               <p className="text-xs text-gray-400 truncate capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-300 hover:text-red-100 hover:bg-white/5 rounded-lg transition-colors w-full">
            <LogOutIcon /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto w-full pt-16 md:pt-0">{renderView()}</main>
    </div>
  );
}