import React, { useState } from 'react';
import { User } from '../types';
import { PlusIcon, TrashIcon } from '../components/Icons';

interface UsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export default function Users({ users, setUsers }: UsersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'viewer' as const });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
    };
    setUsers([...users, user]);
    setIsAdding(false);
    setNewUser({ name: '', email: '', password: '', role: 'viewer' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add User
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 max-w-2xl">
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
             <h3 className="font-semibold text-gray-700">Add New User</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input 
                 required
                 placeholder="Full Name" 
                 value={newUser.name}
                 onChange={e => setNewUser({...newUser, name: e.target.value})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               />
               <input 
                 required
                 type="email"
                 placeholder="Email Address" 
                 value={newUser.email}
                 onChange={e => setNewUser({...newUser, email: e.target.value})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               />
               <input 
                 type="text"
                 placeholder="Password" 
                 value={newUser.password}
                 onChange={e => setNewUser({...newUser, password: e.target.value})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               />
               <select 
                 value={newUser.role}
                 onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                 className="px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-sandpix-500"
               >
                 <option value="viewer">Viewer</option>
                 <option value="editor">Editor</option>
                 <option value="admin">Admin</option>
               </select>
             </div>
             <div className="flex justify-end gap-2">
               <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
               <button type="submit" className="px-3 py-1 text-sm bg-sandpix-600 text-white rounded hover:bg-sandpix-700">Save User</button>
             </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Password</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4 font-mono text-gray-500">{user.password || '-'}</td>
                <td className="px-6 py-4">
                   <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold uppercase">{user.role}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-600">
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}