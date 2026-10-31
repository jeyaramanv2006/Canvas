import { db } from '../database/db.js';

function extractDocumentId(req) {
  const rawId = req.params.id || req.params[0] || req.body?.id || req.query?.id || '';
  try {
    return decodeURIComponent(rawId);
  } catch (e) {
    return rawId;
  }
}
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

// ── Document Sequencing Helpers ──────────────────────────────────────────────
export function getFYCode(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const year = validDate.getFullYear();
  const month = validDate.getMonth(); // 0 = Jan ... 3 = Apr
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
}

export function formatSequenceId(index, prefix = 'A') {
  return `${prefix}${String(index).padStart(5, '0')}`;
}

export async function generateNextSequentialId(tableName, customPrefix = null, dateStr = null) {
  try {
    const fy = getFYCode(dateStr);
    let systemPrefix = customPrefix;

    if (!systemPrefix) {
      if (tableName === 'quotations') systemPrefix = `ME-QTN-${fy}`;
      else if (tableName === 'proforma_invoices') systemPrefix = `ME-PR-INV-${fy}`;
      else if (tableName === 'invoices') systemPrefix = `ME-TX-INV-${fy}`;
      else if (tableName === 'payments') systemPrefix = `ME-RCPT-${fy}`;
      else systemPrefix = `ME-DOC-${fy}`;
    }

    // If custom prefix is a legacy single-character prefix e.g. 'A'
    if (/^[A-Z]$/i.test(systemPrefix)) {
      const rows = await db.prepare(`SELECT id FROM ${tableName}`).all();
      let maxSeq = 0;
      const regex = new RegExp(`^${systemPrefix}(\\d+)$`, 'i');
      (rows || []).forEach(r => {
        if (r && r.id) {
          const match = r.id.match(regex);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSeq) maxSeq = num;
          }
        }
      });
      return formatSequenceId(maxSeq + 1, systemPrefix);
    }

    // Company format: e.g. ME-QTN-26-27/0001
    const rows = await db.prepare(`SELECT id FROM ${tableName} WHERE id LIKE ?`).all(`${systemPrefix}/%`);
    let maxSeq = 0;
    const regex = new RegExp(`^${systemPrefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}/(\\d+)$`, 'i');
    (rows || []).forEach(r => {
      if (r && r.id) {
        const match = r.id.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
    });

    return `${systemPrefix}/${String(maxSeq + 1).padStart(4, '0')}`;
  } catch (err) {
    console.error(`Error generating sequence for ${tableName}:`, err);
    return `ME-0001`;
  }
}

