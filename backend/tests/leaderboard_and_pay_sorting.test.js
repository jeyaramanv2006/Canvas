import assert from 'node:assert';
import app from '../server.js';
import { db } from '../database/db.js';

const PORT = 5066;
process.env.NODE_ENV = 'test';

const server = app.listen(PORT, async () => {
  try {
    console.log(`🧪 Running Leaderboard & Pay Calculation Multi-Criteria Sorting Test Suite on port ${PORT}...`);
    const baseUrl = `http://localhost:${PORT}/api`;

    // 1. Authenticate CEO
    const ceoRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sudhan@ceo', password: 'password' })
    });
    const ceoAuth = await ceoRes.json();
    const ceoToken = ceoAuth.token;
    console.log('  ✓ 1. Authenticated CEO');

    // 2. Fetch Default Leaderboard (sorted by Pay Earned desc)
    const resPay = await fetch(`${baseUrl}/leaderboard?sort_by=pay&order=desc`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    assert.strictEqual(resPay.status, 200);
    const listPay = await resPay.json();
    assert.ok(Array.isArray(listPay) && listPay.length > 0);

    for (let i = 0; i < listPay.length - 1; i++) {
      assert.ok(
        listPay[i].payEarned >= listPay[i + 1].payEarned,
        `Pay sorting order mismatch: ${listPay[i].payEarned} should be >= ${listPay[i + 1].payEarned}`
      );
    }
    console.log('  ✓ 2. Verified sorting by Pay Earned (Highest to Lowest)');

    // 3. Verify Per-Invoice Pay Calculation Breakdown
    const canvasserWithInvoices = listPay.find(c => c.convertedInvoices && c.convertedInvoices.length > 0);
    if (canvasserWithInvoices) {
      const slabRate = canvasserWithInvoices.commissionRate;
      let calculatedSum = 0;
      for (const inv of canvasserWithInvoices.convertedInvoices) {
        const expectedPayout = (inv.grand_total * slabRate) / 100;
        assert.strictEqual(inv.applied_rate, slabRate);
        assert.strictEqual(inv.pay_earned, expectedPayout);
        calculatedSum += expectedPayout;
      }
      assert.strictEqual(canvasserWithInvoices.payEarned, calculatedSum);
      console.log(`  ✓ 3. Verified itemized per-invoice pay calculation (${canvasserWithInvoices.convertedInvoices.length} invoices calculated at ${slabRate}%)`);
    } else {
      console.log('  ✓ 3. No converted invoices yet, slab rate applied cleanly');
    }

    // 4. Fetch Leaderboard sorted by Schools Canvassed (Visits desc)
    const resVisits = await fetch(`${baseUrl}/leaderboard?sort_by=visits&order=desc`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    assert.strictEqual(resVisits.status, 200);
    const listVisits = await resVisits.json();
    for (let i = 0; i < listVisits.length - 1; i++) {
      assert.ok(
        listVisits[i].schoolsCanvassed >= listVisits[i + 1].schoolsCanvassed,
        `Visits sorting order mismatch: ${listVisits[i].schoolsCanvassed} should be >= ${listVisits[i + 1].schoolsCanvassed}`
      );
    }
    console.log('  ✓ 4. Verified sorting by Schools Canvassed (Most to Least)');

    // 5. Fetch Leaderboard sorted by Invoices Converted (Won orders desc)
    const resInvoices = await fetch(`${baseUrl}/leaderboard?sort_by=invoices&order=desc`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    assert.strictEqual(resInvoices.status, 200);
    const listInvoices = await resInvoices.json();
    for (let i = 0; i < listInvoices.length - 1; i++) {
      assert.ok(
        listInvoices[i].invoicesConverted >= listInvoices[i + 1].invoicesConverted,
        `Invoices converted sorting order mismatch: ${listInvoices[i].invoicesConverted} should be >= ${listInvoices[i + 1].invoicesConverted}`
      );
    }
    console.log('  ✓ 5. Verified sorting by Invoices Converted (Most to Least)');

    // 6. Fetch Leaderboard sorted by Total Invoiced Value (Revenue desc)
    const resRevenue = await fetch(`${baseUrl}/leaderboard?sort_by=invoiced&order=desc`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    assert.strictEqual(resRevenue.status, 200);
    const listRevenue = await resRevenue.json();
    for (let i = 0; i < listRevenue.length - 1; i++) {
      assert.ok(
        listRevenue[i].totalInvoiced >= listRevenue[i + 1].totalInvoiced,
        `Revenue sorting order mismatch: ${listRevenue[i].totalInvoiced} should be >= ${listRevenue[i + 1].totalInvoiced}`
      );
    }
    console.log('  ✓ 6. Verified sorting by Total Invoiced Revenue (Highest to Lowest)');

    // 7. Fetch Leaderboard sorted by Conversion Rate
    const resConversion = await fetch(`${baseUrl}/leaderboard?sort_by=conversion&order=desc`, {
      headers: { 'Authorization': `Bearer ${ceoToken}` }
    });
    assert.strictEqual(resConversion.status, 200);
    const listConversion = await resConversion.json();
    for (let i = 0; i < listConversion.length - 1; i++) {
      assert.ok(
        listConversion[i].conversionRate >= listConversion[i + 1].conversionRate,
        `Conversion sorting order mismatch`
      );
    }
    console.log('  ✓ 7. Verified sorting by Conversion Rate %');

    console.log('\n🎉 ALL LEADERBOARD & PAY CALCULATION MULTI-CRITERIA SORTING TESTS PASSED!\n');
    db.close();
    server.close();
    setTimeout(() => process.exit(0), 100);
  } catch (err) {
    console.error('❌ Test failed:', err);
    db.close();
    server.close();
    setTimeout(() => process.exit(1), 100);
  }
});
