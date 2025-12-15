import React, { useState } from 'react';
import { User } from '../types';
import { PlusIcon, EditIcon, CheckCircleIcon, BanIcon } from '../components/Icons';

interface UsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
}

export default function Users({ users, setUsers, currentUser }: UsersProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'viewer' as User['role'] });

  const isAdmin = currentUser.role === 'admin';

  // Filter users: Admins see everyone, others see only non-admins
  const displayedUsers = users.filter(user => isAdmin || user.role !== 'admin');

  const startAdd = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'viewer' });
    setIsFormOpen(true);
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Edit Mode
      setUsers(prev => prev.map(u => 
        u.id === editingId ? { ...u, ...formData } : u
      ));
    } else {
      // Add Mode
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        active: true // Default active
      };
      setUsers(prev => [...prev, newUser]);
    }
    
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'viewer' });
  };

  const toggleStatus = (user: User) => {
    // Only admins can toggle status
    if (!isAdmin) return;

    // Toggle active state (treat undefined as true initially)
    const newActiveState = user.active === false ? true : false;
    
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, active: newActiveState } : u
    ));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
        {isAdmin && (
          <button
            onClick={startAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        )}
      </div>

      {isFormOpen && isAdmin && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 max-w-2xl">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
             <h3 className="font-semibold text-gray-700">{editingId ? 'Edit User' : 'Add New User'}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input 
                 required
                 placeholder="Full Name" 
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               />
               <input 
                 required
                 type="email"
                 placeholder="Email Address" 
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               />
               <input 
                 type="text"
                 placeholder="Password" 
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               />
               <select 
                 value={formData.role}
                 onChange={e => setFormData({...formData, role: e.target.value as User['role']})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               >
                 <option value="viewer">Viewer</option>
                 <option value="editor">Editor</option>
                 <option value="admin">Admin</option>
               </select>
             </div>
             <div className="flex justify-end gap-2">
               <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
               <button type="submit" className="px-3 py-1 text-sm bg-sandpix-600 text-white rounded hover:bg-sandpix-700">
                 {editingId ? 'Update User' : 'Save User'}
               </button>
             </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 min-w-[700px]">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedUsers.map(user => {
                const isActive = user.active !== false;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold uppercase">{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(user)} className="text-sandpix-600 hover:text-sandpix-800" title="Edit User">
                            <EditIcon />
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleStatus(user)} 
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${
                              isActive 
                                ? 'text-red-600 border-red-200 hover:bg-red-50' 
                                : 'text-green-600 border-green-200 hover:bg-green-50'
                            }`}
                            title={isActive ? "Disable User" : "Enable User"}
                          >
                            {isActive ? (
                              <>
                                <BanIcon className="w-3 h-3" /> Disable
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-3 h-3" /> Enable
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}