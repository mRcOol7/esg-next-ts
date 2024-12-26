'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppDispatch } from '@/redux/store';
import { setCredentials, logout } from '@/redux/features/authSlice';

export function AuthStateSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      dispatch(
        setCredentials({
          user: {
            email: session.user.email || '',
            name: session.user.name || '',
          },
        })
      );
    } else {
      dispatch(logout());
    }
  }, [session, status, dispatch]);

  return null;
}
