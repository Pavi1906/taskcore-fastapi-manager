import { apiClient } from './client';
import { Task, TaskCreate, TaskUpdate } from '../types/task';

export const tasksService = {
  getTasks: async (skip: number = 0, limit: number = 100) => {
    const response = await apiClient.get<Task[]>('/tasks', {
      params: { skip, limit }
    });
    return response.data;
  },

  getTask: async (id: number) => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (task: TaskCreate) => {
    const response = await apiClient.post<Task>('/tasks/', task);
    return response.data;
  },

  updateTask: async (id: number, task: TaskUpdate) => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: number) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  }
};
