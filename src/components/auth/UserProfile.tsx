'use client';

import { useAuth } from '@/contexts/AuthContext';

export function UserProfile() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-sm text-slate-500">
        Not authenticated
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'ANALYST': return 'bg-blue-100 text-blue-800';
      case 'VIEWER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="text-right">
        <div className="text-sm font-medium text-slate-900">
          {user.name || user.email}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
            {user.role}
          </span>
        </div>
      </div>
      
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 font-semibold text-sm">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </span>
      </div>
      
      <button
        onClick={logout}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        title="Logout"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}
