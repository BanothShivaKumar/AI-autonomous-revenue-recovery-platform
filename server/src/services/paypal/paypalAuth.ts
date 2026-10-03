import axios from 'axios';
import { config } from '../../config';

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getPayPalAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedAccessToken && tokenExpiresAt > now + 60000) {
    return cachedAccessToken;
  }

  const clientId = config.paypal.clientId;
  const clientSecret = config.paypal.clientSecret;

  if (!clientId || !clientSecret) {
    // If credentials are not configured, provide mock token for sandbox simulation
    return 'MOCK_SANDBOX_ACCESS_TOKEN_FOR_PAYPAL_API';
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post(
      `${config.paypal.baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    cachedAccessToken = response.data.access_token;
    tokenExpiresAt = now + (response.data.expires_in || 3600) * 1000;
    return cachedAccessToken as string;
  } catch (error: any) {
    console.warn('PayPal Auth Token Request Failed, using fallback token:', error?.response?.data || error.message);
    return 'MOCK_SANDBOX_ACCESS_TOKEN_FOR_PAYPAL_API';
  }
}
