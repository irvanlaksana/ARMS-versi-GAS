import { createContext, useContext } from 'react';
import type { Database, Entity, Letter, Module, RecordData } from './data';

export interface ArmsContextValue {
  db: Database;
  setDb: (db: Database) => void;
  module: Module;
  navigate: (module: Module) => void;
  openForm: (entity: Entity, record?: RecordData, defaults?: Record<string, unknown>) => void;
  openDetail: (entity: Entity, record: RecordData) => void;
  openLetter: (letter?: Letter, caseId?: string) => void;
  requestDelete: (entity: Entity, record: RecordData) => void;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  bucketFilter: string;
  setBucketFilter: (bucket: string) => void;
  period: string;
  setPeriod: (period: string) => void;
  collectionCaseFilter: string;
  setCollectionCaseFilter: (id: string) => void;
}
export const ArmsContext = createContext<ArmsContextValue | null>(null);
export function useArms() {
  const context = useContext(ArmsContext);
  if (!context) throw new Error('ARMS context is missing.');
  return context;
}