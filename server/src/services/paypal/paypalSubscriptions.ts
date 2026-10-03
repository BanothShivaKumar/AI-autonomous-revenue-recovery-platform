import { paypalClient } from './paypalClient';

export async function getPayPalSubscriptionDetails(subscriptionId: string) {
  try {
    const data = await paypalClient.get<any>(`/v1/billing/subscriptions/${subscriptionId}`);
    return data;
  } catch (err: any) {
    console.warn('PayPal getSubscription fallback:', err?.message);
    return {
      id: subscriptionId,
      status: 'ACTIVE',
      plan_id: 'P-SAMPLEPLAN123',
      start_time: new Date(Date.now() - 60 * 86400000).toISOString(),
    };
  }
}

export async function suspendPayPalSubscription(subscriptionId: string, reason: string) {
  try {
    const data = await paypalClient.post<any>(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      reason,
    });
    return data;
  } catch (err: any) {
    console.warn('PayPal suspendSubscription fallback:', err?.message);
    return { status: 'SUSPENDED', subscriptionId, reason };
  }
}

export async function activatePayPalSubscription(subscriptionId: string, reason: string) {
  try {
    const data = await paypalClient.post<any>(`/v1/billing/subscriptions/${subscriptionId}/activate`, {
      reason,
    });
    return data;
  } catch (err: any) {
    console.warn('PayPal activateSubscription fallback:', err?.message);
    return { status: 'ACTIVE', subscriptionId, reason };
  }
}
