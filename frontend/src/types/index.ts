export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
}

export interface FolderContent {
  folders: FileItem[];
  files: FileItem[];
}

export interface UploadResponse {
  message: string;
  files: { name: string; path: string }[];
}

export interface User {
  access_token: string;
  token_type: string;
  nome_colaborador: string;
  id_usuario: string;
  id_colaborador: string;
  id_revenda: string;
  expires_in: number;
  login_time: number;
}