export async function resequenceDocumentTable(tableName, prefix = 'A') {
  try {
    // Sort all records chronologically
    const rows = await db.prepare(`SELECT id, created_at FROM ${tableName} ORDER BY created_at ASC, id ASC`).all();
    if (!rows || rows.length === 0) return;

    // Track ID mappings for updating foreign keys
    const idMap = [];
    rows.forEach((row, idx) => {
      const targetId = formatSequenceId(idx + 1, prefix);
      if (row.id !== targetId) {
        idMap.push({ oldId: row.id, newId: targetId });
      }
    });

    if (idMap.length === 0) return;

    // Phase 1: Set temporary IDs to avoid collisions
    for (const m of idMap) {
      const tempId = `__TMP_${m.newId}_${Date.now()}_${Math.random()}`;
      await db.prepare(`UPDATE ${tableName} SET id = ? WHERE id = ?`).run(tempId, m.oldId);
      m.tempId = tempId;
    }

    // Phase 2: Set final sequential target IDs and update linked foreign keys
    for (const m of idMap) {
      await db.prepare(`UPDATE ${tableName} SET id = ? WHERE id = ?`).run(m.newId, m.tempId);

      // Cascading foreign keys updates
      if (tableName === 'quotations') {
        try {
          await db.prepare(`UPDATE invoices SET quotation_id = ? WHERE quotation_id = ?`).run(m.newId, m.oldId);
          await db.prepare(`UPDATE proforma_invoices SET quotation_id = ? WHERE quotation_id = ?`).run(m.newId, m.oldId);
        } catch (fkErr) { }
      } else if (tableName === 'proforma_invoices') {
        try {
          await db.prepare(`UPDATE invoices SET proforma_id = ? WHERE proforma_id = ?`).run(m.newId, m.oldId);
        } catch (fkErr) { }
      } else if (tableName === 'invoices') {
        try {
          await db.prepare(`UPDATE payments SET invoice_id = ? WHERE invoice_id = ?`).run(m.newId, m.oldId);
        } catch (fkErr) { }
      }
    }
  } catch (err) {
    console.error(`Error during re-sequencing for ${tableName}:`, err);
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
    query += ' ORDER BY created_at ASC, id ASC';

    const rows = await db.prepare(query).all(...params);
    return res.json((rows || []).map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || []),
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createQuotation(req, res) {
  try {
    const user = req.user;
    const body = req.body;
    const id = body.id || (await generateNextSequentialId('quotations'));

    const stmt = db.prepare(`
      INSERT INTO quotations (
        id, visit_id, canvasser_id, canvasser_name, school_name,
        district, contact_person, phone, items, subtotal,
        tax_amount, discount_amount, grand_total, status, tags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = body.created_at || new Date().toISOString();
    const canvasserId = (body.canvasser_id !== undefined && body.canvasser_id !== null && body.canvasser_id !== '') ? Number(body.canvasser_id) : user.id;
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
      JSON.stringify(body.tags || []),
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
      items: JSON.parse(created.items || '[]'),
      tags: typeof created.tags === 'string' ? JSON.parse(created.tags || '[]') : (created.tags || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateQuotation(req, res) {
  try {
    const id = extractDocumentId(req);
    const body = req.body;

    const updates = [];
    const params = [];

    if (body.canvasser_id !== undefined) { updates.push('canvasser_id = ?'); params.push(body.canvasser_id ? Number(body.canvasser_id) : 99); }
    if (body.canvasser_name !== undefined) { updates.push('canvasser_name = ?'); params.push(body.canvasser_name); }
    if (body.school_name !== undefined) { updates.push('school_name = ?'); params.push(body.school_name); }
    if (body.district !== undefined) { updates.push('district = ?'); params.push(body.district); }
    if (body.contact_person !== undefined) { updates.push('contact_person = ?'); params.push(body.contact_person); }
    if (body.phone !== undefined) { updates.push('phone = ?'); params.push(body.phone); }
    if (body.items !== undefined) { updates.push('items = ?'); params.push(typeof body.items === 'string' ? body.items : JSON.stringify(body.items)); }
    if (body.subtotal !== undefined) { updates.push('subtotal = ?'); params.push(Number(body.subtotal)); }
    if (body.tax_amount !== undefined) { updates.push('tax_amount = ?'); params.push(Number(body.tax_amount)); }
    if (body.discount_amount !== undefined) { updates.push('discount_amount = ?'); params.push(Number(body.discount_amount)); }
    if (body.grand_total !== undefined) { updates.push('grand_total = ?'); params.push(Number(body.grand_total)); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.tags !== undefined) { updates.push('tags = ?'); params.push(typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)); }

    if (updates.length > 0) {
      params.push(id);
      await db.prepare(`UPDATE quotations SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = await db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
    if (!updated) {
      return res.status(404).json({ error: 'Quotation not found: ' + id });
    }
    return res.json({
      ...updated,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items || '[]') : (updated.items || []),
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : (updated.tags || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteQuotation(req, res) {
  try {
    const id = extractDocumentId(req);
    await db.prepare('DELETE FROM quotations WHERE id = ?').run(id);

    return res.json({ success: true, message: 'Quotation deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── Proforma Invoices ───────────────────────────────────────────────────
export async function getProformaInvoices(req, res) {
  try {
    const user = req.user;
    let query = 'SELECT * FROM proforma_invoices';
    const params = [];

    if (['canvasser', 'cvs'].includes(user.role)) {
      query += ' WHERE canvasser_id = ?';
      params.push(user.id);
    }
    query += ' ORDER BY created_at ASC, id ASC';

    const rows = await db.prepare(query).all(...params);
    return res.json((rows || []).map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || []),
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createProformaInvoice(req, res) {
  try {
    const user = req.user;
    const body = req.body;
    const id = body.id || (await generateNextSequentialId('proforma_invoices'));
    const now = body.created_at || new Date().toISOString();

    const canvasserId = (body.canvasser_id !== undefined && body.canvasser_id !== null && body.canvasser_id !== '') ? Number(body.canvasser_id) : user.id;
    const canvasserName = body.canvasser_name || user.name || 'Sales Representative';

    await db.prepare(`
      INSERT INTO proforma_invoices (
        id, quotation_id, visit_id, canvasser_id, canvasser_name,
        school_name, district, contact_person, phone, items,
        subtotal, tax_amount, discount_amount, grand_total,
        status, payment_status, due_date, tags, created_at
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
      Number(body.grand_total || 0),
      body.status || 'Pending',
      body.payment_status || 'Unpaid',
      body.due_date || null,
      JSON.stringify(body.tags || []),
      now
    );

    const created = await db.prepare('SELECT * FROM proforma_invoices WHERE id = ?').get(id);
    return res.status(201).json({
      ...created,
      items: JSON.parse(created.items || '[]'),
      tags: typeof created.tags === 'string' ? JSON.parse(created.tags || '[]') : (created.tags || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateProformaInvoice(req, res) {
  try {
    const id = extractDocumentId(req);
    const body = req.body;

    const updates = [];
    const params = [];

    if (body.canvasser_id !== undefined) { updates.push('canvasser_id = ?'); params.push(body.canvasser_id ? Number(body.canvasser_id) : 99); }
    if (body.canvasser_name !== undefined) { updates.push('canvasser_name = ?'); params.push(body.canvasser_name); }
    if (body.quotation_id !== undefined) { updates.push('quotation_id = ?'); params.push(body.quotation_id); }
    if (body.school_name !== undefined) { updates.push('school_name = ?'); params.push(body.school_name); }
    if (body.district !== undefined) { updates.push('district = ?'); params.push(body.district); }
    if (body.contact_person !== undefined) { updates.push('contact_person = ?'); params.push(body.contact_person); }
    if (body.phone !== undefined) { updates.push('phone = ?'); params.push(body.phone); }
    if (body.items !== undefined) { updates.push('items = ?'); params.push(typeof body.items === 'string' ? body.items : JSON.stringify(body.items)); }
    if (body.subtotal !== undefined) { updates.push('subtotal = ?'); params.push(Number(body.subtotal)); }
    if (body.tax_amount !== undefined) { updates.push('tax_amount = ?'); params.push(Number(body.tax_amount)); }
    if (body.discount_amount !== undefined) { updates.push('discount_amount = ?'); params.push(Number(body.discount_amount)); }
    if (body.grand_total !== undefined) { updates.push('grand_total = ?'); params.push(Number(body.grand_total)); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.payment_status !== undefined) { updates.push('payment_status = ?'); params.push(body.payment_status); }
    else if (body.status !== undefined) { updates.push('payment_status = ?'); params.push(body.status); }
    if (body.due_date !== undefined) { updates.push('due_date = ?'); params.push(body.due_date); }
    if (body.tags !== undefined) { updates.push('tags = ?'); params.push(typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)); }

    if (updates.length > 0) {
      params.push(id);
      await db.prepare(`UPDATE proforma_invoices SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = await db.prepare('SELECT * FROM proforma_invoices WHERE id = ?').get(id);
    if (!updated) {
      return res.status(404).json({ error: 'Proforma Invoice not found: ' + id });
    }
    return res.json({
      ...updated,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items || '[]') : (updated.items || []),
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : (updated.tags || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteProformaInvoice(req, res) {
  try {
    const id = extractDocumentId(req);
    await db.prepare('DELETE FROM proforma_invoices WHERE id = ?').run(id);

    return res.json({ success: true, message: 'Proforma Invoice deleted' });
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
    query += ' ORDER BY created_at ASC, id ASC';

    const rows = await db.prepare(query).all(...params);
    return res.json((rows || []).map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || []),
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createInvoice(req, res) {
  try {
    const user = req.user;
    const body = req.body;
    const id = body.id || (await generateNextSequentialId('invoices'));
    const now = body.created_at || new Date().toISOString();

    const grandTotal = Number(body.grand_total || 0);
    const paidAmount = Number(body.paid_amount || 0);
    const outstanding = Math.max(0, grandTotal - paidAmount);
    const paymentStatus = body.status || body.payment_status || (outstanding === 0 ? 'Fully Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid');

    const canvasserId = (body.canvasser_id !== undefined && body.canvasser_id !== null && body.canvasser_id !== '') ? Number(body.canvasser_id) : user.id;
    const canvasserName = body.canvasser_name || user.name || 'Sales Representative';

    await db.prepare(`
      INSERT INTO invoices (
        id, quotation_id, proforma_id, visit_id, canvasser_id, canvasser_name,
        school_name, district, contact_person, phone, items,
        subtotal, tax_amount, discount_amount, grand_total,
        paid_amount, outstanding_balance, payment_status, due_date, tags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.quotation_id || null,
      body.proforma_id || null,
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
      JSON.stringify(body.tags || []),
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
      items: JSON.parse(created.items || '[]'),
      tags: typeof created.tags === 'string' ? JSON.parse(created.tags || '[]') : (created.tags || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateInvoice(req, res) {
  try {
    const id = extractDocumentId(req);
    const body = req.body;

    const updates = [];
    const params = [];

    if (body.canvasser_id !== undefined) { updates.push('canvasser_id = ?'); params.push(body.canvasser_id ? Number(body.canvasser_id) : 99); }
    if (body.canvasser_name !== undefined) { updates.push('canvasser_name = ?'); params.push(body.canvasser_name); }
    if (body.quotation_id !== undefined) { updates.push('quotation_id = ?'); params.push(body.quotation_id); }
    if (body.proforma_id !== undefined) { updates.push('proforma_id = ?'); params.push(body.proforma_id); }
    if (body.school_name !== undefined) { updates.push('school_name = ?'); params.push(body.school_name); }
    if (body.district !== undefined) { updates.push('district = ?'); params.push(body.district); }
    if (body.contact_person !== undefined) { updates.push('contact_person = ?'); params.push(body.contact_person); }
    if (body.phone !== undefined) { updates.push('phone = ?'); params.push(body.phone); }
    if (body.items !== undefined) { updates.push('items = ?'); params.push(typeof body.items === 'string' ? body.items : JSON.stringify(body.items)); }
    if (body.subtotal !== undefined) { updates.push('subtotal = ?'); params.push(Number(body.subtotal)); }
    if (body.tax_amount !== undefined) { updates.push('tax_amount = ?'); params.push(Number(body.tax_amount)); }
    if (body.discount_amount !== undefined) { updates.push('discount_amount = ?'); params.push(Number(body.discount_amount)); }
    if (body.grand_total !== undefined) { updates.push('grand_total = ?'); params.push(Number(body.grand_total)); }
    if (body.paid_amount !== undefined) { updates.push('paid_amount = ?'); params.push(Number(body.paid_amount)); }
    if (body.outstanding_balance !== undefined) { updates.push('outstanding_balance = ?'); params.push(Number(body.outstanding_balance)); }
    if (body.payment_status !== undefined) { updates.push('payment_status = ?'); params.push(body.payment_status); }
    else if (body.status !== undefined) { updates.push('payment_status = ?'); params.push(body.status); }
    if (body.due_date !== undefined) { updates.push('due_date = ?'); params.push(body.due_date); }
    if (body.tags !== undefined) { updates.push('tags = ?'); params.push(typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)); }

    // If grand_total or paid_amount were provided and outstanding wasn't explicitly set, calculate it
    if ((body.grand_total !== undefined || body.paid_amount !== undefined) && body.outstanding_balance === undefined) {
      const inv = await db.prepare('SELECT grand_total, paid_amount FROM invoices WHERE id = ?').get(id);
      if (inv) {
        const gt = body.grand_total !== undefined ? Number(body.grand_total) : Number(inv.grand_total || 0);
        const pa = body.paid_amount !== undefined ? Number(body.paid_amount) : Number(inv.paid_amount || 0);
        const outstanding = Math.max(0, gt - pa);
        const status = outstanding === 0 ? 'Fully Paid' : pa > 0 ? 'Partially Paid' : 'Unpaid';
        updates.push('outstanding_balance = ?');
        params.push(outstanding);
        if (body.payment_status === undefined) {
          updates.push('payment_status = ?');
          params.push(status);
        }
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await db.prepare(`UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found: ' + id });
    }
    return res.json({
      ...updated,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items || '[]') : (updated.items || []),
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : (updated.tags || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteInvoice(req, res) {
  try {
    const id = extractDocumentId(req);
    await db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(id);
    await db.prepare('DELETE FROM invoices WHERE id = ?').run(id);

    return res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── Payments & Receipts ─────────────────────────────────────────────────
export async function recordPayment(req, res) {
  try {
    const user = req.user;
    const invoiceId = extractDocumentId(req) || req.body.invoice_id;
    const paymentMethod = req.body.payment_method || req.body.mode || 'Bank Transfer / NEFT';
    const referenceNumber = req.body.reference_number || req.body.reference_id || '';
    const notes = req.body.notes || '';
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

    const paymentId = req.body.id || (await generateNextSequentialId('payments'));
    const now = req.body.recorded_at || req.body.date || new Date().toISOString();

    await db.prepare(`
      INSERT INTO payments (
        id, invoice_id, school_name, amount, payment_method,
        reference_number, recorded_by_name, recorded_by_role, notes, tags, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId,
      invoiceId,
      invoice.school_name,
      payAmt,
      paymentMethod,
      referenceNumber,
      user.name || 'Accounts Admin',
      ['canvasser', 'cvs'].includes(user.role) ? 'Canvasser' : 'Finance Admin',
      notes,
      JSON.stringify(req.body.tags || []),
      now
    );

    const updatedInvoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    return res.json({
      success: true,
      payment_id: paymentId,
      invoice: {
        ...updatedInvoice,
        items: JSON.parse(updatedInvoice.items || '[]'),
        tags: typeof updatedInvoice.tags === 'string' ? JSON.parse(updatedInvoice.tags || '[]') : (updatedInvoice.tags || [])
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updatePayment(req, res) {
  try {
    const id = extractDocumentId(req);
    const body = req.body;

    const updates = [];
    const params = [];

    if (body.notes !== undefined) { updates.push('notes = ?'); params.push(body.notes); }
    if (body.tags !== undefined) { updates.push('tags = ?'); params.push(typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)); }

    if (updates.length > 0) {
      params.push(id);
      await db.prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = await db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    if (!updated) {
      return res.status(404).json({ error: 'Payment not found: ' + id });
    }
    return res.json({
      ...updated,
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : (updated.tags || [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deletePayment(req, res) {
  try {
    const id = extractDocumentId(req);
    const payment = await db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    if (payment) {
      // Revert invoice paid balance
      const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(payment.invoice_id);
      if (invoice) {
        const revertedPaid = Math.max(0, Number(invoice.paid_amount || 0) - Number(payment.amount || 0));
        const revertedOutstanding = Math.max(0, Number(invoice.grand_total || 0) - revertedPaid);
        const revertedStatus = revertedOutstanding === 0 ? 'Fully Paid' : revertedPaid > 0 ? 'Partially Paid' : 'Unpaid';
        await db.prepare(`
          UPDATE invoices SET
            paid_amount = ?,
            outstanding_balance = ?,
            payment_status = ?
          WHERE id = ?
        `).run(revertedPaid, revertedOutstanding, revertedStatus, invoice.id);
      }
      await db.prepare('DELETE FROM payments WHERE id = ?').run(id);
    }

    return res.json({ success: true, message: 'Payment receipt deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getPayments(req, res) {
  try {
    const payments = await db.prepare('SELECT * FROM payments ORDER BY recorded_at ASC, id ASC').all();
    return res.json((payments || []).map(p => ({
      ...p,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : (p.tags || [])
    })));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ── CFO Executive Financial Analytics Aggregator ─────────────────────────────
export async function getCFOAnalytics(req, res) {
  try {
    const invoices = (await db.prepare('SELECT id, grand_total, paid_amount, outstanding_balance, due_date, created_at FROM invoices ORDER BY created_at DESC').all()) || [];
    const payments = (await db.prepare('SELECT id, amount, recorded_at FROM payments ORDER BY recorded_at DESC').all()) || [];

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
