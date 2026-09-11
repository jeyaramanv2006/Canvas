import { db } from '../database/db.js';

// ── Products ─────────────────────────────────────────────────────────────
export async function getProducts(req, res) {
  try {
    const products = await db.prepare('SELECT * FROM products ORDER BY id ASC').all();
    return res.json(products || []);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, category, unit_price, unit, hsn, gst_rate = 18.0 } = req.body;
    if (!name || !unit_price || !unit) {
      return res.status(400).json({ error: 'Name, unit_price, and unit are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, category, unit_price, unit, hsn, gst_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = await stmt.run(name, category || 'General', Number(unit_price), unit, hsn || '611595', Number(gst_rate));
    const latestProd = await db.prepare('SELECT id FROM products ORDER BY id DESC LIMIT 1').get();
    const prodId = result.lastInsertRowid || (latestProd ? latestProd.id : 1);
    const newProduct = await db.prepare('SELECT * FROM products WHERE id = ?').get(Number(prodId));
    return res.status(201).json(newProduct);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, category, unit_price, unit, hsn, gst_rate } = req.body;
    await db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        unit_price = COALESCE(?, unit_price),
        unit = COALESCE(?, unit),
        hsn = COALESCE(?, hsn),
        gst_rate = COALESCE(?, gst_rate)
      WHERE id = ?
    `).run(name, category, unit_price !== undefined ? Number(unit_price) : null, unit, hsn, gst_rate !== undefined ? Number(gst_rate) : null, id);

    const updated = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── Quotations ───────────────────────────────────────────────────────────
export async function getQuotations(req, res) {
  try {
    const user = req.user;
    let query = 'SELECT * FROM quotations';
    const params = [];

    if (['canvasser', 'cvs'].includes(user.role)) {
      query += ' WHERE canvasser_id = ?';
      params.push(user.id);
    }
    query += ' ORDER BY created_at DESC';

    const rows = await db.prepare(query).all(...params);
    return res.json((rows || []).map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createQuotation(req, res) {
  try {
    const user = req.user;
    const body = req.body;
    const id = body.id || `QTN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const stmt = db.prepare(`
      INSERT INTO quotations (
        id, visit_id, canvasser_id, canvasser_name, school_name,
        district, contact_person, phone, items, subtotal,
        tax_amount, discount_amount, grand_total, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const canvasserId = body.canvasser_id ? Number(body.canvasser_id) : user.id;
    const canvasserName = body.canvasser_name || user.name || 'Sales Representative';

    await stmt.run(
      id,
      body.visit_id ? Number(body.visit_id) : null,
      canvasserId,
      canvasserName,
      body.school_name,
      body.district || '',
      body.contact_person || '',
      body.phone || '',
      JSON.stringify(body.items || []),
      Number(body.subtotal || 0),
      Number(body.tax_amount || 0),
      Number(body.discount_amount || 0),
      Number(body.grand_total || 0),
      body.status || 'Sent',
      now
    );

    // If linked to a visit, auto-update visit outcome to "Quote Given" and add audit log
    if (body.visit_id) {
      await db.prepare("UPDATE visits SET outcome_status = 'Quote Given', updated_at = ? WHERE id = ?").run(now, Number(body.visit_id));
      await db.prepare(`
        INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(body.visit_id),
        user.id,
        user.name,
        ['canvasser', 'cvs'].includes(user.role) ? 'Canvasser' : 'Admin',
        'UPDATE',
        JSON.stringify([{ field: 'Outcome Status', from: 'Previous', to: 'Quote Given (Linked to ' + id + ')' }]),
        now
      );
    }

    const created = await db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
    return res.status(201).json({
      ...created,
      items: JSON.parse(created.items)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── Invoices ─────────────────────────────────────────────────────────────
export async function getInvoices(req, res) {
  try {
    const user = req.user;
    let query = 'SELECT * FROM invoices';
    const params = [];

    if (['canvasser', 'cvs'].includes(user.role)) {
      query += ' WHERE canvasser_id = ?';
      params.push(user.id);
    }
    query += ' ORDER BY created_at DESC';

    const rows = await db.prepare(query).all(...params);
    return res.json((rows || []).map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createInvoice(req, res) {
  try {
    const user = req.user;
    const body = req.body;
    const id = body.id || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const grandTotal = Number(body.grand_total || 0);
    const paidAmount = Number(body.paid_amount || 0);
    const outstanding = Math.max(0, grandTotal - paidAmount);
    const paymentStatus = outstanding === 0 ? 'Fully Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    const canvasserId = body.canvasser_id ? Number(body.canvasser_id) : user.id;
    const canvasserName = body.canvasser_name || user.name || 'Sales Representative';

    await db.prepare(`
      INSERT INTO invoices (
        id, quotation_id, visit_id, canvasser_id, canvasser_name,
        school_name, district, contact_person, phone, items,
        subtotal, tax_amount, discount_amount, grand_total,
        paid_amount, outstanding_balance, payment_status, due_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.quotation_id || null,
      body.visit_id ? Number(body.visit_id) : null,
      canvasserId,
      canvasserName,
      body.school_name,
      body.district || '',
      body.contact_person || '',
      body.phone || '',
      JSON.stringify(body.items || []),
      Number(body.subtotal || 0),
      Number(body.tax_amount || 0),
      Number(body.discount_amount || 0),
      grandTotal,
      paidAmount,
      outstanding,
      paymentStatus,
      body.due_date || null,
      now
    );

    // If linked to a visit, auto-update visit outcome to "Won"
    if (body.visit_id) {
      await db.prepare("UPDATE visits SET outcome_status = 'Won', updated_at = ? WHERE id = ?").run(now, Number(body.visit_id));
      await db.prepare(`
        INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(body.visit_id),
        user.id,
        user.name,
        ['canvasser', 'cvs'].includes(user.role) ? 'Canvasser' : 'Admin',
        'UPDATE',
        JSON.stringify([{ field: 'Outcome Status', from: 'Previous', to: 'Won (Converted to ' + id + ')' }]),
        now
      );
    }

    const created = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    return res.status(201).json({
      ...created,
      items: JSON.parse(created.items)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function recordPayment(req, res) {
  try {
    const user = req.user;
    const invoiceId = req.params.id;
    const paymentMethod = req.body.payment_method || req.body.mode || 'Bank Transfer / NEFT';
    const referenceNumber = req.body.reference_number || req.body.reference_id || '';
    const amount = req.body.amount;

    const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const payAmt = Number(amount || 0);
    const newPaid = Number(invoice.paid_amount || 0) + payAmt;
    const newOutstanding = Math.max(0, Number(invoice.grand_total || 0) - newPaid);
    const newStatus = newOutstanding === 0 ? 'Fully Paid' : 'Partially Paid';

    await db.prepare(`
      UPDATE invoices SET
        paid_amount = ?,
        outstanding_balance = ?,
        payment_status = ?
      WHERE id = ?
    `).run(newPaid, newOutstanding, newStatus, invoiceId);

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO payments (
        id, invoice_id, school_name, amount, payment_method,
        reference_number, recorded_by_name, recorded_by_role, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId,
      invoiceId,
      invoice.school_name,
      payAmt,
      paymentMethod,
      referenceNumber,
      user.name || 'Accounts Admin',
      ['canvasser', 'cvs'].includes(user.role) ? 'Canvasser' : 'Finance Admin',
      now
    );

    const updatedInvoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    return res.json({
      success: true,
      payment_id: paymentId,
      invoice: {
        ...updatedInvoice,
        items: JSON.parse(updatedInvoice.items)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getPayments(req, res) {
  try {
    const payments = await db.prepare('SELECT * FROM payments ORDER BY recorded_at DESC').all();
    return res.json(payments || []);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── CFO Executive Financial Analytics Aggregator ─────────────────────────────
export async function getCFOAnalytics(req, res) {
  try {
    const invoices = (await db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all()) || [];
    const payments = (await db.prepare('SELECT * FROM payments ORDER BY recorded_at DESC').all()) || [];
    const quotations = (await db.prepare('SELECT * FROM quotations').all()) || [];

    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
    const totalOutstanding = invoices.reduce((sum, i) => sum + (Number(i.outstanding_balance) || 0), 0);

    const now = new Date();
    let overdueCount = 0;
    let overdueAmount = 0;

    const agingBuckets = {
      current: { label: 'Current (0-30 Days)', count: 0, amount: 0 },
      days31_60: { label: '31 - 60 Days', count: 0, amount: 0 },
      days61_90: { label: '61 - 90 Days', count: 0, amount: 0 },
      days90Plus: { label: '90+ Days (High Risk)', count: 0, amount: 0 }
    };

    invoices.forEach(inv => {
      const balance = Number(inv.outstanding_balance) || 0;
      if (balance > 0) {
        const createdDate = new Date(inv.created_at || Date.now());
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

        if (inv.due_date && new Date(inv.due_date) < now) {
          overdueCount++;
          overdueAmount += balance;
        }

        if (ageInDays <= 30) {
          agingBuckets.current.count++;
          agingBuckets.current.amount += balance;
        } else if (ageInDays <= 60) {
          agingBuckets.days31_60.count++;
          agingBuckets.days31_60.amount += balance;
        } else if (ageInDays <= 90) {
          agingBuckets.days61_90.count++;
          agingBuckets.days61_90.amount += balance;
        } else {
          agingBuckets.days90Plus.count++;
          agingBuckets.days90Plus.amount += balance;
        }
      }
    });

    const estimatedCOGS = totalInvoiced * 0.55;
    const grossProfit = totalInvoiced - estimatedCOGS;
    const grossProfitMargin = totalInvoiced > 0 ? ((grossProfit / totalInvoiced) * 100).toFixed(1) : 45.0;
    const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : 0;
    const dsoDays = totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 90) : 18;

    // Monthly breakdown
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    months.forEach((m, idx) => {
      monthlyDataMap[idx] = { month: m, billed: 0, collected: 0, target: 15 + (idx * 2) };
    });

    invoices.forEach(inv => {
      const d = new Date(inv.created_at || Date.now());
      const mIdx = d.getMonth();
      if (monthlyDataMap[mIdx]) {
        monthlyDataMap[mIdx].billed += (Number(inv.grand_total) || 0) / 100000;
      }
    });

    payments.forEach(p => {
      const d = new Date(p.recorded_at || Date.now());
      const mIdx = d.getMonth();
      if (monthlyDataMap[mIdx]) {
        monthlyDataMap[mIdx].collected += (Number(p.amount) || 0) / 100000;
      }
    });

    const monthlyTrend = Object.values(monthlyDataMap).slice(0, Math.max(now.getMonth() + 1, 6)).map(item => ({
      month: item.month,
      sales: Number(item.billed.toFixed(2)),
      collections: Number(item.collected.toFixed(2)),
      target: item.target
    }));

    const topDebtors = invoices
      .filter(i => (Number(i.outstanding_balance) || 0) > 0)
      .sort((a, b) => Number(b.outstanding_balance) - Number(a.outstanding_balance))
      .slice(0, 5)
      .map(i => ({
        id: i.id,
        school_name: i.school_name,
        district: i.district,
        grand_total: i.grand_total,
        paid_amount: i.paid_amount,
        outstanding_balance: i.outstanding_balance,
        due_date: i.due_date,
        canvasser_name: i.canvasser_name
      }));

    return res.json({
      summary: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        grossProfit: Math.round(grossProfit),
        grossProfitMargin: Number(grossProfitMargin),
        collectionRate: Number(collectionRate),
        dsoDays,
        overdueCount,
        overdueAmount,
        invoicesCount: invoices.length,
        quotationsCount: quotations.length,
        paymentsCount: payments.length
      },
      agingBuckets,
      monthlyTrend,
      topDebtors,
      recentPayments: payments.slice(0, 10),
      recentInvoices: invoices.slice(0, 10).map(inv => ({
        ...inv,
        items: typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : (inv.items || [])
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
