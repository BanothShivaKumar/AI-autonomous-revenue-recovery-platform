import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../../config';
import { getPayPalAccessToken } from './paypalAuth';

export class PayPalClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.paypal.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.client.interceptors.request.use(async (reqConfig) => {
      const token = await getPayPalAccessToken();
      reqConfig.headers.Authorization = `Bearer ${token}`;
      return reqConfig;
    });
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const paypalClient = new PayPalClient();
