import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BookingProvider } from './contexts/BookingContext';
import AppRoutes from './routes/index';
import queryClient from './lib/queryClient';
import MobileBottomBar from './components/layout/MobileBottomBar';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            {/* BookingProvider HARUS di dalam AuthProvider
                supaya sudah ada token sebelum polling sync-payments */}
            <BookingProvider>
              <AppRoutes />
              <MobileBottomBar />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: { borderRadius: '12px', fontSize: '14px' },
                }}
              />
            </BookingProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}