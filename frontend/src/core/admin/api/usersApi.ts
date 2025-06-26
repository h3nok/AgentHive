// Mock API for users
import usersMock from '../mocks/users.json';

export async function fetchUsers() {
  // Simulate network delay
  await new Promise(res => setTimeout(res, 300));
  return usersMock;
}

export async function createUser(payload: any) {
  // Simulate creation
  return { ...payload, id: Date.now(), status: 'Active', createdAt: new Date().toISOString() };
}

export async function updateUser(id: string | number, payload: any) {
  // Simulate update
  return { ...payload, id };
}

export async function deleteUser(id: string | number) {
  // Simulate delete
  return { success: true };
}

export async function toggleUserStatus(id: string | number, status: string) {
  // Simulate status toggle
  return { id, status };
} 