import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust CSV parser handling quotes, commas, newlines within quotes
export function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(field => field.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const record = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = row[c] !== undefined ? row[c].trim() : '';
    }
    records.push(record);
  }

  return records;
}

// Convert "24-08-2026" -> "2026-08-24"
export function parseDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return new Date().toISOString().split('T')[0];
  const cleaned = dateStr.trim();
  const dmyMatch = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  return cleaned;
}

export async function seedRefrensData(db) {
  console.log('[RefrensSeeder] Checking and importing Refrens historical records...');

  const dataDir = path.resolve(__dirname, '../data');
  const proformaFile = path.join(dataDir, 'refrens_proforma.csv');
  const quotationsFile = path.join(dataDir, 'refrens_quotations.csv');
  const invoicesFile = path.join(dataDir, 'refrens_invoices.csv');
  const paymentsFile = path.join(dataDir, 'refrens_payments.csv');

  // Fallback Canvasser
  let defaultCanvasserId = 1;
  let defaultCanvasserName = 'Gokul';
  try {
    const user = await db.prepare('SELECT id, name FROM users WHERE role IN (\'cvs\', \'canvasser\', \'admin\') ORDER BY id ASC LIMIT 1').get();
    if (user) {
      defaultCanvasserId = user.id;
      defaultCanvasserName = user.name;
    }
  } catch (e) {}

  // ── 1. IMPORT QUOTATIONS ──────────────────────────────────────────────────
  if (fs.existsSync(quotationsFile)) {
    try {
      const content = fs.readFileSync(quotationsFile, 'utf8');
      const rows = parseCSV(content);
      const quotesMap = new Map();

      for (const r of rows) {
        const id = (r.voucherNumber || r.invoiceNumber || '').trim();
        if (!id) continue;

        if (!quotesMap.has(id)) {
          quotesMap.set(id, {
            id,
            school_name: r.clientName || 'Institution Client',
            district: r.clientCity || r.clientState || 'Tamil Nadu',
            contact_person: r.clientPhone || '',
            phone: r.clientPhone || '+919025268869',
            items: [],
            subtotal: 0,
            tax_amount: 0,
            grand_total: 0,
            status: r.status === 'PAID' ? 'Quotation Accepted' : 'Quotation Sent',
            created_at: parseDate(r.voucherDate) + 'T10:00:00.000Z'
          });
        }

        const quote = quotesMap.get(id);
        const qty = parseFloat(r.quantity) || 1;
        const rate = parseFloat(r.rate) || 0;
        const amt = parseFloat(r.amount) || (qty * rate);
        const tax = parseFloat(r.totalTax) || 0;
        const total = parseFloat(r.totalAmount) || (amt + tax);

        quote.items.push({
          id: quote.items.length + 1,
          name: r.lineItem || 'Custom Item',
          description: r.description || '',
          size: r['items.SIZE'] || r['items.Size'] || r['items.SIZE '] || '-',
          quantity: qty,
          unit: r.unit || 'units',
          rate: rate,
          unit_rate: rate,
          taxable_amount: amt,
          gst_rate: parseFloat(r.taxRate) || 5,
          tax_amount: tax,
          total: total,
          hsn: r.hsn || ''
        });

        quote.subtotal += amt;
        quote.tax_amount += tax;
        quote.grand_total += total;
      }

      for (const [id, q] of quotesMap.entries()) {
        const existing = await db.prepare('SELECT id FROM quotations WHERE id = ?').get(id);
        if (!existing) {
          await db.prepare(`
            INSERT INTO quotations (
              id, canvasser_id, canvasser_name, school_name, district,
              contact_person, phone, items, subtotal, tax_amount,
              discount_amount, grand_total, status, tags, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            q.id,
            defaultCanvasserId,
            defaultCanvasserName,
            q.school_name,
            q.district,
            q.contact_person,
            q.phone,
            JSON.stringify(q.items),
            q.subtotal,
            q.tax_amount,
            0,
            q.grand_total,
            q.status,
            JSON.stringify(['Refrens Import']),
            q.created_at
          );
        }
      }
      console.log(`[RefrensSeeder] Processed ${quotesMap.size} Quotations`);
    } catch (err) {
      console.error('[RefrensSeeder] Quotations import failed:', err.message);
    }
  }

  // ── 2. IMPORT PROFORMA INVOICES ───────────────────────────────────────────
  if (fs.existsSync(proformaFile)) {
    try {
      const content = fs.readFileSync(proformaFile, 'utf8');
      const rows = parseCSV(content);
      const proformaMap = new Map();

      for (const r of rows) {
        const id = (r.voucherNumber || r.invoiceNumber || '').trim();
        if (!id) continue;

        if (!proformaMap.has(id)) {
          const status = r.status === 'PAID' ? 'Paid' : 'Pending';
          proformaMap.set(id, {
            id,
            school_name: r.clientName || 'Institution Client',
            district: r.clientCity || r.clientState || 'Tamil Nadu',
            contact_person: r.clientPhone || '',
            phone: r.clientPhone || '+919025268869',
            items: [],
            subtotal: 0,
            tax_amount: 0,
            grand_total: 0,
            status: status,
            payment_status: status === 'Paid' ? 'Paid' : 'Unpaid',
            due_date: parseDate(r.dueDate),
            created_at: parseDate(r.voucherDate) + 'T10:00:00.000Z'
          });
        }

        const prof = proformaMap.get(id);
        const qty = parseFloat(r.quantity) || 1;
        const rate = parseFloat(r.rate) || 0;
        const amt = parseFloat(r.amount) || (qty * rate);
        const tax = parseFloat(r.totalTax) || 0;
        const total = parseFloat(r.totalAmount) || (amt + tax);

        prof.items.push({
          id: prof.items.length + 1,
          name: r.lineItem || 'Custom Item',
          description: r.description || '',
          size: r['items.Size'] || r['items.SIZE'] || '-',
          quantity: qty,
          unit: r.unit || 'units',
          rate: rate,
          unit_rate: rate,
          taxable_amount: amt,
          gst_rate: parseFloat(r.taxRate) || 5,
          tax_amount: tax,
          total: total,
          hsn: r.hsn || ''
        });

        prof.subtotal += amt;
        prof.tax_amount += tax;
        prof.grand_total += total;
      }

      for (const [id, p] of proformaMap.entries()) {
        const existing = await db.prepare('SELECT id FROM proforma_invoices WHERE id = ?').get(id);
        if (!existing) {
          await db.prepare(`
            INSERT INTO proforma_invoices (
              id, quotation_id, canvasser_id, canvasser_name, school_name,
              district, contact_person, phone, items, subtotal, tax_amount,
              discount_amount, grand_total, status, payment_status, due_date, tags, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            p.id,
            null,
            defaultCanvasserId,
            defaultCanvasserName,
            p.school_name,
            p.district,
            p.contact_person,
            p.phone,
            JSON.stringify(p.items),
            p.subtotal,
            p.tax_amount,
            0,
            p.grand_total,
            p.status,
            p.payment_status,
            p.due_date,
            JSON.stringify(['Refrens Import']),
            p.created_at
          );
        }
      }
      console.log(`[RefrensSeeder] Processed ${proformaMap.size} Proforma Invoices`);
    } catch (err) {
      console.error('[RefrensSeeder] Proforma import failed:', err.message);
    }
  }

  // ── 3. IMPORT TAX INVOICES ────────────────────────────────────────────────
  if (fs.existsSync(invoicesFile)) {
    try {
      const content = fs.readFileSync(invoicesFile, 'utf8');
      const rows = parseCSV(content);
      const invoicesMap = new Map();

      for (const r of rows) {
        const id = (r.invoiceNumber || r.voucherNumber || '').trim();
        if (!id) continue;

        if (!invoicesMap.has(id)) {
          const isPaid = r.status === 'PAID';
          invoicesMap.set(id, {
            id,
            school_name: r.clientName || 'Institution Client',
            district: r.clientCity || r.clientState || 'Tamil Nadu',
            contact_person: r.clientPhone || '',
            phone: r.clientPhone || '+919025268869',
            items: [],
            subtotal: 0,
            tax_amount: 0,
            grand_total: 0,
            paid_amount: parseFloat(r.paidAmount) || 0,
            outstanding_balance: parseFloat(r.dueAmount) || 0,
            payment_status: isPaid ? 'Fully Paid' : 'Unpaid',
            due_date: parseDate(r.dueDate || r.voucherDate),
            created_at: parseDate(r.voucherDate) + 'T10:00:00.000Z'
          });
        }

        const inv = invoicesMap.get(id);
        const qty = parseFloat(r.quantity) || 1;
        const rate = parseFloat(r.rate) || 0;
        const amt = parseFloat(r.amount) || (qty * rate);
        const tax = parseFloat(r.totalTax) || 0;
        const total = parseFloat(r.totalAmount) || (amt + tax);

        inv.items.push({
          id: inv.items.length + 1,
          name: r.lineItem || 'Custom Item',
          description: r.description || '',
          size: r['items.SIZE'] || r['items.Size'] || r['items.SIZE '] || '-',
          quantity: qty,
          unit: r.unit || 'units',
          rate: rate,
          unit_rate: rate,
          taxable_amount: amt,
          gst_rate: parseFloat(r.taxRate) || 5,
          tax_amount: tax,
          total: total,
          hsn: r.hsn || ''
        });

        inv.subtotal += amt;
        inv.tax_amount += tax;
        inv.grand_total += total;
      }

      for (const [id, inv] of invoicesMap.entries()) {
        const existing = await db.prepare('SELECT id FROM invoices WHERE id = ?').get(id);
        const isPaid = inv.payment_status === 'Fully Paid';
        const paid = isPaid ? inv.grand_total : inv.paid_amount;
        const outstanding = isPaid ? 0 : (inv.grand_total - paid);

        if (!existing) {
          await db.prepare(`
            INSERT INTO invoices (
              id, quotation_id, proforma_id, canvasser_id, canvasser_name, school_name,
              district, contact_person, phone, items, subtotal, tax_amount,
              discount_amount, grand_total, paid_amount, outstanding_balance,
              payment_status, due_date, tags, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            inv.id,
            null,
            null,
            defaultCanvasserId,
            defaultCanvasserName,
            inv.school_name,
            inv.district,
            inv.contact_person,
            inv.phone,
            JSON.stringify(inv.items),
            inv.subtotal,
            inv.tax_amount,
            0,
            inv.grand_total,
            paid,
            outstanding,
            isPaid ? 'Fully Paid' : 'Unpaid',
            inv.due_date,
            JSON.stringify(['Refrens Import']),
            inv.created_at
          );
        }
      }
      console.log(`[RefrensSeeder] Processed ${invoicesMap.size} Tax Invoices`);
    } catch (err) {
      console.error('[RefrensSeeder] Invoices import failed:', err.message);
    }
  }

  // ── 4. IMPORT PAYMENT RECEIPTS ───────────────────────────────────────────
  if (fs.existsSync(paymentsFile)) {
    try {
      const content = fs.readFileSync(paymentsFile, 'utf8');
      const rows = parseCSV(content);

      for (const r of rows) {
        const id = (r['Payment Receipt'] || '').trim();
        if (!id) continue;

        const existing = await db.prepare('SELECT id FROM payments WHERE id = ?').get(id);
        if (!existing) {
          const amount = parseFloat(r.Amount) || 0;
          const status = (r.Status || 'SETTLED').toUpperCase();
          const date = parseDate(r.Date) + 'T12:00:00.000Z';

          // Safely resolve matching invoice to maintain foreign key integrity
          let targetInvoiceId = id;
          try {
            const exactInv = await db.prepare('SELECT id FROM invoices WHERE id = ?').get(id);
            if (!exactInv) {
              const billedTo = r['Billed To'] || '';
              const clientInv = await db.prepare('SELECT id FROM invoices WHERE school_name = ? LIMIT 1').get(billedTo);
              if (clientInv) {
                targetInvoiceId = clientInv.id;
              } else {
                const anyInv = await db.prepare('SELECT id FROM invoices LIMIT 1').get();
                if (anyInv) {
                  targetInvoiceId = anyInv.id;
                }
              }
            }
          } catch (invErr) {}

          await db.prepare(`
            INSERT INTO payments (
              id, invoice_id, school_name, amount, payment_method,
              reference_number, recorded_by_name, recorded_by_role, notes, tags, recorded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            targetInvoiceId,
            r['Billed To'] || 'Institutional Client',
            amount,
            'Bank Transfer / NEFT',
            id,
            'Finance Admin',
            'Accounts Executive',
            status === 'CANCELLED' ? 'Cancelled / Voided Receipt' : 'Refrens Settled Receipt',
            JSON.stringify(['Refrens Import']),
            date
          );
        }
      }
      console.log(`[RefrensSeeder] Processed ${rows.length} Payment Receipts`);
    } catch (err) {
      console.error('[RefrensSeeder] Payments import failed:', err.message);
    }
  }

  console.log('[RefrensSeeder] Refrens data synchronization complete.');
}
