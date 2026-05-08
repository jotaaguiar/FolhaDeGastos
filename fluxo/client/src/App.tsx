import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AlertProvider } from './context/AlertContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AlertProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </AlertProvider>
      </AppProvider>
    </AuthProvider>
  );
}
