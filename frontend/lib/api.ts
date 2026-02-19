import axios, { AxiosError } from 'axios';
import type { PDFAnalysisResponse, DeleteResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_URL}/api/v1`;

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Upload and analyze a PDF file
 */
export async function uploadAndAnalyzePDF(file: File): Promise<PDFAnalysisResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<PDFAnalysisResponse>(
      `${API_V1}/pdf/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for analysis
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail: string }>;
      const message = axiosError.response?.data?.detail || axiosError.message;
      const statusCode = axiosError.response?.status;
      throw new APIError(message, statusCode, error);
    }
    throw new APIError('Failed to upload and analyze PDF', undefined, error);
  }
}

/**
 * Get PDF file blob
 */
export async function getPDF(fileId: string): Promise<Blob> {
  try {
    const response = await axios.get(`${API_V1}/pdf/${fileId}`, {
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail: string }>;
      const message = axiosError.response?.data?.detail || axiosError.message;
      const statusCode = axiosError.response?.status;
      throw new APIError(message, statusCode, error);
    }
    throw new APIError('Failed to retrieve PDF', undefined, error);
  }
}

/**
 * Delete PDF file
 */
export async function deletePDF(fileId: string): Promise<DeleteResponse> {
  try {
    const response = await axios.delete<DeleteResponse>(`${API_V1}/pdf/${fileId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail: string }>;
      const message = axiosError.response?.data?.detail || axiosError.message;
      const statusCode = axiosError.response?.status;
      throw new APIError(message, statusCode, error);
    }
    throw new APIError('Failed to delete PDF', undefined, error);
  }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{ status: string; gemini_api: string }> {
  try {
    const response = await axios.get(`${API_V1}/health`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail: string }>;
      const message = axiosError.response?.data?.detail || axiosError.message;
      throw new APIError(message, axiosError.response?.status, error);
    }
    throw new APIError('Failed to check health', undefined, error);
  }
}
