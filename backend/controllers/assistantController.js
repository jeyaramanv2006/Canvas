import { db } from '../database/db.js';

// Models in cascade order: starts with gemini-3.5-flash-lite, cascades downward if quota or model unavailable
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.5-pro'
];

/**
 * Builds role-specific schema prompt tailored to:
 * - CEO and Admin: Entire schema (all 10 tables)
 * - CFO, CSO, CCO: All except user directories ('users') and masterdb ('master_schools')
 * - Canvassers: Blocked completely
 */
function buildRoleBasedSchema(user = {}) {
  const role = (user.role || '').toLowerCase();
  const userName = user.name || 'Executive';
  const userId = user.id;

  const isFullAdmin = ['ceo', 'admin', 'manager', 'admin_exec'].includes(role);
  const isCLevelLimited = ['cfo', 'cso', 'cco'].includes(role);

  let schema = `
You are the Canvass AI Assistant for the "Murugan Canvass" application.
Current user: ${userName} (Role: ${role.toUpperCase()}, User ID: ${userId || 'N/A'})
Today's local date reference is: ${new Date().toISOString().split('T')[0]}.

DATABASE TABLES AVAILABLE FOR THIS ROLE:

1. Table "visits":
   - id: INTEGER (Primary Key)
   - canvasser_id: INTEGER
   - canvasser_name: TEXT (Full name of canvasser e.g. "Murugan", "Gokul", "Suresh", "Kannan")
   - school_name: TEXT (Full school name e.g. "Sri Viswabharathi Matriculation Higher Secondary School")
   - district: TEXT (e.g. "Dharmapuri", "Salem", "Chennai", "Coimbatore", "Ariyalur", "Tirunelveli")
   - cluster_or_block: TEXT
   - institution_type: TEXT ("Matriculation", "CBSE", "State Board", "Government")
   - contact_person: TEXT (Principal, Correspondent name)
   - phone: TEXT
   - student_strength: INTEGER
   - product_interests: TEXT (JSON or text e.g. ["English Lab", "Uniform", "Socks"])
   - interest_level: TEXT ('Hot', 'Warm', 'Cold', 'Not Interested')
   - outcome_status: TEXT ('Open', 'Sample Sent', 'Quote Given', 'Won', 'Lost', 'Not Interested')
   - follow_up_date: TEXT (YYYY-MM-DD)
   - notes: TEXT (Remarks, feedback, conversation notes, discussion details)
   - created_at: TIMESTAMP (When visit occurred)

2. Table "products":
   - id: INTEGER
   - name: TEXT (Product name e.g. "English Language Lab", "Custom Socks", "School Uniforms")
   - category: TEXT
   - unit_price: REAL
   - unit: TEXT
   - hsn: TEXT
   - gst_rate: REAL

3. Table "proforma_invoices":
   - id: TEXT (Primary Key e.g. "ME-PR-INV-26-27/0001", "A00005")
   - quotation_id: TEXT
   - visit_id: INTEGER
   - canvasser_id: INTEGER
   - canvasser_name: TEXT
   - school_name: TEXT
   - district: TEXT
   - grand_total: REAL
   - status: TEXT ('Paid', 'Pending', 'Overdue')
   - payment_status: TEXT ('Paid', 'Unpaid')
   - due_date: TEXT
   - created_at: TIMESTAMP

4. Table "invoices" (Tax Invoices / Standard Sales Invoices):
   - id: TEXT (Primary Key e.g. "ME-TX-INV-26-27/0001", "A00018")
   - quotation_id: TEXT
   - proforma_id: TEXT
   - visit_id: INTEGER
   - canvasser_id: INTEGER
   - canvasser_name: TEXT
   - school_name: TEXT
   - district: TEXT
   - grand_total: REAL
   - paid_amount: REAL
   - outstanding_balance: REAL
   - status: TEXT
   - payment_status: TEXT ('Paid', 'Partial', 'Unpaid')
   - due_date: TEXT
   - created_at: TIMESTAMP

5. Table "quotations":
   - id: TEXT (e.g. "ME-QTN-26-27/0001")
   - visit_id: INTEGER
   - canvasser_id: INTEGER
   - canvasser_name: TEXT
   - school_name: TEXT
   - district: TEXT
   - grand_total: REAL
   - status: TEXT ('Sent', 'Draft', 'Approved')
   - created_at: TIMESTAMP

6. Table "payments":
   - id: TEXT
   - invoice_id: TEXT
   - school_name: TEXT
   - amount: REAL
   - payment_method: TEXT
   - recorded_by_name: TEXT
   - notes: TEXT
   - recorded_at: TIMESTAMP
`;

  // CEO and Admin only tables
  if (isFullAdmin) {
    schema += `
7. Table "master_schools" (Master Institutional Database):
   - id: TEXT (School identifier)
   - school_name: TEXT
   - district: TEXT
   - block_or_cluster: TEXT
   - zone: TEXT
   - board: TEXT
   - area: TEXT
   - student_strength: INTEGER
   - contact_person: TEXT
   - phone: TEXT
   - priority: TEXT ('High', 'Medium', 'Low')
   - status: TEXT ('ACTIVE', 'INACTIVE')

8. Table "users" (User Directory):
   - id: INTEGER
   - username: TEXT
   - name: TEXT
   - role: TEXT ('ceo', 'admin', 'cvs', 'cfo', 'cco', 'cso')
   - status: TEXT ('ACTIVE', 'PAUSED')

9. Table "pending_user_actions" (CEO Governance & Approvals Queue):
   - id: INTEGER
   - action_type: TEXT ('CREATE', 'ROLE_CHANGE', 'DELETE', 'PAUSE', 'RESUME')
   - target_user_data: TEXT (JSON)
   - requested_by_name: TEXT
   - requested_by_role: TEXT
   - status: TEXT ('PENDING', 'APPROVED', 'REJECTED')
   - created_at: TIMESTAMP

10. Table "audit_logs" (Change History Trail):
   - id: INTEGER
   - visit_id: INTEGER
   - actor_name: TEXT
   - actor_role: TEXT
   - action: TEXT ('CREATE', 'UPDATE', 'DELETE')
   - changed_fields: TEXT (JSON array of changed fields)
   - timestamp: TIMESTAMP
`;
  }

  schema += `
CRITICAL SEARCH & ROLE ACCESS RULES:

1. ROLE SCOPE (${role.toUpperCase()}):
${isFullAdmin 
  ? '- FULL ACCESS: You have complete access to the entire schema: visits, master_schools, products, quotations, proforma_invoices, invoices, payments, user directories (users), pending approvals (pending_user_actions), and audit logs.'
  : `- C-SUITE ACCESS (${role.toUpperCase()}): You have access to visits, products, quotations, proforma_invoices, invoices, and payments.
- RESTRICTION: You DO NOT have access to user directories ('users') or the master school database ('master_schools'). If the user asks about user directories or masterdb, explain that access is restricted to CEO and Admin.`}

2. PROFORMA INVOICES VS TAX INVOICES:
   - When the user asks for "proforma", "proforma invoices", "proformas", or "PI", ALWAYS query table "proforma_invoices"!
   - Never query "invoices" when asked for proforma invoices!
   - To find paid proforma invoices:
     SELECT id, school_name, canvasser_name, grand_total, status, payment_status, due_date, created_at FROM proforma_invoices WHERE LOWER(payment_status) = 'paid' OR LOWER(status) = 'paid'

3. TAX INVOICES:
   - When the user asks for "tax invoices", "final invoices", "invoices", or "bills", query table "invoices".

4. FUZZY & TOKEN-BASED SCHOOL MATCHING:
   - Schools in Tamil Nadu / India frequently have spelling variations (v vs w, b vs bh, s vs sh) and long suffixes like 'Matriculation Higher Secondary School'.
   - NEVER use exact equality (school_name = '...').
   - NEVER use rigid long phrases like (school_name LIKE '%sri visvabarathi school%').
   - Extract the 1-2 distinct root words (e.g. for 'Sri Visvabarathi School', the roots are 'viswa', 'visva', 'bharathi', 'barathi').
   - Write queries that search with OR across root variations:
     WHERE (LOWER(school_name) LIKE '%viswa%' OR LOWER(school_name) LIKE '%visva%' OR LOWER(school_name) LIKE '%bharathi%')

5. DISTINGUISH CANVASSERS VS SCHOOLS:
   - Names like "Gokul", "Murugan", "Suresh", "Kannan", "Anand" are canvassers.
   - If user says "[Name] canvasses", "schools [Name] canvassed", or "visits by [Name]", filter by canvasser_name:
     WHERE LOWER(canvasser_name) LIKE '%gokul%'
   - If ambiguous whether a word is a person or school name, check BOTH:
     WHERE (LOWER(canvasser_name) LIKE '%name%' OR LOWER(school_name) LIKE '%name%')

6. GENERAL RULES:
   - Generate safe, read-only SELECT queries only.
   - Always order by created_at DESC when asking for recent visits.
   - Always add "LIMIT 50".
   - Return strictly valid JSON:
     {"type": "sql", "query": "SELECT ... LIMIT 25", "explanation": "..."}
     OR {"type": "direct", "text": "Friendly answer"}
`;

  return schema;
}

