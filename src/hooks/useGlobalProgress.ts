import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalProgressState {
  isRunning: boolean;
  progress: number;
  currentStatus: string;
  startTime: number | null;
  selectedDataSourceGroup: string;
  
  // Actions
  startProgress: (status: string, dataSourceGroup: string) => void;
  updateProgress: (progress: number, status: string) => void;
  stopProgress: (finalStatus?: string) => void;
  reset: () => void;
}

export const useGlobalProgress = create<GlobalProgressState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      progress: 0,
      currentStatus: '',
      startTime: null,
      selectedDataSourceGroup: 'all',
      
      startProgress: (status: string, dataSourceGroup: string) => {
        set({
          isRunning: true,
          progress: 1,
          currentStatus: status,
          startTime: Date.now(),
          selectedDataSourceGroup: dataSourceGroup,
        });
      },
      
      updateProgress: (progress: number, status: string) => {
        const state = get();
        if (state.isRunning) {
          set({
            progress: Math.max(progress, state.progress),
            currentStatus: status,
          });
        }
      },
      
      stopProgress: (finalStatus?: string) => {
        set({
          isRunning: false,
          progress: 100,
          currentStatus: finalStatus || '完了',
        });
        
        // 5秒後にリセット
        setTimeout(() => {
          const state = get();
          if (!state.isRunning) {
            set({
              progress: 0,
              currentStatus: '',
              startTime: null,
            });
          }
        }, 5000);
      },
      
      reset: () => {
        set({
          isRunning: false,
          progress: 0,
          currentStatus: '',
          startTime: null,
          selectedDataSourceGroup: 'all',
        });
      },
    }),
    {
      name: 'global-progress-storage',
      partialize: (state) => ({
        isRunning: state.isRunning,
        progress: state.progress,
        currentStatus: state.currentStatus,
        startTime: state.startTime,
        selectedDataSourceGroup: state.selectedDataSourceGroup,
      }),
    }
  )
);