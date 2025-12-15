import React, { useState, useEffect } from 'react';
import { AppSettings, User } from '../types';
import { PalmTreeIcon, LockIcon } from '../components/Icons';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentUser: User;
}

export default function Settings({ settings, setSettings, currentUser }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  // Reset local state if global settings change externally, though in this flow it's mostly one-way
  useEffect(() => {
    setLocalSettings(settings);
    setIsDirty(false); 
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: any) => {
    if (!isAdmin) return;
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setShowSuccess(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
        setIsDirty(true);
        setShowSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    if (!isAdmin) return;
    setLocalSettings(prev => ({ ...prev, logoUrl: undefined }));
    setIsDirty(true);
    setShowSuccess(false);
  };

  const handleSave = () => {
    if (!isAdmin) return;
    setSettings(localSettings);
    setIsDirty(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setIsDirty(false);
    setShowSuccess(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        {showSuccess && (
          <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full animate-fade-in-out">
            Settings saved successfully!
          </span>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 text-sm">
          <LockIcon className="w-4 h-4" />
          <p>You do not have permission to edit system settings. Contact an administrator.</p>
        </div>
      )}
      
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8 ${!isAdmin ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
        
        {/* Branding Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Branding</h3>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
               <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
                 {localSettings.logoUrl ? (
                   <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                 ) : (
                   <PalmTreeIcon className="w-8 h-8 text-gray-400" />
                 )}
               </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="flex items-center gap-3">
                <label className={`cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 transition-colors ${isAdmin ? 'hover:bg-gray-50' : 'cursor-not-allowed'}`}>
                  <span>Upload new logo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={!isAdmin} />
                </label>
                {localSettings.logoUrl && (
                  <button 
                    onClick={removeLogo}
                    disabled={!isAdmin}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-md shadow-sm text-sm font-medium hover:bg-red-50 transition-colors disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">Recommended size: 200x200px. Supports PNG, JPG.</p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={localSettings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sandpix-500 transition-shadow disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
              <textarea
                rows={3}
                value={localSettings.companyAddress}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sandpix-500 transition-shadow disabled:bg-gray-50"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
              <input
                type="email"
                value={localSettings.companyEmail}
                onChange={(e) => handleChange('companyEmail', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sandpix-500 transition-shadow disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST/Tax Number</label>
              <input
                type="text"
                value={localSettings.gstNumber || ''}
                onChange={(e) => handleChange('gstNumber', e.target.value)}
                placeholder="e.g. GST-12345678"
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sandpix-500 transition-shadow disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Defaults */}
        <div>
           <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Invoice Defaults</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  value={localSettings.defaultTaxRate}
                  onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sandpix-500 transition-shadow disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={localSettings.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sandpix-500 transition-shadow disabled:bg-gray-50"
                />
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
             <button
               onClick={handleCancel}
               disabled={!isDirty}
               className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                 isDirty 
                   ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50' 
                   : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
               }`}
             >
               Cancel
             </button>
             <button
               onClick={handleSave}
               disabled={!isDirty}
               className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                 isDirty 
                   ? 'bg-sandpix-600 hover:bg-sandpix-700 shadow-sm' 
                   : 'bg-gray-300 cursor-not-allowed'
               }`}
             >
               Save Changes
             </button>
          </div>
        )}
      </div>
    </div>
  );
}