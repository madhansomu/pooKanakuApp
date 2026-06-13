'use client';

import AuthProvider from './AuthProvider';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toast />
      <ConfirmDialog />
    </AuthProvider>
  );
}