/**
 * Extracts fuzzy tokens with transliteration variations (v/w, b/bh, s/sh)
 */
function extractFuzzyTokens(text) {
  if (!text || typeof text !== 'string') return [];

  const stopwords = new Set([
    'tell', 'me', 'when', 'we', 'visited', 'the', 'school', 'schools',
    'and', 'who', 'canvassed', 'canvasses', 'canvass', 'it', 'its',
    'details', 'give', 'of', 'what', 'did', 'they', 'say', 'show',
    'have', 'had', 'any', 'for', 'with', 'about', 'is', 'was', 'were',
    'all', 'list', 'please', 'which', 'where', 'this', 'that', 'our', 'adn',
    'today', 'yesterday', 'tomorrow', 'date', 'on', 'in', 'at', 'to'
  ]);

  const rawWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopwords.has(w));

  const tokens = new Set();

  for (const word of rawWords) {
    tokens.add(word);

    // sv <-> sw (e.g. visva <-> viswa)
    if (word.includes('sv')) tokens.add(word.replace(/sv/g, 'sw'));
    if (word.includes('sw')) tokens.add(word.replace(/sw/g, 'sv'));

    // v <-> w
    if (word.includes('v')) tokens.add(word.replace(/v/g, 'w'));
    if (word.includes('w')) tokens.add(word.replace(/w/g, 'v'));

    // b <-> bh
    if (word.includes('bh')) tokens.add(word.replace(/bh/g, 'b'));
    else if (word.includes('b')) tokens.add(word.replace(/b/g, 'bh'));

    // d <-> dh, t <-> th
    if (word.includes('dh')) tokens.add(word.replace(/dh/g, 'd'));
    else if (word.includes('d')) tokens.add(word.replace(/d/g, 'dh'));
    if (word.includes('th')) tokens.add(word.replace(/th/g, 't'));
    else if (word.includes('t')) tokens.add(word.replace(/t/g, 'th'));

    // s <-> sh
    if (word.startsWith('sh')) tokens.add(word.replace(/^sh/, 's'));
    else if (word.startsWith('s')) tokens.add(word.replace(/^s/, 'sh'));

    // Compound word split (e.g. visvabarathi -> visva, viswa, bharathi, barathi)
    if (word.includes('barathi') || word.includes('bharathi')) {
      tokens.add('bharathi');
      tokens.add('barathi');
      const prefix = word.replace(/(?:bh|b)arathi/, '');
      if (prefix.length >= 3) {
        tokens.add(prefix);
        if (prefix.includes('sv')) tokens.add(prefix.replace(/sv/g, 'sw'));
        if (prefix.includes('sw')) tokens.add(prefix.replace(/sw/g, 'sv'));
        if (prefix.includes('v')) tokens.add(prefix.replace(/v/g, 'w'));
        if (prefix.includes('w')) tokens.add(prefix.replace(/w/g, 'v'));
      }
    }
  }

  for (const t of Array.from(tokens)) {
    if (t.includes('barathi')) tokens.add(t.replace(/barathi/g, 'bharathi'));
    if (t.includes('bharathi')) tokens.add(t.replace(/bharathi/g, 'barathi'));
  }

  return Array.from(tokens).filter(t => t.length >= 3);
}

