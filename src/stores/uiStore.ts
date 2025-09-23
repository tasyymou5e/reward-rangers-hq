import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp: Date;
}

// Modal state interface
interface ModalState {
  [modalId: string]: boolean;
}

// Loading state interface for component-specific tracking
interface LoadingState {
  [componentId: string]: boolean;
}

// Error state interface
interface ErrorState {
  [errorKey: string]: string;
}

// Global UI state management with component-specific tracking
interface UIState {
  // Loading States
  loading: boolean;
  componentLoading: LoadingState;
  
  // Error Management
  errors: ErrorState;
  lastError: string | null;
  
  // Notification System
  notifications: Notification[];
  maxNotifications: number;
  
  // Modal & Dialog Management
  modals: ModalState;
  
  // Layout & Theme
  sidebarCollapsed: boolean;
  currentTheme: 'kids' | 'parents' | 'admin' | 'system';
  
  // Navigation
  currentPage: string;
  breadcrumbs: Array<{ label: string; path: string }>;
  
  // Performance & Monitoring
  renderCount: number;
  lastUpdate: Date;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setComponentLoading: (componentId: string, loading: boolean) => void;
  getComponentLoading: (componentId: string) => boolean;
  
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  toggleModal: (modalId: string, open?: boolean) => void;
  closeAllModals: () => void;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentTheme: (theme: 'kids' | 'parents' | 'admin' | 'system') => void;
  
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; path: string }>) => void;
  
  incrementRenderCount: () => void;
  resetPerformanceMetrics: () => void;
}

// Generate unique notification ID
const generateNotificationId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      loading: false,
      componentLoading: {},
      errors: {},
      lastError: null,
      notifications: [],
      maxNotifications: 5,
      modals: {},
      sidebarCollapsed: false,
      currentTheme: 'system',
      currentPage: '',
      breadcrumbs: [],
      renderCount: 0,
      lastUpdate: new Date(),

      // Loading state management
      setLoading: (loading: boolean) => {
        set({ loading, lastUpdate: new Date() });
      },

      setComponentLoading: (componentId: string, loading: boolean) => {
        set((state) => ({
          componentLoading: {
            ...state.componentLoading,
            [componentId]: loading,
          },
          lastUpdate: new Date(),
        }));
      },

      getComponentLoading: (componentId: string) => {
        return get().componentLoading[componentId] || false;
      },

      // Error management
      setError: (key: string, error: string | null) => {
        set((state) => {
          const newErrors = { ...state.errors };
          if (error === null) {
            delete newErrors[key];
          } else {
            newErrors[key] = error;
          }
          
          return {
            errors: newErrors,
            lastError: error,
            lastUpdate: new Date(),
          };
        });
      },

      clearError: (key: string) => {
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[key];
          
          return {
            errors: newErrors,
            lastUpdate: new Date(),
          };
        });
      },

      clearAllErrors: () => {
        set({
          errors: {},
          lastError: null,
          lastUpdate: new Date(),
        });
      },

      // Notification management
      showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const newNotification: Notification = {
          ...notification,
          id: generateNotificationId(),
          timestamp: new Date(),
          duration: notification.duration || 5000,
        };

        set((state) => {
          let newNotifications = [newNotification, ...state.notifications];
          
          // Limit to maxNotifications
          if (newNotifications.length > state.maxNotifications) {
            newNotifications = newNotifications.slice(0, state.maxNotifications);
          }
          
          return {
            notifications: newNotifications,
            lastUpdate: new Date(),
          };
        });

        // Auto-remove notification after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, newNotification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
          lastUpdate: new Date(),
        }));
      },

      clearNotifications: () => {
        set({
          notifications: [],
          lastUpdate: new Date(),
        });
      },

      // Modal management
      toggleModal: (modalId: string, open?: boolean) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: open !== undefined ? open : !state.modals[modalId],
          },
          lastUpdate: new Date(),
        }));
      },

      closeAllModals: () => {
        set((state) => {
          const closedModals: ModalState = {};
          Object.keys(state.modals).forEach(key => {
            closedModals[key] = false;
          });
          
          return {
            modals: closedModals,
            lastUpdate: new Date(),
          };
        });
      },

      // Layout management
      setSidebarCollapsed: (collapsed: boolean) => {
        set({
          sidebarCollapsed: collapsed,
          lastUpdate: new Date(),
        });
      },

      setCurrentTheme: (theme: 'kids' | 'parents' | 'admin' | 'system') => {
        set({
          currentTheme: theme,
          lastUpdate: new Date(),
        });
      },

      // Navigation management
      setCurrentPage: (page: string) => {
        set({
          currentPage: page,
          lastUpdate: new Date(),
        });
      },

      setBreadcrumbs: (breadcrumbs: Array<{ label: string; path: string }>) => {
        set({
          breadcrumbs,
          lastUpdate: new Date(),
        });
      },

      // Performance monitoring
      incrementRenderCount: () => {
        set((state) => ({
          renderCount: state.renderCount + 1,
          lastUpdate: new Date(),
        }));
      },

      resetPerformanceMetrics: () => {
        set({
          renderCount: 0,
          lastUpdate: new Date(),
        });
      },
    }),
    {
      name: 'ui-store',
    }
  )
);

// Convenience hooks for common UI operations
export const useLoading = () => {
  const loading = useUIStore((state) => state.loading);
  const setLoading = useUIStore((state) => state.setLoading);
  return { loading, setLoading };
};

export const useNotifications = () => {
  const notifications = useUIStore((state) => state.notifications);
  const showNotification = useUIStore((state) => state.showNotification);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const clearNotifications = useUIStore((state) => state.clearNotifications);
  
  return {
    notifications,
    showNotification,
    removeNotification,
    clearNotifications,
  };
};

export const useModal = (modalId: string) => {
  const isOpen = useUIStore((state) => state.modals[modalId] || false);
  const toggleModal = useUIStore((state) => state.toggleModal);
  
  const open = () => toggleModal(modalId, true);
  const close = () => toggleModal(modalId, false);
  const toggle = () => toggleModal(modalId);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
};