import { api } from './client';

export interface DeviceRegisterRequest {
  externalId: string;
  platform: string;
}

export interface DeviceResponse {
  externalId: string;
  platform: string;
  createdAt: string;
}

export const deviceApi = {
  register: (body: DeviceRegisterRequest) =>
    api.post<DeviceResponse>('/api/v1/devices/register', body, true),

  getMyDevice: () =>
    api.get<DeviceResponse>('/api/v1/devices/me'),
};