/**
 * Execute Gemini REST call with model fallback
 */
async function callGeminiGenerate({ apiKey, systemInstruction, prompt, jsonMode = false }) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {})
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Assistant] Model ${model} returned ${response.status}: ${errorText.slice(0, 150)}`);
        if ([404, 429, 500, 503].includes(response.status)) {
          lastError = new Error(`Model ${model} failed (${response.status})`);
          continue;
        }
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { text, modelUsed: model };
      }
    } catch (err) {
      console.warn(`[Assistant] Fetch error with model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All configured Gemini models failed or quota exceeded.');
}

/**
 * Stream Gemini output with model fallback
 */
async function streamGeminiGenerate({ apiKey, systemInstruction, prompt, onChunk }) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const body = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Assistant Stream] Model ${model} returned ${response.status}: ${errorText.slice(0, 150)}`);
        if ([404, 429, 500, 503].includes(response.status)) {
          lastError = new Error(`Model ${model} stream failed (${response.status})`);
          continue;
        }
        throw new Error(`Gemini Stream API error (${response.status}): ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunkText) {
                onChunk(chunkText);
              }
            } catch {
              // Ignore partial chunk parsing
            }
          }
        }
      }

      return { modelUsed: model };
    } catch (err) {
      console.warn(`[Assistant Stream] Error with model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All configured Gemini models failed for streaming.');
}

/**
 * Sanitizes and validates SQL queries to enforce strictly read-only execution
 * and enforces strict role-based table access rules.
 */
function sanitizeReadOnlySQL(query, role = '') {
  if (!query || typeof query !== 'string') return null;

  let clean = query.trim().replace(/^```sql/i, '').replace(/```$/i, '').trim();
  clean = clean.replace(/;+$/, '').trim();

  if (!/^(SELECT|WITH)\s+/i.test(clean)) {
    throw new Error('Only read-only SELECT queries are permitted.');
  }

  const forbiddenPatterns = [
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE)\b/i,
    /;/g,
    /--/g,
    /\/\*/g
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(clean)) {
      throw new Error('Unsafe or disallowed SQL construct detected in query.');
    }
  }

  // Enforce table restrictions for CFO, CSO, CCO
  const normRole = (role || '').toLowerCase();
  if (['cfo', 'cso', 'cco'].includes(normRole)) {
    if (/\b(users|master_schools|pending_user_actions|audit_logs)\b/i.test(clean)) {
      throw new Error('Access denied: Querying user directories (users) or masterdb (master_schools) is restricted to CEO and Admin.');
    }
  }

  if (!/\bLIMIT\s+\d+/i.test(clean)) {
    clean += ' LIMIT 50';
  }

  return clean;
}

/**
 * Controller: Handles chatbot streaming interaction with role-based schema and security
 */
export async function streamChat(req, res) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendSSE = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const currentUser = req.user || { role: 'cvs', name: 'User' };
  const userRole = (currentUser.role || '').toLowerCase();

  // Strict role check: Canvassers do not have the AI assistant
  if (['cvs', 'canvasser'].includes(userRole)) {
    sendSSE({
      chunk: "🔒 **Access Restricted**\n\nThe Canvass AI Assistant is not enabled for Canvasser accounts. Please reach out to an Administrator or Executive.",
      done: true,
      error: true
    });
    return res.end();
  }

  if (!apiKey) {
    sendSSE({
      chunk: "⚠️ **Gemini API Key is not configured yet.**\n\nPlease add `GEMINI_API_KEY` to your environment variables (`backend/.env` locally or in the Render Dashboard) to activate the AI assistant."
    });
    sendSSE({ done: true });
    return res.end();
  }

  const { message, history = [] } = req.body || {};

  if (!message || typeof message !== 'string') {
    sendSSE({ chunk: "Please provide a valid question." });
    sendSSE({ done: true });
    return res.end();
  }

  try {
    sendSSE({ status: 'analyzing', message: 'Analyzing question and checking records...' });

    // Step 1: Build role-based schema tailored to currentUser (CEO/Admin vs CFO/CSO/CCO)
    const roleSchemaPrompt = buildRoleBasedSchema(currentUser);

    const contextHistory = history.slice(-6).map(h => `${h.role}: ${h.text}`).join('\n');
    const planPrompt = `Current user question: "${message}"\n\nRecent conversation history:\n${contextHistory}\n\nRemember:
1. If the user question is a short correction (e.g. "sri viswabharathi"), use the prior context to fulfill the original query intent.
2. Break down school names to their root words and use OR variations (e.g. viswa, visva, bharathi).
3. If asking for proforma invoices, strictly query 'proforma_invoices'.
4. Strictly respect role boundaries (CFO/CSO/CCO cannot access 'users' or 'master_schools').
Generate the JSON with read-only SQL query or direct answer.`;

    const planResult = await callGeminiGenerate({
      apiKey,
      systemInstruction: roleSchemaPrompt,
      prompt: planPrompt,
      jsonMode: true
    });

    let decision = null;
    try {
      decision = JSON.parse(planResult.text);
    } catch {
      const match = planResult.text.match(/\{[\s\S]*\}/);
      if (match) {
        decision = JSON.parse(match[0]);
      }
    }

    let retrievedData = null;
    let executedSQL = null;

    if (decision && decision.type === 'sql' && decision.query) {
      try {
        const cleanSQL = sanitizeReadOnlySQL(decision.query, userRole);
        executedSQL = cleanSQL;
        sendSSE({ status: 'querying', query: executedSQL });

        const stmt = db.prepare(cleanSQL);
        const rows = await (stmt.all ? stmt.all() : stmt);
        retrievedData = Array.isArray(rows) ? rows : (rows ? [rows] : []);
        // [TEMPORARY PRESENTATION HIDE - TO BE REVERTED AFTER 1 HR]
        retrievedData = retrievedData.filter(r => {
          if (!r) return false;
          const name = String(r.canvasser_name || '').toLowerCase();
          const idStr = String(r.id || r.invoice_id || '');
          return !name.includes('refrens') && !idStr.startsWith('A');
        });
      } catch (dbErr) {
        console.warn('[Assistant] Initial SQL execution error:', dbErr.message);
        retrievedData = [];
      }
    }

    // Step 1b: 0-Row Automatic Fallback (Self-Correction)
    if (decision?.type === 'sql' && (!retrievedData || retrievedData.length === 0)) {
      console.log('[Assistant] Primary query returned 0 rows. Running automatic fuzzy recovery...');
      
      const combinedText = `${message} ${history.slice(-2).map(h => h.text).join(' ')}`;
      const tokens = extractFuzzyTokens(combinedText);

      if (tokens.length > 0) {
        try {
          const conditions = [];
          for (const token of tokens.slice(0, 10)) {
            const safe = token.replace(/'/g, "''");
            conditions.push(`LOWER(school_name) LIKE '%${safe}%'`);
            conditions.push(`LOWER(canvasser_name) LIKE '%${safe}%'`);
            conditions.push(`LOWER(notes) LIKE '%${safe}%'`);
          }

          const fallbackSQL = `SELECT id, canvasser_name, school_name, district, contact_person, phone, outcome_status, interest_level, notes, created_at FROM visits WHERE (${conditions.join(' OR ')}) ORDER BY created_at DESC LIMIT 25`;
          
          executedSQL = fallbackSQL;
          sendSSE({ status: 'querying', query: executedSQL });

          const fallbackStmt = db.prepare(fallbackSQL);
          const fallbackRows = await (fallbackStmt.all ? fallbackStmt.all() : fallbackStmt);
          
          if (Array.isArray(fallbackRows) && fallbackRows.length > 0) {
            retrievedData = fallbackRows;
            console.log(`[Assistant] Auto-recovery found ${retrievedData.length} records!`);
          } else if (['ceo', 'admin', 'manager', 'admin_exec'].includes(userRole)) {
            // Only CEO and Admin can fallback to master_schools catalog
            const masterConditions = tokens.slice(0, 8).map(t => `LOWER(school_name) LIKE '%${t.replace(/'/g, "''")}%'`);
            const masterSQL = `SELECT id, school_name, district, contact_person, phone, priority FROM master_schools WHERE (${masterConditions.join(' OR ')}) LIMIT 10`;
            const masterStmt = db.prepare(masterSQL);
            const masterRows = await (masterStmt.all ? masterStmt.all() : masterStmt);
            
            if (Array.isArray(masterRows) && masterRows.length > 0) {
              retrievedData = masterRows.map(m => ({
                ...m,
                _catalog_only: true,
                notes: 'Found in Master Schools Catalog (no field visits recorded yet).'
              }));
              executedSQL = masterSQL;
            }
          }
        } catch (fallbackErr) {
          console.warn('[Assistant] Fuzzy recovery error:', fallbackErr.message);
        }
      }
    }

    // Step 2: Stream final synthesized response to user
    const synthesisSystemPrompt = `
You are the Canvass AI Assistant for the school canvas & CRM application.
Provide friendly, direct, concise, and beautifully structured answers based strictly on the retrieved database records.

FORMATTING & STRUCTURE RULES:
1. DO NOT spam bolding (**) or asterisks. Only bold the primary name of each entity (e.g. school name or invoice ID).
2. For lists of records (invoices, proformas, visits), use clean indented bullets:
   - **Entity Name** (ID)
     • Key: Value
     • Amount: ₹Amount | Status: Status
3. Use the Indian Rupee symbol (₹) for monetary amounts with proper comma separators (e.g. ₹2,45,000).
4. If the user asks for proformas or proforma invoices, refer to them explicitly as Proforma Invoices. State the exact count found (e.g. "Found 2 paid proforma invoices:").
5. If no records match, politely explain that no records were found matching those criteria.
`;

    const synthesisUserPrompt = retrievedData && retrievedData.length > 0
      ? `User question: "${message}"
Executed Query: ${executedSQL || 'None'}
Retrieved Database Records (${retrievedData.length} rows):
${JSON.stringify(retrievedData.slice(0, 25), null, 2)}

Answer the user's question directly with the visit details, canvasser, dates, and what was noted/discussed.`
      : (decision?.text || `No matching records found in the database for query: "${message}". Please provide a helpful, polite explanation.`);

    sendSSE({ status: 'generating' });

    const streamResult = await streamGeminiGenerate({
      apiKey,
      systemInstruction: synthesisSystemPrompt,
      prompt: synthesisUserPrompt,
      onChunk: (chunk) => {
        sendSSE({ chunk });
      }
    });

    sendSSE({
      done: true,
      modelUsed: streamResult.modelUsed || planResult.modelUsed,
      executedSQL: executedSQL || null
    });
    res.end();

  } catch (error) {
    console.error('[Assistant] Chat stream failure:', error);
    sendSSE({
      chunk: `\n\n⚠️ *I encountered an issue processing your request: ${error.message}*`
    });
    sendSSE({ done: true, error: true });
    res.end();
  }
}
