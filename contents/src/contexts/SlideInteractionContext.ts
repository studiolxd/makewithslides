import { createContext, useContext } from 'react';

// Contexto de ESTADO — cambia con cada interacción completada
export interface SlideInteractionState {
  completedIds: string[];
  requiredCount: number;
}

export const SlideInteractionStateContext = createContext<SlideInteractionState>({
  completedIds: [],
  requiredCount: 0,
});

// Contexto de ACCIONES — estable, las funciones son memoizadas en App
export interface SlideInteractionActions {
  registerRequiredInteractions: (count: number) => void;
  markCompleted: (interactionId: string) => void;
}

export const SlideInteractionActionsContext = createContext<SlideInteractionActions>({
  registerRequiredInteractions: () => {},
  markCompleted: () => {},
});

// Hook de compatibilidad: combina estado + acciones para los layouts que usan ambos
export function useSlideInteraction() {
  const state = useContext(SlideInteractionStateContext);
  const actions = useContext(SlideInteractionActionsContext);
  return { ...state, ...actions };
}
