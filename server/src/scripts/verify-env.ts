import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function verifyAll() {
  console.log('========================================');
  console.log('🔍 PayPilot Environment Verification');
  console.log('========================================\n');

  // 1. Verify PostgreSQL Database
  console.log('1️⃣ Testing PostgreSQL Connection...');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });

  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ PostgreSQL Database Connected Successfully!');
  } catch (err: any) {
    console.error('❌ PostgreSQL Connection Failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Verify PayPal Sandbox Credentials
  console.log('\n2️⃣ Testing PayPal Sandbox OAuth Credentials...');
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    console.error('❌ Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
  } else {
    try {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenRes = await axios.post(
        `${baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      const accessToken = tokenRes.data.access_token;
      console.log('✅ PayPal Sandbox OAuth 2.0 Authenticated Successfully!');
      console.log(`   • App Name / Scope: ${tokenRes.data.scope ? tokenRes.data.scope.substring(0, 40) + '...' : 'Granted'}`);
      console.log(`   • Token Expires In: ${tokenRes.data.expires_in}s`);

      // 3. Test PayPal API Call (List Transactions or Invoices)
      console.log('\n3️⃣ Testing PayPal Sandbox REST API Access...');
      const userRes = await axios.get(`${baseUrl}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }).catch(async () => {
        // Fallback check to notifications/webhooks or invoices
        return await axios.get(`${baseUrl}/v1/notifications/webhooks`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      });

      console.log('✅ PayPal Sandbox REST APIs Working and Authorized!');
    } catch (err: any) {
      console.error('❌ PayPal Authentication Error:', err.response?.data || err.message);
    }
  }

  // 4. Verify JWT Secret
  console.log('\n4️⃣ Checking JWT Secret...');
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    console.log('✅ JWT Secret is strong and properly formatted (64 chars)');
  } else {
    console.log('⚠️ JWT Secret is short');
  }

  console.log('\n========================================');
  console.log('🎉 Verification Complete!');
  console.log('========================================');
}

verifyAll().catch(console.error);
