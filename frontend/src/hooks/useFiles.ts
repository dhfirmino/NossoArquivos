import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.ts';
import type { FolderContent, UploadResponse } from '../types/index.ts';

export function useListFolder(path: string) {
  return useQuery({
    queryKey: ['folder', path],
    queryFn: () => {
      const url = path ? `/api/folders/${path}` : '/api/folders';
      return api.get<FolderContent>(url);
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) =>
      api.post<{ message: string; path: string }>('/api/folders', { path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) =>
      api.delete<{ message: string }>(`/api/folders/${path}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useUploadFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, files, onProgress }: { path: string; files: File[]; onProgress?: (percent: number) => void }) => {
      const formData = new FormData();
      if (path) formData.append('path', path);
      files.forEach((file) => formData.append('files', file));
      if (onProgress) {
        return api.upload<UploadResponse>('/api/upload', formData, onProgress);
      }
      return api.post<UploadResponse>('/api/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) =>
      api.delete<{ message: string }>(`/api/files/${path}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}
