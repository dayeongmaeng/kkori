import { api } from './client';

export interface MealRecord {
  time: string;
  amount?: number;
  unit?: string;
  memo?: string;
}

export interface WalkRecord {
  startTime: string;
  durationMinutes?: number;
  distanceKm?: number;
}

export interface EliminationRecord {
  time: string;
  type: 'urine' | 'feces' | 'both';
  memo?: string;
}

export interface ConditionRecord {
  score: 1 | 2 | 3 | 4 | 5;
  memo?: string;
}

export interface LogResponse {
  externalId: string;
  petExternalId: string;
  date: string;
  meals: MealRecord[];
  walks: WalkRecord[];
  eliminations: EliminationRecord[];
  condition?: ConditionRecord;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogRequest {
  petExternalId: string;
  date: string;
  meals?: MealRecord[];
  walks?: WalkRecord[];
  eliminations?: EliminationRecord[];
  condition?: ConditionRecord;
  memo?: string;
}

export interface LogFilter {
  petExternalId: string;
  startDate?: string;
  endDate?: string;
}

export const logApi = {
  getLogs: (filter: LogFilter) => {
    const params = new URLSearchParams({ petExternalId: filter.petExternalId });
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    return api.get<LogResponse[]>(`/api/v1/logs?${params.toString()}`);
  },

  getLog: (externalId: string) =>
    api.get<LogResponse>(`/api/v1/logs/${externalId}`),

  createLog: (body: LogRequest) =>
    api.post<LogResponse>('/api/v1/logs', body),

  updateLog: (externalId: string, body: Partial<LogRequest>) =>
    api.put<LogResponse>(`/api/v1/logs/${externalId}`, body),

  deleteLog: (externalId: string) =>
    api.delete<void>(`/api/v1/logs/${externalId}`),
};
