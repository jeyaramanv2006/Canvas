import { db } from '../database/db.js';

// ── Products ─────────────────────────────────────────────────────────────
export function getProducts(req, res) {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY id ASC').all();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function createProduct(req, res) {
  try {
    const { name, category, unit_price, unit, hsn, gst_rate = 18.0 } = req.body;
    if (!name || !unit_price || !unit) {
      return res.status(400).json({ error: 'Name, unit_price, and unit are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, category, unit_price, unit, hsn, gst_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, category || 'General', Number(unit_price), unit, hsn || '611595', Number(gst_rate));
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json(newProduct);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function updateProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, category, unit_price, unit, hsn, gst_rate } = req.body;
    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        unit_price = COALESCE(?, unit_price),
        unit = COALESCE(?, unit),
        hsn = COALESCE(?, hsn),
        gst_rate = COALESCE(?, gst_rate)
      WHERE id = ?
    `).run(name, category, unit_price !== undefined ? Number(unit_price) : null, unit, hsn, gst_rate !== undefined ? Number(gst_rate) : null, id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function deleteProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── Quotations ───────────────────────────────────────────────────────────
export function getQuotations(req, res) {
  try {
    const user = req.user;
    let query = 'SELECT * FROM quotations';
    const params = [];

    if (user.role === 'canvasser') {
      query += ' WHERE canvasser_id = ?';
      params.push(user.id);
    }
    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    return res.json(rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function createQuotation(req, res) {
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
    stmt.run(
      id,
      body.visit_id ? Number(body.visit_id) : null,
      user.id,
      user.name,
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
      db.prepare("UPDATE visits SET outcome_status = 'Quote Given', updated_at = ? WHERE id = ?").run(now, Number(body.visit_id));
      db.prepare(`
        INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(body.visit_id),
        user.id,
        user.name,
        user.role === 'canvasser' ? 'Canvasser' : 'Admin',
        'UPDATE',
        JSON.stringify([{ field: 'Outcome Status', from: 'Previous', to: 'Quote Given (Linked to ' + id + ')' }]),
        now
      );
    }

    const created = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
    return res.status(201).json({
      ...created,
      items: JSON.parse(created.items)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── Invoices ─────────────────────────────────────────────────────────────
export function getInvoices(req, res) {
  try {
    const user = req.user;
    let query = 'SELECT * FROM invoices';
    const params = [];

    if (user.role === 'canvasser') {
      query += ' WHERE canvasser_id = ?';
      params.push(user.id);
    }
    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    return res.json(rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function createInvoice(req, res) {
  try {
    const user = req.user;
    const body = req.body;
    const id = body.id || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const grandTotal = Number(body.grand_total || 0);
    const paidAmount = Number(body.paid_amount || 0);
    const outstanding = Math.max(0, grandTotal - paidAmount);
    const paymentStatus = outstanding === 0 ? 'Fully Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    db.prepare(`
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
      user.id,
      user.name,
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
      db.prepare("UPDATE visits SET outcome_status = 'Won', updated_at = ? WHERE id = ?").run(now, Number(body.visit_id));
      db.prepare(`
        INSERT INTO audit_logs (visit_id, actor_id, actor_name, actor_role, action, changed_fields, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        Number(body.visit_id),
        user.id,
        user.name,
        user.role === 'canvasser' ? 'Canvasser' : 'Admin',
        'UPDATE',
        JSON.stringify([{ field: 'Outcome Status', from: 'Previous', to: 'Won (Converted to ' + id + ')' }]),
        now
      );
    }

    const created = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    return res.status(201).json({
      ...created,
      items: JSON.parse(created.items)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export function recordPayment(req, res) {
  try {
    const user = req.user;
    const invoiceId = req.params.id;
    const { amount, payment_method = 'Bank Transfer / NEFT', reference_number = '' } = req.body;

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const payAmt = Number(amount || 0);
    const newPaid = Number(invoice.paid_amount || 0) + payAmt;
    const newOutstanding = Math.max(0, Number(invoice.grand_total || 0) - newPaid);
    const newStatus = newOutstanding === 0 ? 'Fully Paid' : 'Partially Paid';

    db.prepare(`
      UPDATE invoices SET
        paid_amount = ?,
        outstanding_balance = ?,
        payment_status = ?
      WHERE id = ?
    `).run(newPaid, newOutstanding, newStatus, invoiceId);

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO payments (
        id, invoice_id, school_name, amount, payment_method,
        reference_number, recorded_by_name, recorded_by_role, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId,
      invoiceId,
      invoice.school_name,
      payAmt,
      payment_method,
      reference_number,
      user.name || 'Accounts Admin',
      user.role === 'canvasser' ? 'Canvasser' : 'Finance Admin',
      now
    );

    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
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

export function getPayments(req, res) {
  try {
    const payments = db.prepare('SELECT * FROM payments ORDER BY recorded_at DESC').all();
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
