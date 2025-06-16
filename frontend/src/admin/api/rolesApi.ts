// Mock API for roles
import rolesMock from '../mocks/roles.json';

export async function fetchRoles() {
  await new Promise(res => setTimeout(res, 300));
  return rolesMock;
}

export async function createRole(payload: any) {
  return { ...payload, id: Date.now(), createdAt: new Date().toISOString() };
}

export async function updateRole(id: string | number, payload: any) {
  return { ...payload, id };
}

export async function deleteRole(id: string | number) {
  return { success: true };
} 