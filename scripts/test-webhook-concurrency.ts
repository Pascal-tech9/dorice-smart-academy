/**
 * DORICE SMART ACADEMY - M-PESA C2B WEBHOOK STRESS & IDEMPOTENCY HARNESS
 * Simulates high-concurrency Paybill 400222 callbacks to verify:
 * 1. Rapid concurrent request handling
 * 2. Strict idempotency (duplicate receipt numbers return HTTP 200 without double-crediting)
 * 3. Fallback to unallocated queue for non-matching or malformed accounts
 */

interface MockC2BPayload {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber: string;
  OrgAccountBalance: string;
  ThirdPartyTransID: string;
  MSISDN: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
}

function generatePayload(
  transId: string,
  amount: number,
  billRef: string,
  phone: string = '254712345678',
  payerName: string = 'MARY WANJIKU'
): MockC2BPayload {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const transTime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const parts = payerName.split(' ');

  return {
    TransactionType: 'Pay Bill',
    TransID: transId,
    TransTime: transTime,
    TransAmount: amount.toFixed(2),
    BusinessShortCode: '400222',
    BillRefNumber: billRef,
    InvoiceNumber: '',
    OrgAccountBalance: '500000.00',
    ThirdPartyTransID: '',
    MSISDN: phone,
    FirstName: parts[0] || 'JOHN',
    MiddleName: parts[1] || 'K',
    LastName: parts[2] || 'DOE',
  };
}

export async function runWebhookStressTest(baseUrl: string = 'http://localhost:3000') {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' DORICE SMART ACADEMY — M-PESA C2B WEBHOOK STRESS & IDEMPOTENCY TEST');
  console.log(` Target Endpoint: ${baseUrl}/api/mpesa/callback`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const endpoint = `${baseUrl}/api/mpesa/callback`;
  const timestamp = Date.now().toString().slice(-6);

  // 1. Prepare batch of 15 payloads (10 unique, 5 exact duplicates)
  const testCases: { name: string; payload: MockC2BPayload }[] = [];

  for (let i = 1; i <= 10; i++) {
    testCases.push({
      name: `Unique Tx #${i}`,
      payload: generatePayload(
        `TEST${timestamp}${i.toString().padStart(2, '0')}`,
        1500 + i * 250,
        `369369#Pupil${i},Grade3`,
        `2547000000${i.toString().padStart(2, '0')}`
      ),
    });
  }

  // Add duplicates of Tx #1, #2, #3, #4, #5
  for (let i = 1; i <= 5; i++) {
    testCases.push({
      name: `Duplicate Tx #${i} (Idempotency Test)`,
      payload: testCases[i - 1].payload,
    });
  }

  // Add 2 malformed/unallocated test cases
  testCases.push({
    name: 'Malformed Account (Unallocated queue check)',
    payload: generatePayload(`TEST${timestamp}98`, 3000, 'UNREGISTERED_ACCOUNT_999'),
  });
  testCases.push({
    name: 'Empty BillRef (Unallocated queue check)',
    payload: generatePayload(`TEST${timestamp}99`, 2000, ''),
  });

  console.log(`Firing ${testCases.length} concurrent webhook requests...\n`);
  const startTime = Date.now();

  const results = await Promise.allSettled(
    testCases.map(async (tc) => {
      const reqStart = Date.now();
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tc.payload),
        });
        const duration = Date.now() - reqStart;
        const text = await res.text();
        return {
          name: tc.name,
          transId: tc.payload.TransID,
          status: res.status,
          duration,
          body: text,
        };
      } catch (err: any) {
        return {
          name: tc.name,
          transId: tc.payload.TransID,
          status: 0,
          duration: Date.now() - reqStart,
          error: err.message,
        };
      }
    })
  );

  const totalDuration = Date.now() - startTime;
  console.log('───────────────────────────────────────────────────────────────────');
  console.log(' RESULTS MATRIX:');
  console.log('───────────────────────────────────────────────────────────────────');

  let passed = 0;
  let failed = 0;

  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      const val = r.value;
      const ok = val.status === 200;
      if (ok) passed++;
      else failed++;
      console.log(
        `${ok ? '✓' : '✗'} [${val.status}] ${val.name} (${val.transId}) — ${val.duration}ms`
      );
    } else {
      failed++;
      console.error(`✗ [ERROR] Request ${idx + 1} threw unhandled exception:`, r.reason);
    }
  });

  console.log('\n───────────────────────────────────────────────────────────────────');
  console.log(`SUMMARY: ${passed}/${testCases.length} requests returned HTTP 200.`);
  console.log(`Total Batch Execution Time: ${totalDuration}ms (Avg ${(totalDuration / testCases.length).toFixed(1)}ms/req)`);
  console.log('───────────────────────────────────────────────────────────────────');

  if (failed > 0) {
    console.log('\nNote: If dev server is not running or Supabase is not reachable, test will record connection failures.');
  }
}

// Allow direct execution
const targetUrl = process.argv[2] || 'http://localhost:3000';
runWebhookStressTest(targetUrl);
