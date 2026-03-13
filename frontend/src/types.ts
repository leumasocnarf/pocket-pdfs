export interface FileResponse {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export interface UrlResponse {
  id: string;
  filename: string;
  url: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  expiresIn: number;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
