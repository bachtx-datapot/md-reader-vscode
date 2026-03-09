#!/usr/bin/env node

/**
 * Mock SePay Webhook Sender
 *
 * Generates realistic SePay webhook payloads with valid HMAC-SHA256 signatures
 * and POSTs them to a target endpoint. Useful for local development, CI/CD
 * integration tests, and offline testing without SePay sandbox access.
 *
 * CLI Usage:
 *   node mock-sepay-webhook.js [options]
 *
 * Options:
 *   --endpoint <url>     Target webhook URL (default: http://localhost:3000/api/webhooks/payment/sepay)
 *   --secret <key>       HMAC-SHA256 secret for signature (default: env SEPAY_WEBHOOK_SECRET or 'test-secret')
 *   --amount <vnd>       Transfer amount in VND (default: random 100k-4.9M)
 *   --reference <ref>    Order reference in content field (default: random DATAPOT-INV-XXXX)
 *   --gateway <bank>     Bank name (default: random Vietnamese bank)
 *   --type <in|out>      Transfer type (default: 'in')
 *   --account <num>      Account number (default: '0123456789')
 *   --count <n>          Send N webhooks sequentially (default: 1)
 *   --delay <ms>         Delay between batch sends in ms (default: 500)
 *   --invalid-sig        Send with invalid HMAC signature (for testing rejection)
 *   --dry-run            Print payload without sending
 *   --help               Show this help
 *
 * Environment Variables:
 *   SEPAY_WEBHOOK_SECRET - Default HMAC secret
 *   SEPAY_WEBHOOK_URL    - Default target endpoint
 *
 * Module Usage:
 *   const { generatePayload, computeSignature, sendWebhook } = require('./mock-sepay-webhook');
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Vietnamese bank names used by SePay
const VIETNAMESE_BANKS = [
  'Vietcombank', 'VietinBank', 'BIDV', 'MBBank', 'Techcombank',
  'ACB', 'VPBank', 'TPBank', 'SHB', 'OCB', 'MSB', 'HDBank',
];

/**
 * Generate a realistic SePay webhook payload matching documented format.
 * See: https://developer.sepay.vn — Webhook Payload Structure
 *
 * @param {Object} opts - Payload options
 * @param {number} [opts.amount] - Transfer amount in VND
 * @param {string} [opts.reference] - Order reference (placed in content field)
 * @param {string} [opts.gateway] - Bank name
 * @param {string} [opts.transferType] - 'in' or 'out'
 * @param {string} [opts.accountNumber] - Bank account number
 * @returns {Object} SePay webhook payload
 */
