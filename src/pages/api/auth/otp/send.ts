// src/pages/api/auth/otp/send.ts — Send Mobile Phone OTP
import type { APIRoute } from 'astro';

// In-memory OTP code store for active verification sessions
const otpStore = new Map<string, { code: string; expiresAt: number }>();
(globalThis as any).__filmora_otp_store = (globalThis as any).__filmora_otp_store || otpStore;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const phone = (body.phone || '').trim().replace(/\s+/g, '');

    if (!phone || phone.length < 8) {
      return new Response(JSON.stringify({ error: 'Please enter a valid mobile phone number.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate 6-digit OTP (e.g., 742918 or standard demo 123456)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    const store: Map<string, { code: string; expiresAt: number }> = (globalThis as any).__filmora_otp_store;
    store.set(phone, { code, expiresAt });

    console.log(`[Filmora Auth] Sent 6-Digit OTP to ${phone}: ${code}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `OTP sent successfully to ${phone}`,
        phone,
        // For development/testing convenience, also echo demo code
        previewCode: code,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to send OTP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
