import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMConfig, ConversationMessage, SchemaAnalysis } from '@/types';

interface AppState {
  // Connection
  connectionId: string | null;
  schemaAnalysis: SchemaAnalysis | null;

  // LLM
  llmConfig: LLMConfig | null;

  // Conversation
  conversationHistory: ConversationMessage[];

  // Dashboard
  activeDashboardId: string | null;

  // Actions
  setConnection: (connectionId: string, schema: SchemaAnalysis) => void;
  clearConnection: () => void;
  setLLMConfig: (config: LLMConfig) => void;
  clearLLMConfig: () => void;
  addMessage: (message: ConversationMessage) => void;
  clearConversation: () => void;
  setActiveDashboard: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      connectionId: null,
      schemaAnalysis: null,
      llmConfig: null,
      conversationHistory: [],
      activeDashboardId: null,

      setConnection: (connectionId, schemaAnalysis) =>
        set({ connectionId, schemaAnalysis }),

      clearConnection: () =>
        set({ connectionId: null, schemaAnalysis: null }),

      setLLMConfig: (config) => set({ llmConfig: config }),

      clearLLMConfig: () => set({ llmConfig: null }),

      addMessage: (message) =>
        set((state) => ({
          conversationHistory: [...state.conversationHistory, message],
        })),

      clearConversation: () => set({ conversationHistory: [] }),

      setActiveDashboard: (id) => set({ activeDashboardId: id }),
    }),
    {
      name: 'querymind-storage',
      partialize: (state) => ({
        llmConfig: state.llmConfig,
        connectionId: state.connectionId,
        schemaAnalysis: state.schemaAnalysis,
      }),
    }
  )
);
