import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getMarketDataApiUrl } from '@/constants/api-config';

// Create a function to get API client for specific chain
export function getApiClient(chainId: string | number): AxiosInstance {
  // In the browser, route requests to our Next.js API routes (same-origin)
  // to avoid CORS issues when talking to external gateways. On the server,
  // we can safely call the external gateway directly.
  const isBrowser = typeof window !== 'undefined';
  const baseURL = isBrowser ? '' : getMarketDataApiUrl(chainId);

  const apiClient: AxiosInstance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    }
  });

  // Request interceptor
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig<any>) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Request [Chain ${chainId}]: ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`API Request Error [Chain ${chainId}]:`, error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor
  apiClient.interceptors.response.use(
    (response: AxiosResponse<any, any>) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Response [Chain ${chainId}]: ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`API Response Error [Chain ${chainId}]:`, error);
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
}

// Helper function to make GET requests
export const apiGet = async <T>(chainId: string | number, url: string, config?: AxiosRequestConfig): Promise<T> => {
  const client = getApiClient(chainId);
  const response: AxiosResponse<T> = await client.get(url, config);
  return response.data;
};

// Helper function to make POST requests
export const apiPost = async <T>(chainId: string | number, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const client = getApiClient(chainId);
  const response: AxiosResponse<T> = await client.post(url, data, config);
  return response.data;
};

// Helper function to make PUT requests
export const apiPut = async <T>(chainId: string | number, url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const client = getApiClient(chainId);
  const response: AxiosResponse<T> = await client.put(url, data, config);
  return response.data;
};

// Helper function to make DELETE requests
export const apiDelete = async <T>(chainId: string | number, url: string, config?: AxiosRequestConfig): Promise<T> => {
  const client = getApiClient(chainId);
  const response: AxiosResponse<T> = await client.delete(url, config);
  return response.data;
};

export default getApiClient;
