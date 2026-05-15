import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30 detik — data dianggap stale & di-refetch saat focus
      refetchOnWindowFocus: true,  // Auto reload saat tab kembali aktif
      refetchInterval: false,      // Polling diaktifkan per-query sesuai kebutuhan
      retry: 1,
    },
  },
});

export default queryClient;
