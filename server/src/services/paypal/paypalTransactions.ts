import { paypalClient } from './paypalClient';

export interface ListTransactionsParams {
  startDate: string; // ISO String or YYYY-MM-DDTHH:mm:ssZ
  endDate: string;
  pageSize?: number;
  page?: number;
}

export async function listPayPalTransactions(params: ListTransactionsParams) {
  try {
    const query = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
      page_size: (params.pageSize || 20).toString(),
      page: (params.page || 1).toString(),
      fields: 'all',
    });
    const data = await paypalClient.get<any>(`/v1/reporting/transactions?${query.toString()}`);
    return data;
  } catch (err: any) {
    console.warn('PayPal listTransactions fallback:', err?.message);
    return {
      transaction_details: [],
      total_items: 0,
      total_pages: 0,
    };
  }
}