function generatePayload(opts = {}) {
  const id = opts.id || Math.floor(Math.random() * 900000) + 100000;
  const gateway = opts.gateway || VIETNAMESE_BANKS[Math.floor(Math.random() * VIETNAMESE_BANKS.length)];
  const amount = opts.amount || (Math.floor(Math.random() * 50) + 1) * 100000; // 100k-5M VND
  const reference = opts.reference || `DATAPOT-INV-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

  // Bank-specific reference code prefixes
  const refPrefixes = {
    Vietcombank: 'MBVCB', VietinBank: 'VNTI', BIDV: 'IBFT', MBBank: 'MBIB',
    Techcombank: 'TCB', ACB: 'ACB', VPBank: 'VPB', TPBank: 'TPB',
  };
  const prefix = refPrefixes[gateway] || 'FT';
  const refCode = `${prefix}.${Math.floor(Math.random() * 9000000000) + 1000000000}`;

  return {
    id,
    gateway,
    transactionDate: dateStr,
    accountNumber: opts.accountNumber || '0123456789',
    code: null,
    content: reference,
    transferType: opts.transferType || 'in',
    transferAmount: amount,
    accumulated: amount + Math.floor(Math.random() * 50000000),
    subAccount: null,
    referenceCode: refCode,
    description: `NGUYEN VAN A chuyen tien ${reference}`, // mock-only field, not in official SePay spec
  };
}

/**
 * Compute HMAC-SHA256 signature matching SePay adapter verification.
 * Algorithm: HMAC-SHA256(JSON.stringify(payload), secret) → hex
 *
 * NOTE: This assumes the webhook handler passes the raw-parsed JSON body
 * to verifyWebhook() without re-serialization (JSON.stringify determinism).
 * Verify this assumption when wiring the production webhook route.
 *
 * @param {Object} payload - Webhook payload
 * @param {string} secret - HMAC secret key
 * @returns {string} Hex-encoded HMAC signature
 */
function computeSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

/**
 * Send webhook POST request to target endpoint.
 *
 * @param {string} url - Target URL
 * @param {Object} payload - JSON payload
 * @param {string} signature - HMAC signature for x-sepay-signature header
 * @returns {Promise<{status: number, body: string}>}
 */
function sendWebhook(url, payload, signature) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const body = JSON.stringify(payload);

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'x-sepay-signature': signature,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Sleep helper for batch sends
 * @param {number} ms - milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Mock SePay Webhook Sender — generates realistic payloads with valid HMAC signatures.

Usage: node mock-sepay-webhook.js [options]

Options:
  --endpoint <url>     Target URL (default: http://localhost:3000/api/webhooks/payment/sepay)
  --secret <key>       HMAC secret (default: env SEPAY_WEBHOOK_SECRET or 'test-secret')
  --amount <vnd>       Amount in VND (default: random 100k-5M)
  --reference <ref>    Order reference (default: random DATAPOT-INV-XXXX)
  --gateway <bank>     Bank name (default: random)
  --type <in|out>      Transfer type (default: 'in')
  --account <num>      Account number (default: '0123456789')
  --count <n>          Number of webhooks to send (default: 1)
  --delay <ms>         Delay between sends in ms (default: 500)
  --invalid-sig        Send with wrong HMAC (tests rejection)
  --dry-run            Print payload, don't send
  --help               Show this help

Environment:
  SEPAY_WEBHOOK_SECRET   Default HMAC secret
  SEPAY_WEBHOOK_URL      Default endpoint URL

Banks: ${VIETNAMESE_BANKS.join(', ')}
    `);
    process.exit(0);
  }

  // Parse CLI arguments
  function getArg(flag, defaultVal) {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
  }

  const endpoint = getArg('--endpoint', process.env.SEPAY_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/payment/sepay');
  const secret = getArg('--secret', process.env.SEPAY_WEBHOOK_SECRET || 'test-secret');
  const amount = getArg('--amount', null);
  const reference = getArg('--reference', null);
  const gateway = getArg('--gateway', null);
  const transferType = getArg('--type', 'in');
  const accountNumber = getArg('--account', '0123456789');
  const count = parseInt(getArg('--count', '1'), 10);
  const delay = parseInt(getArg('--delay', '500'), 10);

  if (isNaN(count) || count < 1) { console.error('Error: --count must be a positive integer'); process.exit(1); }
  if (isNaN(delay) || delay < 0) { console.error('Error: --delay must be a non-negative integer'); process.exit(1); }
  const invalidSig = args.includes('--invalid-sig');
  const dryRun = args.includes('--dry-run');

  async function run() {
    console.log(`\n  SePay Mock Webhook Sender`);
    console.log(`  Target: ${endpoint}`);
    console.log(`  Secret: ${secret.substring(0, 4)}${'*'.repeat(Math.max(0, secret.length - 4))}`);
    console.log(`  Count:  ${count}`);
    if (invalidSig) console.log(`  Mode:   INVALID SIGNATURE (testing rejection)`);
    if (dryRun) console.log(`  Mode:   DRY RUN (no HTTP request)`);
    console.log('');

    for (let i = 0; i < count; i++) {
      const payload = generatePayload({
        amount: amount ? parseInt(amount, 10) : undefined,
        reference: reference || undefined,
        gateway: gateway || undefined,
        transferType,
        accountNumber,
      });

      const sig = invalidSig
        ? 'invalid_signature_for_testing'
        : computeSignature(payload, secret);

      console.log(`  [${i + 1}/${count}] id=${payload.id} | ${payload.gateway} | ${payload.transferAmount.toLocaleString('vi-VN')} VND | ref=${payload.content}`);

      if (dryRun) {
        console.log(`  Payload: ${JSON.stringify(payload, null, 2)}`);
        console.log(`  Signature: ${sig}\n`);
        continue;
      }

      try {
        const res = await sendWebhook(endpoint, payload, sig);
        const icon = res.status >= 200 && res.status < 300 ? '\u2713' : '\u2717';
        console.log(`  ${icon} HTTP ${res.status} — ${res.body}\n`);
      } catch (err) {
        console.error(`  \u2717 Error: ${err.message}\n`);
      }

      if (i < count - 1 && delay > 0) await sleep(delay);
    }

    console.log('  Done.\n');
  }

  run().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}

module.exports = { generatePayload, computeSignature, sendWebhook, VIETNAMESE_BANKS };
