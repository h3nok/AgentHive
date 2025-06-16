// Mock API for MPC servers
import mpcServersMock from '../mocks/mpcServers.json';

export async function fetchMpcServers() {
  await new Promise(res => setTimeout(res, 300));
  return mpcServersMock;
}

export async function createMpcServer(payload: any) {
  return { ...payload, id: Date.now(), status: 'Online', lastSeen: new Date().toISOString() };
}

export async function updateMpcServer(id: string | number, payload: any) {
  return { ...payload, id };
}

export async function deleteMpcServer(id: string | number) {
  return { success: true };
}

export async function restartMpcServer(id: string | number) {
  return { id, status: 'Restarting', lastSeen: new Date().toISOString() };
} 