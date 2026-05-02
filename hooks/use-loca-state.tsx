'use client';

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { depots } from '@/lib/seed/depots';

interface RiskUpdate {
  fireRiskScore: number;
  status: 'optimal' | 'warning' | 'critical';
}

interface LocaState {
  selectedDepotId: string;
  selectedLocaId: string | null;
  riskUpdates: Record<string, RiskUpdate>;
}

type LocaAction =
  | { type: 'SELECT_DEPOT'; depotId: string }
  | { type: 'SELECT_LOCA'; locaId: string | null }
  | { type: 'UPDATE_RISKS'; risks: Array<{ locaId: string; fireRiskScore: number; status: 'optimal' | 'warning' | 'critical' }> };

function locaReducer(state: LocaState, action: LocaAction): LocaState {
  switch (action.type) {
    case 'SELECT_DEPOT': {
      const depot = depots.find(d => d.id === action.depotId);
      const firstFilled = depot?.locas.find(l => !!l.varietyId) ?? null;
      return { selectedDepotId: action.depotId, selectedLocaId: firstFilled?.id ?? null, riskUpdates: {} };
    }
    case 'SELECT_LOCA':
      return { ...state, selectedLocaId: action.locaId };
    case 'UPDATE_RISKS': {
      const next = { ...state.riskUpdates };
      for (const r of action.risks) {
        next[r.locaId] = { fireRiskScore: r.fireRiskScore, status: r.status };
      }
      return { ...state, riskUpdates: next };
    }
    default:
      return state;
  }
}

const LocaStateContext = createContext<LocaState | null>(null);
const LocaDispatchContext = createContext<Dispatch<LocaAction> | null>(null);

export function LocaStateProvider({ children }: { children: ReactNode }) {
  const firstDepot = depots[0];
  const firstFilledLoca = firstDepot.locas.find(l => !!l.varietyId);

  const [state, dispatch] = useReducer(locaReducer, {
    selectedDepotId: firstDepot.id,
    selectedLocaId: firstFilledLoca?.id ?? null,
    riskUpdates: {},
  });

  return (
    <LocaStateContext.Provider value={state}>
      <LocaDispatchContext.Provider value={dispatch}>
        {children}
      </LocaDispatchContext.Provider>
    </LocaStateContext.Provider>
  );
}

export function useLocaState() {
  const state = useContext(LocaStateContext);
  if (!state) throw new Error('useLocaState must be used within LocaStateProvider');
  return state;
}

export function useLocaDispatch() {
  const dispatch = useContext(LocaDispatchContext);
  if (!dispatch) throw new Error('useLocaDispatch must be used within LocaStateProvider');
  return dispatch;
}

export function useSelectedDepot() {
  const { selectedDepotId } = useLocaState();
  return depots.find(d => d.id === selectedDepotId) ?? depots[0];
}

export function useSelectedLoca() {
  const { selectedLocaId } = useLocaState();
  const depot = useSelectedDepot();
  if (!selectedLocaId) return null;
  return depot.locas.find(l => l.id === selectedLocaId) ?? null;
}

export function useLocaRisk(locaId: string) {
  const { riskUpdates } = useLocaState();
  return riskUpdates[locaId] ?? null;
}
