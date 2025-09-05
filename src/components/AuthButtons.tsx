'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';

interface AuthButtonsProps {
  isAuthenticated: boolean;
  userName?: string | null;
}

export default function AuthButtons({ isAuthenticated, userName }: AuthButtonsProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {isAuthenticated ? (
        <>
          {userName && (
            <span className="text-sm text-gray-600">{userName}</span>
          )}
          <button
            onClick={async () => { setLoading(true); await signOut(); setLoading(false); }}
            disabled={loading}
            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          onClick={async () => { setLoading(true); await signIn('google'); setLoading(false); }}
          disabled={loading}
          className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Continue with Google
        </button>
      )}
    </div>
  );
}


