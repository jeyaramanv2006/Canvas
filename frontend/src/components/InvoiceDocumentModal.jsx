import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { mockApi } from '../mockApi';

export default function InvoiceDocumentModal({
  isOpen,
  onClose,
  documentData,
  initialData,
  visitData,
  type = "invoice", // "invoice" | "quote" | "quotation" | "Tax Invoice" | "Proforma Invoice" | "Quotation"
  mode = "view", // "view" | "create"
  currentUser,
  onSaveSuccess
}) {
  const printRef = useRef(null);
  const data = initialData || documentData || visitData;

  const isQuoteType = type.toLowerCase().includes('quote');

  // Form State
  const [formMode, setFormMode] = useState(mode);
  const [previewTab, setPreviewTab] = useState(mode === 'view');
  const [saving, setSaving] = useState(false);

  // Document Type Header
  const [docTypeTitle, setDocTypeTitle] = useState(
    isQuoteType ? "QUOTATION" : (data?.doc_type || (type.toLowerCase().includes('proforma') ? "Proforma Invoice" : "Tax Invoice"))
  );

  // Form fields
  const [docNumber, setDocNumber] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [docDate, setDocDate] = useState('Aug 24, 2026');
  const [dueDate, setDueDate] = useState('Sep 08, 2026');
  const [countryOfSupply, setCountryOfSupply] = useState('India');
  const [placeOfSupply, setPlaceOfSupply] = useState('Tamil Nadu (33)');
  const [extraCharges, setExtraCharges] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [canvasserName, setCanvasserName] = useState('');
  const [canvasserId, setCanvasserId] = useState('');

  // Dynamic Line Items
  const [items, setItems] = useState([]);

  // Helper date formatter: converts ISO/raw date into 'Aug 24, 2026' format
  const formatDisplayDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string' && (d.includes('Aug') || d.includes('Jun') || d.includes('Sep') || d.includes('Jul') || d.includes('Jan') || d.includes('Feb') || d.includes('Mar') || d.includes('Apr') || d.includes('May') || d.includes('Oct') || d.includes('Nov') || d.includes('Dec'))) {
      return d;
    }
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return d;
      return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return d;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const isView = mode === 'view' && !!data;
      setFormMode(isView ? 'view' : 'create');
      setPreviewTab(isView);

      if (data) {
        setDocTypeTitle(isQuoteType ? "QUOTATION" : (data.doc_type || "Proforma Invoice"));
        setDocNumber(data.invoice_number || data.quotation_number || data.id || (isQuoteType ? "A00009" : "A00007"));
        setSchoolName(data.school_name || (isQuoteType ? "SHALOM MATRIC HR SEC SCHOOL" : "SRI NALLAMANI YADAVA GROUP OF INSTITUTES"));
        setAddress(data.address || data.area || (isQuoteType ? "PAVOORCHATRAM," : "NALLAMANI NAGAR ,KODIKURICHI,TENKASI,\nTENKASI,"));
        setDistrict(data.district || (isQuoteType ? "India" : "Tamil Nadu, India - 627804"));
        setContactPerson(data.contact_person || '');
        setPhone(data.phone || '');
        setDocDate(formatDisplayDate(data.date || data.invoice_date || data.quotation_date || (isQuoteType ? "Jun 18, 2026" : "Aug 24, 2026")));
        setDueDate(formatDisplayDate(data.due_date || data.valid_until || (isQuoteType ? "Jul 03, 2026" : "Sep 08, 2026")));
        setCountryOfSupply(data.country_of_supply || "India");
        setPlaceOfSupply(data.place_of_supply || "Tamil Nadu (33)");
        setExtraCharges(Number(data.extra_charges !== undefined ? data.extra_charges : (isQuoteType ? 300 : 1000)));
        setDeliveryCharges(Number(data.delivery_charges !== undefined ? data.delivery_charges : (isQuoteType ? 0 : 3000)));
        setDiscountAmount(Number(data.discount_amount) || 0);
        setCanvasserName(data.canvasser_name || currentUser?.name || 'Murugan');
        setCanvasserId(data.canvasser_id || currentUser?.id || '');

        // Normalizing items
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items.map(i => ({
            name: i.name || i.item_name || i.product || (i.description ? `${i.product ? i.product + ' ' : ''}${i.description}` : 'Custom Item'),
            size: i.size || '-',
            hsn: i.hsn || '',
            gst_rate: Number(i.gst_rate !== undefined ? i.gst_rate : (data.gst_percent || 5)),
            quantity: Number(i.quantity || i.qty || 1),
            unit: i.unit || (isQuoteType ? '' : 'prs'),
            unit_rate: Number(i.unit_rate || i.rate || 0)
          })));
        } else if (data.product_interests) {
          const interests = typeof data.product_interests === 'string'
            ? data.product_interests.split(',').map(s => s.trim())
            : Array.isArray(data.product_interests) ? data.product_interests : [];

          if (interests.length > 0) {
            setItems(interests.map(item => ({
              name: item,
              size: '-',
              hsn: '',
              gst_rate: 5,
              quantity: Number(data.student_strength) || 100,
              unit: item.toLowerCase().includes('shoe') ? 'box' : 'prs',
              unit_rate: item.toLowerCase().includes('shoe') ? 345 : 48
            })));
          } else {
            setItems([{ name: 'Apparel Product', size: '-', hsn: '', gst_rate: 5, quantity: 100, unit: 'prs', unit_rate: 45 }]);
          }
        } else {
          // Default initial examples matching exactly the PDF attached
          if (isQuoteType) {
            setItems([
              { name: "TIE 10 INCH", size: "-", hsn: "", gst_rate: 5, quantity: 35, unit: "", unit_rate: 45 },
              { name: "TIE 14 INCH", size: "-", hsn: "", gst_rate: 5, quantity: 35, unit: "", unit_rate: 47 },
              { name: "BELT 27 INCH", size: "-", hsn: "", gst_rate: 5, quantity: 35, unit: "", unit_rate: 60 },
              { name: "BELT 36 INCH", size: "-", hsn: "", gst_rate: 5, quantity: 30, unit: "", unit_rate: 65 },
              { name: "T SHIRT (PC KULTI) PINK WITH PRINT size 20", size: "-", hsn: "", gst_rate: 5, quantity: 14, unit: "", unit_rate: 220 },
              { name: "T SHIRT (PC KULTI) PINK WITH PRINT size 22", size: "-", hsn: "", gst_rate: 5, quantity: 16, unit: "", unit_rate: 235 },
              { name: "NAVY BLUE DOTKNIT PANT size 22", size: "-", hsn: "", gst_rate: 5, quantity: 20, unit: "", unit_rate: 170 },
              { name: "CREAM X RED BRANDED TERRY", size: "-", hsn: "", gst_rate: 5, quantity: 1, unit: "", unit_rate: 62 }
            ]);
          } else {
            setItems([
              { name: "Shoes for Arts & Science and Pharmacy", size: "-", hsn: "", gst_rate: 5, quantity: 337, unit: "box", unit_rate: 345 },
              { name: "BRANDED TERRY SOCKS", size: "7", hsn: "", gst_rate: 5, quantity: 680, unit: "prs", unit_rate: 48 }
            ]);
          }
        }
      } else {
        // Brand new document
        const isQ = isQuoteType;
        setDocTypeTitle(isQ ? "QUOTATION" : "Proforma Invoice");
        setDocNumber(isQ ? "A00009" : "A00007");
        setSchoolName('');
        setAddress('');
        setDistrict('');
        setContactPerson('');
        setPhone('');
        setDocDate(formatDisplayDate(new Date()));
        setDueDate(formatDisplayDate(new Date(Date.now() + 86400000 * 15)));
        setCountryOfSupply("India");
        setPlaceOfSupply("Tamil Nadu (33)");
        setExtraCharges(isQ ? 300 : 1000);
        setDeliveryCharges(isQ ? 0 : 3000);
        setDiscountAmount(0);
        setCanvasserName(currentUser?.name || 'Murugan');
        setCanvasserId(currentUser?.id || 1);
        setItems(isQ ? [
          { name: "TIE 10 INCH", size: "-", hsn: "", gst_rate: 5, quantity: 35, unit: "", unit_rate: 45 },
          { name: "BELT 27 INCH", size: "-", hsn: "", gst_rate: 5, quantity: 35, unit: "", unit_rate: 60 }
        ] : [
          { name: "Shoes for Arts & Science and Pharmacy", size: "-", hsn: "", gst_rate: 5, quantity: 337, unit: "box", unit_rate: 345 },
          { name: "BRANDED TERRY SOCKS", size: "7", hsn: "", gst_rate: 5, quantity: 680, unit: "prs", unit_rate: 48 }
        ]);
      }
    }
  }, [isOpen, data, mode, type, currentUser]);

  if (!isOpen) return null;

  // Exact Indian Currency Formatter with ₹ symbol and 2 decimals
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Item Calculations
  const calculatedItems = items.map(item => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.unit_rate) || 0;
    const amount = qty * rate;
    const gstRate = Number(item.gst_rate) || 0;
    const cgst = (amount * (gstRate / 2)) / 100;
    const sgst = (amount * (gstRate / 2)) / 100;
    const total = amount + cgst + sgst;
    return {
      ...item,
      amount,
      cgst,
      sgst,
      total
    };
  });

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCgst = calculatedItems.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = calculatedItems.reduce((sum, item) => sum + item.sgst, 0);
  const parsedExtra = Number(extraCharges) || 0;
  const parsedDelivery = Number(deliveryCharges) || 0;
  const parsedDiscount = Number(discountAmount) || 0;

  const rawGrandTotal = subtotal + totalCgst + totalSgst + parsedExtra + parsedDelivery - parsedDiscount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundUpVal = grandTotal - rawGrandTotal;
  const roundUpFormatted = (roundUpVal >= 0 ? roundUpVal : -roundUpVal).toFixed(2);

  // Line Item Handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { name: '', size: '-', hsn: '', gst_rate: 5, quantity: 1, unit: isQuoteType ? '' : 'prs', unit_rate: 0 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save Document
  const handleSaveDocument = async (e) => {
    if (e) e.preventDefault();
    if (!schoolName.trim()) {
      alert("Please enter the School / Institution Name");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        doc_type: docTypeTitle,
        id: docNumber,
        invoice_number: !isQuoteType ? docNumber : undefined,
        quotation_number: isQuoteType ? docNumber : undefined,
        school_name: schoolName,
        address: address,
        district: district,
        contact_person: contactPerson,
        phone: phone,
        date: docDate,
        [isQuoteType ? 'valid_until' : 'due_date']: dueDate,
        country_of_supply: countryOfSupply,
        place_of_supply: placeOfSupply,
        items: calculatedItems,
        subtotal: subtotal,
        total_cgst: totalCgst,
        total_sgst: totalSgst,
        extra_charges: parsedExtra,
        delivery_charges: parsedDelivery,
        discount_amount: parsedDiscount,
        round_up: Number(roundUpFormatted),
        grand_total: grandTotal,
        canvasser_id: canvasserId || currentUser?.id,
        canvasser_name: canvasserName || currentUser?.name || 'Murugan',
        visit_id: data?.visit_id || data?.id
      };

      if (isQuoteType) {
        await mockApi.addQuotation(payload, currentUser?.id, currentUser?.name);
      } else {
        await mockApi.addInvoice(payload, currentUser?.id, currentUser?.name);
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  // Dedicated Isolated Iframe Print: Guarantees ONLY the exact 1-page document is printed without background dashboard contamination
  const handlePrint = () => {
    const printableEl = document.getElementById('printable-invoice');
    if (!printableEl) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    pri.document.open();
    pri.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTypeTitle} - ${docNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            html, body {
              width: 100%;
              height: 100%;
              background: #ffffff !important;
              color: #1e293b !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              font-size: 11px;
              line-height: 1.35;
            }
            #printable-invoice {
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              position: relative !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              min-height: 98vh !important;
            }
            .grid { display: grid; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
            .col-span-4 { grid-column: span 4 / span 4; }
            .col-span-5 { grid-column: span 5 / span 5; }
            .col-span-7 { grid-column: span 7 / span 7; }
            .col-span-8 { grid-column: span 8 / span 8; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .space-y-7 > * + * { margin-top: 1.75rem; }
            .gap-1 { gap: 0.25rem; }
            .gap-6 { gap: 1.5rem; }
            .gap-8 { gap: 2rem; }
            .pt-1 { padding-top: 0.25rem; }
            .pt-2 { padding-top: 0.5rem; }
            .pt-4 { padding-top: 1rem; }
            .pt-10 { padding-top: 2.5rem; }
            .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .p-1\\.5 { padding: 0.375rem; }
            .p-2 { padding: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-1\\.5 { margin-bottom: 0.375rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .font-light { font-weight: 300; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-\\[10\\.5px\\] { font-size: 10.5px; }
            .text-\\[11px\\] { font-size: 11px; }
            .uppercase { text-transform: uppercase; }
            .text-slate-500 { color: #64748b; }
            .text-slate-600 { color: #475569; }
            .text-slate-700 { color: #334155; }
            .text-slate-800 { color: #1e293b; }
            .text-\\[\\#0f172a\\] { color: #0f172a; }
            .text-\\[\\#1e293b\\] { color: #1e293b; }
            .text-white { color: #ffffff !important; }
            .bg-\\[\\#f1f5f9\\] { background-color: #f1f5f9 !important; }
            .bg-\\[\\#38bdf8\\] { background-color: #38bdf8 !important; }
            .border { border-width: 1px; border-style: solid; }
            .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
            .border-r { border-right-width: 1px; border-right-style: solid; }
            .border-slate-200 { border-color: #e2e8f0; }
            .border-slate-300 { border-color: #cbd5e1; }
            .border-slate-700 { border-color: #334155; }
            .divide-y > * + * { border-top-width: 1px; border-top-style: solid; }
            .divide-slate-200 > * + * { border-color: #e2e8f0; }
            .w-full { width: 100%; }
            .w-14 { width: 3.5rem; }
            .h-14 { height: 3.5rem; }
            .w-\\[520px\\] { width: 520px; }
            .h-\\[520px\\] { height: 520px; }
            .rounded-full { border-radius: 9999px; }
            .object-contain { object-fit: contain; }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            .z-0 { z-index: 0; }
            .z-10 { z-index: 10; }
            .opacity-\\[0\\.11\\] { opacity: 0.11; }
            .overflow-hidden { overflow: hidden; }
            .whitespace-pre-line { white-space: pre-line; }
            .border-collapse { border-collapse: collapse; }
          </style>
        </head>
        <body>
          ${printableEl.outerHTML}
        </body>
      </html>
    `);
    pri.document.close();
    pri.focus();
    setTimeout(() => {
      pri.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">

      {/* Outer Shell */}
      <div className="bg-[#121319] border border-white/20 rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none print:bg-white">

        {/* Top Control Bar (Screen Only - Hidden in Print) */}
        <div className="p-4 bg-slate-950 border-b border-white/10 flex flex-wrap items-center justify-between text-white gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
              ME
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {docTypeTitle} {previewTab ? "Preview & Print" : "Editor"}
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  {docNumber}
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Murugan Enterprises Standard Template • Matching Official PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formMode === 'create' && (
              <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab(false)}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${!previewTab ? 'bg-amber-400 text-black font-bold shadow' : 'text-gray-300 hover:text-white'
                    }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Parameters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab(true)}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${previewTab ? 'bg-amber-400 text-black font-bold shadow' : 'text-gray-300 hover:text-white'
                    }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Exact Preview</span>
                </button>
              </div>
            )}

            {previewTab && (
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            )}

            {formMode === 'create' && (
              <button
                onClick={handleSaveDocument}
                disabled={saving}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : `Save ${isQuoteType ? 'Quotation' : 'Invoice'}`}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-900/90 flex justify-center print:p-0 print:bg-white print:overflow-visible">

          {/* TAB 1: PARAMETERS FORM EDITOR */}
          {!previewTab && formMode === 'create' && (
            <div className="w-full max-w-4xl bg-slate-900 border border-white/15 rounded-2xl p-4 sm:p-6 text-white space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{docTypeTitle} Parameters & Line Items</span>
                  </h3>
                  <p className="text-xs text-gray-400">All values correspond directly to the printed commercial document</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400">Total: ₹{grandTotal.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              {/* Document Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Document Title</label>
                  <input
                    type="text"
                    value={docTypeTitle}
                    onChange={(e) => setDocTypeTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">{isQuoteType ? 'Quotation No' : 'Invoice No'}</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. A00007"
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">School / Institution (Billed To) *</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. SRI NALLAMANI YADAVA GROUP OF INSTITUTES"
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Address Lines</label>
                  <textarea
                    rows="2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. NALLAMANI NAGAR ,KODIKURICHI,TENKASI,"
                    className="w-full px-3 py-1.5 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">State & PIN / Area</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Tamil Nadu, India - 627804"
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">{isQuoteType ? 'Quote Date' : 'Invoice Date'}</label>
                    <input
                      type="text"
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      placeholder="Aug 24, 2026"
                      className="w-full px-2 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">{isQuoteType ? 'Valid Till' : 'Due Date'}</label>
                    <input
                      type="text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="Sep 08, 2026"
                      className="w-full px-2 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Custom Product Line Items ({items.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => {
                    const itemAmt = (Number(item.quantity) || 0) * (Number(item.unit_rate) || 0);
                    return (
                      <div key={idx} className="p-3 bg-black/40 border border-white/10 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-1 text-center font-mono font-bold text-gray-400">#{idx + 1}</div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Item description"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="text"
                            placeholder="Size"
                            value={item.size}
                            onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                            className="w-full px-2 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-white text-xs text-center focus:outline-none"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-white text-xs font-mono text-right focus:outline-none"
                          />
                        </div>
                        {!isQuoteType && (
                          <div className="col-span-1">
                            <input
                              type="text"
                              placeholder="Unit"
                              value={item.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-white text-xs text-center focus:outline-none"
                            />
                          </div>
                        )}
                        <div className="col-span-1">
                          <input
                            type="number"
                            placeholder="Rate ₹"
                            value={item.unit_rate}
                            onChange={(e) => handleItemChange(idx, 'unit_rate', e.target.value)}
                            className="w-full px-2 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-white text-xs font-mono text-right focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-emerald-400">
                          ₹{itemAmt.toLocaleString('en-IN')}
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-rose-400 disabled:opacity-30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10 text-xs">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Extra Charges (₹)</label>
                  <input
                    type="number"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Delivery Charges (₹)</label>
                  <input
                    type="number"
                    value={deliveryCharges}
                    onChange={(e) => setDeliveryCharges(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Discounts (₹)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs font-mono focus:outline-none text-emerald-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPreviewTab(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Exact Output</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXACT MATCHING PRINTABLE DOCUMENT */}
          {previewTab && (
            <div
              ref={printRef}
              id="printable-invoice"
              className="w-full max-w-[850px] bg-white text-[#1e293b] shadow-2xl p-8 sm:p-12 relative text-[11px] leading-relaxed font-sans border border-slate-200 min-h-[1100px] flex flex-col justify-between print:w-full print:max-w-none print:shadow-none print:border-none print:p-8 print:m-0 print:min-h-0"
              style={{ color: '#1e293b', backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              {/* Center Background Watermark Logo Matching Exact Attachment */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.11] overflow-hidden z-0 select-none print:opacity-[0.12]"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                <img
                  src="/assets/murugan_logo.png"
                  alt="Murugan Enterprises Watermark"
                  className="w-[520px] h-[520px] object-contain select-none"
                />
              </div>

              {/* Document Content */}
              <div className="relative z-10 space-y-7">

                {/* 1. Header: Logo Left, Title Right */}
                <div className="flex justify-between items-start">
                  <div>
                    <img
                      src="/assets/murugan_logo.png"
                      alt="Murugan Enterprises"
                      className="w-14 h-14 object-contain rounded-full border border-slate-300 shadow-xs"
                    />
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-light tracking-tight text-[#1e293b]">
                      {docTypeTitle}
                    </h1>
                  </div>
                </div>

                {/* 2. Three Column Details: Billed By / Billed To / Invoice Details */}
                <div className="grid grid-cols-12 gap-6 text-[11px] leading-snug">

                  {/* Column 1: Billed By / Quotation From */}
                  <div className="col-span-4 space-y-0.5">
                    <p className="text-[10px] text-slate-500 mb-1">
                      {isQuoteType ? "Quotation From" : "Billed By"}
                    </p>
                    <p className="font-bold text-[#0f172a] text-xs">MURUGAN ENTERPRISES</p>
                    <p className="text-slate-600">36/4, Ambasamudram to Tenkasi main</p>
                    <p className="text-slate-600">road, ALWARKURICHI,</p>
                    <p className="text-slate-600">Tamil Nadu, India - 627412</p>
                    <p className="text-slate-600 pt-1">GSTIN: <span className="text-[#0f172a]">33KRQPS6169P1ZE</span></p>
                    <p className="text-slate-600">PAN: <span className="text-[#0f172a]">KRQPS6169P</span></p>
                    <p className="text-slate-600 pt-1">Phone: +91 90252 68869</p>
                  </div>

                  {/* Column 2: Billed To / Quotation For */}
                  <div className="col-span-4 space-y-0.5">
                    <p className="text-[10px] text-slate-500 mb-1">
                      {isQuoteType ? "Quotation For" : "Billed To"}
                    </p>
                    <p className="font-bold text-[#0f172a] text-xs uppercase leading-tight">
                      {schoolName || (isQuoteType ? "SHALOM MATRIC HR SEC SCHOOL" : "SRI NALLAMANI YADAVA GROUP OF INSTITUTES")}
                    </p>
                    <div className="text-slate-600 uppercase whitespace-pre-line text-[10.5px]">
                      {address || (isQuoteType ? "PAVOORCHATRAM," : "NALLAMANI NAGAR ,KODIKURICHI,TENKASI,\nTENKASI,")}
                    </div>
                    <p className="text-slate-600 text-[10.5px]">
                      {district || (isQuoteType ? "India" : "Tamil Nadu, India - 627804")}
                    </p>
                  </div>

                  {/* Column 3: Invoice Details / Quotation Details */}
                  <div className="col-span-4 space-y-1 text-right">
                    {!isQuoteType && (
                      <p className="text-[10px] text-slate-500 mb-1 text-left">
                        Invoice Details
                      </p>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isQuoteType ? "Quotation No" : "Invoice No"}</span>
                      <span className="text-[#0f172a] font-medium">{docNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isQuoteType ? "Quotation Date" : "Invoice Date"}</span>
                      <span className="text-[#0f172a]">{docDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isQuoteType ? "Valid Till Date" : "Due Date"}</span>
                      <span className="text-[#0f172a]">{dueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Country of Supply:</span>
                      <span className="text-[#0f172a]">{countryOfSupply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Place of Supply:</span>
                      <span className="text-[#0f172a]">{placeOfSupply}</span>
                    </div>
                  </div>

                </div>

                {/* 3. Items Table - Rendered exactly per PDF style */}
                <div className="pt-2">
                  {!isQuoteType ? (
                    /* Invoice Style Table (Soft Grey Header, subtle line dividers) */
                    <table className="w-full text-left text-[10.5px] border-collapse">
                      <thead>
                        <tr className="bg-[#f1f5f9] text-slate-700 font-normal">
                          <th className="py-2.5 px-2.5 font-medium text-left" style={{ width: '30%' }}>Item</th>
                          <th className="py-2.5 px-2 font-medium text-center" style={{ width: '8%' }}>HSN/SAC</th>
                          <th className="py-2.5 px-2 font-medium text-center" style={{ width: '6%' }}>Size</th>
                          <th className="py-2.5 px-2 font-medium text-center leading-tight" style={{ width: '7%' }}>GST<br />Rate</th>
                          <th className="py-2.5 px-2 font-medium text-right" style={{ width: '8%' }}>Quantity</th>
                          <th className="py-2.5 px-2 font-medium text-center" style={{ width: '6%' }}>Unit</th>
                          <th className="py-2.5 px-2 font-medium text-right" style={{ width: '8%' }}>Rate</th>
                          <th className="py-2.5 px-2 font-medium text-right" style={{ width: '11%' }}>Amount</th>
                          <th className="py-2.5 px-2 font-medium text-right" style={{ width: '9%' }}>CGST</th>
                          <th className="py-2.5 px-2 font-medium text-right" style={{ width: '9%' }}>SGST</th>
                          <th className="py-2.5 px-2.5 font-medium text-right" style={{ width: '12%' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {calculatedItems.map((item, idx) => (
                          <tr key={idx} className="text-slate-800">
                            <td className="py-2.5 px-2.5">
                              <span>{idx + 1}. {item.name}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-500">{item.hsn || ""}</td>
                            <td className="py-2.5 px-2 text-center text-slate-700">{item.size || "-"}</td>
                            <td className="py-2.5 px-2 text-center">{item.gst_rate || 5}%</td>
                            <td className="py-2.5 px-2 text-right">{item.quantity}</td>
                            <td className="py-2.5 px-2 text-center text-slate-600">{item.unit || "prs"}</td>
                            <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatINR(item.unit_rate)}</td>
                            <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatINR(item.amount)}</td>
                            <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatINR(item.cgst)}</td>
                            <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatINR(item.sgst)}</td>
                            <td className="py-2.5 px-2.5 text-right font-medium whitespace-nowrap">{formatINR(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    /* Quotation Style Table (Grid Bordered format per Quotation attachment) */
                    <table className="w-full text-left text-[10px] border-collapse border border-slate-700">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-800 font-medium">
                          <th className="p-2 border-r border-slate-700 text-left" style={{ width: '32%' }}>Item</th>
                          <th className="p-2 border-r border-slate-700 text-center" style={{ width: '8%' }}>SIZE</th>
                          <th className="p-2 border-r border-slate-700 text-center" style={{ width: '8%' }}>HSN/SAC</th>
                          <th className="p-2 border-r border-slate-700 text-center leading-tight" style={{ width: '7%' }}>GST<br />Rate</th>
                          <th className="p-2 border-r border-slate-700 text-right" style={{ width: '8%' }}>Quantity</th>
                          <th className="p-2 border-r border-slate-700 text-right" style={{ width: '8%' }}>Rate</th>
                          <th className="p-2 border-r border-slate-700 text-right" style={{ width: '11%' }}>Amount</th>
                          <th className="p-2 border-r border-slate-700 text-right" style={{ width: '9%' }}>CGST</th>
                          <th className="p-2 border-r border-slate-700 text-right" style={{ width: '9%' }}>SGST</th>
                          <th className="p-2 text-right" style={{ width: '12%' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculatedItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-700 text-slate-800">
                            <td className="p-1.5 px-2 border-r border-slate-700">
                              <span>{idx + 1}.  {item.name}</span>
                            </td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-center">{item.size || ""}</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-center text-slate-500">{item.hsn || ""}</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-center">{item.gst_rate || 5}%</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-right">{item.quantity}</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-right whitespace-nowrap">{formatINR(item.unit_rate)}</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-right whitespace-nowrap">{formatINR(item.amount)}</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-right whitespace-nowrap">{formatINR(item.cgst)}</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-right whitespace-nowrap">{formatINR(item.sgst)}</td>
                            <td className="p-1.5 px-2 text-right font-medium whitespace-nowrap">{formatINR(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 4. Bottom Section: Left (Bank Details / Terms) & Right (Calculation Breakdown Table) */}
                <div className="grid grid-cols-12 gap-8 pt-4 items-start">

                  {/* Left Column: Bank Details (Invoice) or Terms (Quotation) */}
                  <div className="col-span-7 space-y-1.5 text-[10.5px]">
                    {!isQuoteType ? (
                      <div className="space-y-1 text-slate-700 leading-normal">
                        <p className="font-semibold text-slate-800 mb-1.5">Bank Details</p>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-4 text-slate-500">Account Name</span>
                          <span className="col-span-8 text-[#0f172a]">MURUGAN ENTERPRISES</span>
                          <span className="col-span-4 text-slate-500">Account Number</span>
                          <span className="col-span-8 text-[#0f172a]">44909857955</span>
                          <span className="col-span-4 text-slate-500">IFSC</span>
                          <span className="col-span-8 text-[#0f172a]">SBIN0002189</span>
                          <span className="col-span-4 text-slate-500">Account Type</span>
                          <span className="col-span-8 text-[#0f172a]">Current</span>
                          <span className="col-span-4 text-slate-500">Bank</span>
                          <span className="col-span-8 text-[#0f172a]">state bank of india</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-700 leading-normal text-[10px]">
                        <p className="font-semibold text-slate-800 mb-1">Terms and Conditions</p>
                        <p>1. 1. Delivery charges are additional and will be charged as per distance and logistics.</p>
                        <p>2. 70% of the invoice value must be paid in advance before dispatch of goods.</p>
                        <p>3. Goods will be dispatched only after receipt of advance payment.</p>
                        <p>4. The remaining 30% balance is payable at the time of delivery / before unloading.</p>
                        <p>5. Any delay in payment may attract delivery hold or extra charges</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Calculations Breakdown & Blue Total Bar */}
                  <div className="col-span-5 text-[11px]">
                    {!isQuoteType ? (
                      /* Invoice Calculation Block */
                      <div className="space-y-1.5 text-right">
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Amount</span>
                          <span className="text-[#0f172a] font-normal">{formatINR(subtotal)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>CGST</span>
                          <span className="text-[#0f172a] font-normal">{formatINR(totalCgst)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>SGST</span>
                          <span className="text-[#0f172a] font-normal">{formatINR(totalSgst)}</span>
                        </div>
                        {parsedExtra > 0 && (
                          <div className="flex justify-between py-0.5 text-slate-600">
                            <span>EXTRA CHARGES</span>
                            <span className="text-[#0f172a] font-normal">{formatINR(parsedExtra)}</span>
                          </div>
                        )}
                        {parsedDelivery > 0 && (
                          <div className="flex justify-between py-0.5 text-slate-600">
                            <span>DELIVERY CHARGES</span>
                            <span className="text-[#0f172a] font-normal">{formatINR(parsedDelivery)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Round Up</span>
                          <span className="text-[#0f172a] font-normal">{roundUpVal < 0 ? `-₹${roundUpFormatted}` : `₹${roundUpFormatted}`}</span>
                        </div>

                        {/* Blue Highlight Total Bar */}
                        <div
                          className="flex justify-between items-center px-4 py-2.5 bg-[#38bdf8] text-white font-medium text-xs mt-2 print:bg-[#38bdf8] print:text-white"
                          style={{ backgroundColor: '#38bdf8', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                          <span className="font-normal">Total (INR)</span>
                          <span className="font-bold text-sm">{formatINR(grandTotal)}</span>
                        </div>
                      </div>
                    ) : (
                      /* Quotation Calculation Block (Grid border matching Quotation attachment) */
                      <div className="border border-slate-700 text-[10.5px]">
                        <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                          <span>Amount</span>
                          <span className="text-[#0f172a]">{formatINR(subtotal)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                          <span>CGST</span>
                          <span className="text-[#0f172a]">{formatINR(totalCgst)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                          <span>SGST</span>
                          <span className="text-[#0f172a]">{formatINR(totalSgst)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                          <span>Discounts</span>
                          <span className="text-[#0f172a]">{formatINR(parsedDiscount)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                          <span>Extra Charges</span>
                          <span className="text-[#0f172a]">{formatINR(parsedExtra)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                          <span>Round Up</span>
                          <span className="text-[#0f172a]">{roundUpVal < 0 ? `-₹${roundUpFormatted}` : `₹${roundUpFormatted}`}</span>
                        </div>
                        {/* Solid Blue Total Cell */}
                        <div
                          className="flex justify-between items-center py-2 px-3 bg-[#38bdf8] text-white text-xs font-semibold print:bg-[#38bdf8] print:text-white"
                          style={{ backgroundColor: '#38bdf8', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                          <span className="font-normal">Total (INR)</span>
                          <span className="font-bold">{formatINR(grandTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* 5. Document Bottom Footer */}
              <div className="pt-10 text-center text-[10px] text-slate-500 relative z-10">
                <p>This is an electronically generated document, no signature is required.</p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
