import { api } from './client';
import { ConditionScore, MealAmount, StoolCondition, UrineColor, WaterAmount } from '../types';

export interface LogResponse {
  externalId: string;
  petExternalId: string;
  date: string;
  meal?: MealAmount;
  water?: WaterAmount;
  walkMinutes?: number;
  pooCondition?: StoolCondition;
  urineColor?: UrineColor;
  condition?: ConditionScore;
  weightKg?: number;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogRequest {
  petExternalId: string;
  caregiverExternalId: string;
  date: string;
  meal?: MealAmount;
  water?: WaterAmount;
  walkMinutes?: number;
  pooCondition?: StoolCondition;
  urineColor?: UrineColor;
  condition?: ConditionScore;
  weightKg?: number;
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
