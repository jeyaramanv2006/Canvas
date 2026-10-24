import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Plus,
  Trash2,
  Eye,
  Edit2,
  Edit3,
  Sparkles,
  CheckCircle2,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  Search,
  Check,
  AlertCircle,
  Receipt,
  UserCheck,
  Percent,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';
import { searchMasterSchoolsLocal } from '../data/masterSchools';

// ── Indian Number to Words Helper ─────────────────────────────────────────────
function numberToWordsIndian(num) {
  const n = Math.round(Number(num) || 0);
  if (n <= 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val) {
    if (val < 20) return ones[val];
    const unit = val % 10;
    return tens[Math.floor(val / 10)] + (unit ? ' ' + ones[unit] : '');
  }

  function convertThreeDigits(val) {
    const hundred = Math.floor(val / 100);
    const rest = val % 100;
    let res = '';
    if (hundred > 0) res += ones[hundred] + ' Hundred';
    if (rest > 0) res += (res ? ' ' : '') + convertTwoDigits(rest);
    return res;
  }

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  const parts = [];
  if (crore > 0) parts.push(convertThreeDigits(crore) + ' Crore');
  if (lakh > 0) parts.push(convertTwoDigits(lakh) + ' Lakh');
  if (thousand > 0) parts.push(convertTwoDigits(thousand) + ' Thousand');
  if (remainder > 0) parts.push(convertThreeDigits(remainder));

  return (parts.join(' ') + ' Rupees Only').trim();
}

export default function InvoiceDocumentModal({
  isOpen,
  onClose,
  documentData,
  initialData,
  visitData,
  type = "invoice", // "invoice" | "quote" | "quotation" | "Tax Invoice" | "Proforma Invoice" | "Quotation"
  mode = "view", // "view" | "create" | "edit"
  currentUser,
  onSaveSuccess
}) {
  const printRef = useRef(null);
  const schoolDropdownRef = useRef(null);
  const data = initialData || documentData || visitData;

  // Document Type State (Allow user to toggle or verify)
  const initialNormalized = String(type || '').trim().toLowerCase();
  const initialCategory = initialNormalized.includes('quote') ? 'quote' :
    initialNormalized.includes('proforma') ? 'proforma' : 'invoice';

  const [docCategory, setDocCategory] = useState(initialCategory); // 'quote' | 'proforma' | 'invoice'
  const isQuoteType = docCategory === 'quote';
  const isProformaType = docCategory === 'proforma';
  const isInvoiceType = docCategory === 'invoice';

  // Form State
  const [formMode, setFormMode] = useState(mode);
  const [previewTab, setPreviewTab] = useState(mode === 'view');
  const [saving, setSaving] = useState(false);
  const [docError, setDocError] = useState(null);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  // Document Type Header & Subtitle
  const [docTypeTitle, setDocTypeTitle] = useState(isQuoteType ? "Quotation" : (isProformaType ? "Proforma Invoice" : "Tax Invoice"));
  const [docSubtitle, setDocSubtitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Form fields
  const [docNumber, setDocNumber] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [docDate, setDocDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [extraCharges, setExtraCharges] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Canvasser Attribution (Credited on Leaderboard)
  const [canvasserId, setCanvasserId] = useState('');
  const [canvasserName, setCanvasserName] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Dynamic Line Items
  const [items, setItems] = useState([]);

  // Fetch available users/canvassers on modal open
  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      mockApi.getUsers()
        .then(res => {
          const list = Array.isArray(res) ? res : (res?.users || []);
          setAvailableUsers(list);
        })
        .catch(err => console.warn('Could not load users for canvasser attribution:', err))
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen]);

  // Outside click listener for school autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target)) {
        setShowSchoolDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter master schools matching typed school name
  const matchingSchools = useMemo(() => {
    if (!schoolName || schoolName.trim().length < 2) return [];
    return searchMasterSchoolsLocal(schoolName, 'all', 10);
  }, [schoolName]);

  const handleSelectMasterSchool = (school) => {
    setSchoolName(school.school_name || '');
    if (school.address || school.area || school.block_or_cluster) {
      setAddress(school.address || [school.area, school.block_or_cluster].filter(Boolean).join(', '));
    }
    if (school.district) {
      setDistrict(`${school.district}, Tamil Nadu, India`);
    }
    if (school.contact_person || school.principal_name) {
      setContactPerson(school.contact_person || school.principal_name || '');
    }
    if (school.phone || school.contact_number) {
      setPhone(school.phone || school.contact_number || '');
    }
    setShowSchoolDropdown(false);
  };

  // Helper date formatter
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

  // Initialize Modal Values
  useEffect(() => {
    if (isOpen) {
      const isView = mode === 'view' && !!data;
      setFormMode(isView ? 'view' : (mode || 'create'));
      setPreviewTab(isView);

      const resolvedCategory = initialNormalized.includes('quote') ? 'quote' :
        initialNormalized.includes('proforma') ? 'proforma' : 'invoice';
      setDocCategory(resolvedCategory);

      const titleDefault = resolvedCategory === 'quote' ? "Quotation" : (resolvedCategory === 'proforma' ? "Proforma Invoice" : "Tax Invoice");
      setDocTypeTitle(data?.doc_type || titleDefault);

      if (data) {
        setDocNumber(data.invoice_number || data.quotation_number || data.proforma_number || data.id || '');
        setSchoolName(data.school_name || '');
        setAddress(data.address || data.area || '');
        setDistrict(data.district || 'Tamil Nadu, India');
        setContactPerson(data.contact_person || '');
        setPhone(data.phone || '');
        setDocDate(formatDisplayDate(data.date || data.invoice_date || data.quotation_date || data.created_at || new Date()));
        setDueDate(formatDisplayDate(data.due_date || data.valid_until || new Date(Date.now() + 86400000 * 15)));
        setExtraCharges(Number(data.extra_charges !== undefined ? data.extra_charges : 0));
        setDeliveryCharges(Number(data.delivery_charges !== undefined ? data.delivery_charges : 0));
        setDiscountAmount(Number(data.discount_amount) || 0);

        // Canvasser attribution
        if (data.canvasser_name === 'Refrens Import' || Number(data.canvasser_id) === 99) {
          setCanvasserId('99');
          setCanvasserName('Refrens Import');
        } else {
          setCanvasserId(String(data.canvasser_id || currentUser?.id || '99'));
          setCanvasserName(data.canvasser_name || currentUser?.name || 'Refrens Import');
        }

        // Normalizing items
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items.map(i => ({
            name: i.name || i.item_name || i.product || (i.description ? `${i.product ? i.product + ' ' : ''}${i.description}` : 'Custom Product'),
            size: i.size || i['items.SIZE'] || i['items.Size'] || '-',
            hsn: i.hsn || i.hsn_code || '611595',
            gst_rate: Number(i.gst_rate !== undefined ? i.gst_rate : 5),
            quantity: Number(i.quantity || i.qty || 1),
            unit: i.unit || 'prs',
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
              hsn: item.toLowerCase().includes('sock') ? '611595' : (item.toLowerCase().includes('shoe') ? '640411' : (item.toLowerCase().includes('belt') ? '392690' : '620342')),
              gst_rate: 5,
              quantity: Number(data.student_strength) || 100,
              unit: item.toLowerCase().includes('shoe') ? 'box' : 'prs',
              unit_rate: item.toLowerCase().includes('shoe') ? 345 : 48
            })));
          } else {
            setItems([{ name: 'Custom Product Item', size: '-', hsn: '611595', gst_rate: 5, quantity: 100, unit: 'prs', unit_rate: 50 }]);
          }
        } else {
          setItems([
            { name: '', size: '-', hsn: '611595', gst_rate: 5, quantity: 1, unit: 'prs', unit_rate: 0 }
          ]);
        }
      } else {
        // Brand new document
        setDocNumber('');
        setSchoolName('');
        setAddress('');
        setDistrict('Tamil Nadu, India');
        setContactPerson('');
        setPhone('');
        setDocDate(formatDisplayDate(new Date()));
        setDueDate(formatDisplayDate(new Date(Date.now() + 86400000 * 15)));
        setExtraCharges(0);
        setDeliveryCharges(0);
        setDiscountAmount(0);
        setCanvasserId(String(currentUser?.id || 1));
        setCanvasserName(currentUser?.name || 'Gokul');
        setItems([
          { name: '', size: '-', hsn: '611595', gst_rate: 5, quantity: 1, unit: 'prs', unit_rate: 0 }
        ]);
      }
    }
  }, [isOpen, data, mode, type, currentUser, initialNormalized]);

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
  const grandTotal = Math.max(0, Math.round(rawGrandTotal));
  const roundUpVal = grandTotal - rawGrandTotal;
  const roundUpFormatted = (roundUpVal >= 0 ? roundUpVal : -roundUpVal).toFixed(2);

  // Line Item Handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { name: '', size: '-', hsn: '611595', gst_rate: 5, quantity: 1, unit: 'prs', unit_rate: 0 }
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

  // Switch Document Type
  const handleSwitchCategory = (cat) => {
    setDocCategory(cat);
    if (cat === 'quote') {
      setDocTypeTitle('Quotation');
    } else if (cat === 'proforma') {
      setDocTypeTitle('Proforma Invoice');
    } else {
      setDocTypeTitle('Tax Invoice');
    }
  };

  // Handle Canvasser Change
  const handleCanvasserChange = (e) => {
    const val = e.target.value;
    setCanvasserId(val);
    if (val === '99') {
      setCanvasserName('Refrens Import');
    } else {
      const matched = availableUsers.find(u => String(u.id) === String(val));
      if (matched) {
        setCanvasserName(matched.name);
      }
    }
  };

  // Save Document
  const handleSaveDocument = async (e) => {
    if (e) e.preventDefault();
    setDocError(null);
    if (!schoolName.trim()) {
      setDocError("Please enter or select the Client / School Name");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        doc_type: docTypeTitle,
        id: docNumber || undefined,
        school_name: schoolName,
        address: address,
        district: district,
        contact_person: contactPerson,
        phone: phone,
        date: docDate,
        created_at: data?.created_at || new Date().toISOString(),
        [isQuoteType ? 'valid_until' : 'due_date']: dueDate,
        due_date: dueDate,
        country_of_supply: "India",
        place_of_supply: "Tamil Nadu (33)",
        items: calculatedItems,
        subtotal: subtotal,
        tax_amount: totalCgst + totalSgst,
        total_cgst: totalCgst,
        total_sgst: totalSgst,
        extra_charges: parsedExtra,
        delivery_charges: parsedDelivery,
        discount_amount: parsedDiscount,
        round_up: Number(roundUpFormatted),
        grand_total: grandTotal,
        canvasser_id: canvasserId ? Number(canvasserId) : (currentUser?.id || 99),
        canvasser_name: canvasserName || currentUser?.name || 'Refrens Import',
        visit_id: data?.visit_id || data?.id,
        tags: data?.tags || (data?.id?.startsWith('A') ? ['Refrens Import'] : [])
      };

      const isExistingEdit = formMode === 'edit' && !!data?.id;

      if (isQuoteType) {
        if (isExistingEdit) {
          await mockApi.updateQuotation(data.id, payload);
        } else {
          await mockApi.addQuotation(payload, payload.canvasser_id, payload.canvasser_name);
        }
      } else if (isProformaType) {
        if (isExistingEdit) {
          await mockApi.updateProformaInvoice(data.id, payload);
        } else {
          await mockApi.addProformaInvoice(payload, payload.canvasser_id, payload.canvasser_name);
        }
      } else {
        if (isExistingEdit) {
          await mockApi.updateInvoice(data.id, payload);
        } else {
          await mockApi.addInvoice(payload, payload.canvasser_id, payload.canvasser_name);
        }
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }
      onClose();
    } catch (err) {
      setDocError(err.message || "Failed to save document. Please verify all fields.");
    } finally {
      setSaving(false);
    }
  };

  // High-Fidelity Isolated Print
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

    let styleElements = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      styleElements += node.outerHTML + '\n';
    });

    pri.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTypeTitle} - ${docNumber || 'Commercial Document'}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          ${styleElements}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #1e293b !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
              font-size: 11px !important;
              line-height: 1.4 !important;
            }
            #printable-invoice {
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 16mm 18mm 14mm 18mm !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              position: relative !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
          </style>
        </head>
        <body>
          ${printableEl.outerHTML}
        </body>
      </html>
    `);
    pri.document.close();

    const images = pri.document.images;
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        pri.focus();
        pri.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    });
  };

  const modalContent = (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">

      {/* Main Container Shell */}
      <div className="bg-[#101118] border border-white/15 rounded-3xl w-full max-w-[96vw] 2xl:max-w-[1440px] xl:max-w-[1360px] lg:max-w-6xl h-[90vh] sm:h-[91.5vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-100">

        {/* ── Top Navigation & Refrens Progress Bar ──────────────────────────── */}
        <div className="p-3.5 sm:p-4 bg-[#14151f] border-b border-white/10 flex items-center justify-between gap-4 flex-nowrap shrink-0 overflow-x-auto">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
              isQuoteType ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20' :
              isProformaType ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' :
              'bg-blue-500 text-white shadow-md shadow-blue-500/20'
            }`}>
              {isQuoteType ? 'QT' : isProformaType ? 'PI' : 'INV'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Create New Document</span>
                <span className="text-gray-600 font-bold">›</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">{docTypeTitle}</span>
                {docNumber && (
                  <span className="text-[10px] bg-white/10 text-amber-300 border border-white/10 px-2 py-0.5 rounded-full font-mono font-bold">
                    {docNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                <span className={`inline-flex items-center gap-1 font-bold ${
                  isQuoteType ? 'text-amber-400' : isProformaType ? 'text-purple-400' : 'text-blue-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isQuoteType ? 'bg-amber-400' : isProformaType ? 'bg-purple-400' : 'bg-blue-400'
                  }`} /> Step 1: Add Details
                </span>
                <span>•</span>
                <span>Step 2: Review & Save</span>
              </div>
            </div>
          </div>

          {/* Document Type Selector Switcher Pills */}
          <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 text-xs shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchCategory('quote')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap",
                isQuoteType ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-black" : "text-gray-400 hover:text-white"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quotation</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchCategory('proforma')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap",
                isProformaType ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 font-black" : "text-gray-400 hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Proforma</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchCategory('invoice')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap",
                isInvoiceType ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 font-black" : "text-gray-400 hover:text-white"
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Tax Invoice</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewTab(!previewTab)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap",
                previewTab
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
              )}
            >
              {previewTab ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{previewTab ? "Back to Refrens Editor" : "Exact Print Preview"}</span>
            </button>

            {previewTab && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDocument}
              disabled={saving}
              className={`px-4 py-1.5 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition cursor-pointer whitespace-nowrap ${
                isQuoteType ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20' :
                isProformaType ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20' :
                'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
              }`}
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{saving ? 'Saving...' : `Save ${isQuoteType ? 'Quotation' : isProformaType ? 'Proforma' : 'Tax Invoice'}`}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Canvas Body */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-5 bg-[#0c0d13] flex justify-center">

          {/* ════════════════════════════════════════════════════════════════════
              MODE 1: REFRENS-STYLED INTERACTIVE DOCUMENT CANVAS EDITOR
             ════════════════════════════════════════════════════════════════════ */}
          {!previewTab && (
            <div className="w-full max-w-6xl xl:max-w-[1240px] bg-[#14151f] border border-white/10 rounded-3xl p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5 shadow-2xl relative">

              {/* Error Alert */}
              {docError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-300 text-xs shadow-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{docError}</span>
                  </div>
                  <button onClick={() => setDocError(null)} className="text-rose-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ── 1. Document Title & Company Logo Header Row ──────────────── */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {isEditingTitle ? (
                      <input
                        type="text"
                        autoFocus
                        value={docTypeTitle}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                        onChange={(e) => setDocTypeTitle(e.target.value)}
                        className="text-2xl sm:text-3xl font-black bg-black/60 border border-amber-400/50 rounded-xl px-3 py-1 text-white focus:outline-none"
                      />
                    ) : (
                      <h1
                        onClick={() => setIsEditingTitle(true)}
                        className="text-2xl sm:text-3xl font-black text-white hover:text-amber-300 cursor-pointer flex items-center gap-2 group transition-colors tracking-tight"
                      >
                        <span>{docTypeTitle}</span>
                        <Edit2 className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
                      </h1>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="+ Add Subtitle (e.g. Bulk Manufacturing Estimate)"
                      value={docSubtitle}
                      onChange={(e) => setDocSubtitle(e.target.value)}
                      className="text-xs text-gray-400 hover:text-white placeholder-gray-600 bg-transparent focus:bg-black/40 border border-transparent focus:border-white/10 rounded px-2 py-0.5 focus:outline-none transition-all w-64 sm:w-80"
                    />
                  </div>
                </div>

                {/* Murugan Enterprises Brand Badge (Refrens style logo box) */}
                <div className="flex items-center gap-3 bg-black/40 border border-white/10 p-2.5 rounded-2xl shadow-inner">
                  <img
                    src="/assets/murugan_logo.png"
                    alt="Murugan Enterprises"
                    className="w-12 h-12 rounded-xl object-contain bg-white/5 border border-white/10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <div className="text-xs font-black text-white tracking-wide">MURUGAN ENTERPRISES</div>
                    <div className="text-[10px] text-amber-400 font-bold">Apparel & Footwear Mfr.</div>
                    <div className="text-[9px] text-gray-400">Alwarkurichi, Tamil Nadu</div>
                  </div>
                </div>
              </div>

              {/* ── 2. Top Metadata (Number, Date, Valid Till / Due Date) ─────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/30 border border-white/5 p-4 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    {isQuoteType ? 'Quotation No*' : isProformaType ? 'Proforma Invoice No*' : 'Invoice No*'}
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={isQuoteType ? "ME-QTN-26-27/0025 (Auto-assigned)" : isProformaType ? "ME-PR-INV-26-27/0025 (Auto-assigned)" : "ME-TX-INV-26-27/0025 (Auto-assigned)"}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[9px] text-gray-500 mt-0.5 block">
                    Leave blank to auto-generate next sequential company ID
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    {isQuoteType ? 'Quotation Date*' : isProformaType ? 'Proforma Date*' : 'Invoice Date*'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      placeholder="Oct 24, 2026"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400 pr-8"
                    />
                    <Calendar className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    {isQuoteType ? 'Valid Till*' : 'Payment Due Date*'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="Nov 08, 2026"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400 pr-8"
                    />
                    <Calendar className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ── 3. Billed By & Billed To Cards (Refrens Side-by-Side) ─────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                {/* CARD 1: BILLED BY (MURUGAN ENTERPRISES) */}
                <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="border-b border-white/10 pb-1.5">
                      <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider border-b-2 border-dashed border-amber-400/40 inline-block pb-0.5">
                        Billed By (Your Details)
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-300 pt-0.5">
                      <div className="font-black text-white text-sm">MURUGAN ENTERPRISES</div>
                      <p className="text-gray-400 text-[11px] leading-relaxed">
                        36/4, Ambasamudram to Tenkasi main road, ALWARKURICHI, Tamil Nadu, India - 627412
                      </p>
                      <div className="pt-1 space-y-1 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-12 font-medium">GSTIN:</span>
                          <span className="font-mono font-bold text-gray-200">33KRQPS8169P1ZE</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-12 font-medium">PAN:</span>
                          <span className="font-mono font-bold text-gray-200">KRQPS8169P</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-12 font-medium">Phone:</span>
                          <span className="font-mono text-gray-200">+91 90252 68869</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Business Entity
                    </span>
                    <span className="font-mono text-gray-500">State Code: 33 (TN)</span>
                  </div>
                </div>

                {/* CARD 2: BILLED TO (CLIENT DETAILS + CANVASSER FIELD) */}
                <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="border-b border-white/10 pb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider border-b-2 border-dashed border-purple-400/40 inline-block pb-0.5">
                        Billed To (Client's Details)
                      </h3>
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Master DB Connected
                      </span>
                    </div>

                    {/* Searchable School Dropdown */}
                    <div className="relative" ref={schoolDropdownRef}>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">Select Client / Institution *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => {
                            setSchoolName(e.target.value);
                            setShowSchoolDropdown(true);
                          }}
                          onFocus={() => {
                            if (schoolName && schoolName.trim().length >= 2) {
                              setShowSchoolDropdown(true);
                            }
                          }}
                          placeholder="Search institution name in Master DB..."
                          className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400 pr-8"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Autocomplete Dropdown */}
                      {showSchoolDropdown && matchingSchools.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#161722] border border-amber-500/40 rounded-2xl shadow-2xl z-[100] max-h-52 overflow-y-auto divide-y divide-white/5 backdrop-blur-xl">
                          <div className="p-2 bg-amber-500/10 border-b border-white/5 flex items-center justify-between text-[10px] text-amber-300 font-bold px-3">
                            <span>⚡ AUTOFILL CLIENT</span>
                            <span className="text-gray-400 font-normal">Click to apply</span>
                          </div>
                          {matchingSchools.map(school => (
                            <div
                              key={school.id}
                              onMouseDown={() => handleSelectMasterSchool(school)}
                              className="p-2.5 px-3 hover:bg-white/10 cursor-pointer transition-colors text-xs flex justify-between items-center"
                            >
                              <div>
                                <div className="font-bold text-white uppercase">{school.school_name}</div>
                                <div className="text-[10px] text-gray-400">{school.district} • {school.area || school.block_or_cluster || ''}</div>
                              </div>
                              <span className="text-[10px] font-mono text-gray-500">{school.id}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client Address & Contact Fields */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="Contact Person (Principal)"
                          className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-[11px] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street / Area Address"
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white text-[11px] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* ── CANVASSER FIELD (CREDITED FOR TEAM LEADERBOARD) ────── */}
                  <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Canvasser (Credited for Team Leaderboard)*</span>
                      </label>
                      <span className="text-[9px] text-gray-400">Team Commission Link</span>
                    </div>

                    <select
                      value={canvasserId}
                      onChange={handleCanvasserChange}
                      className="w-full px-3 py-1.5 bg-black/80 border border-amber-400/40 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="99">Unassigned / Refrens Import (System Historical Data)</option>
                      {availableUsers
                        .filter(u => u.status === 'ACTIVE' || !u.status)
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role_title || u.role || 'Sales Rep'})
                          </option>
                        ))}
                    </select>

                    <div className="text-[10px] text-gray-400 flex items-center gap-1.5 leading-tight pt-0.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Assigned to <strong className="text-white">{canvasserName || 'Canvasser'}</strong>. Revenue & won orders will count toward their leaderboard score.</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* ── 4. Refrens Style Currency & Column Toolbar ────────────────── */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[11px]">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    <span>Default GST Rate: <strong className="text-white">5% (CGST 2.5% + SGST 2.5%)</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                  <span>Currency:</span>
                  <span className="px-2.5 py-1 bg-black/40 border border-white/10 rounded-lg text-white font-mono font-bold">
                    Indian Rupee (INR, ₹)
                  </span>
                </div>
              </div>

              {/* ── 5. Refrens Line Items Table ──────────────────────────────── */}
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 text-white font-black uppercase text-[10px] tracking-wider border-b border-white/10">
                        <th className="py-2.5 px-2 text-center w-8">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Item Name / SKU Id</th>
                        <th className="py-2.5 px-2 w-16 text-center">Size</th>
                        <th className="py-2.5 px-2 w-20 text-center">HSN/SAC</th>
                        <th className="py-2.5 px-2 w-16 text-center">GST %</th>
                        <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                        <th className="py-2.5 px-2 w-16 text-center">Unit</th>
                        <th className="py-2.5 px-2 w-20 text-right">Rate (₹)</th>
                        <th className="py-2.5 px-2 w-20 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-2 w-16 text-right">CGST</th>
                        <th className="py-2.5 px-2 w-16 text-right">SGST</th>
                        <th className="py-2.5 px-2 w-24 text-right">Total (₹)</th>
                        <th className="py-2.5 px-2 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-black/20">
                      {calculatedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-2 text-center text-gray-500 font-mono text-[11px] font-bold">
                            {idx + 1}.
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              placeholder="e.g. Socks (Combed Cotton)"
                              className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.size}
                              onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                              placeholder="-"
                              className="w-full px-1.5 py-1 bg-black/60 border border-white/10 rounded-lg text-white text-center text-xs font-mono focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)}
                              placeholder="611595"
                              className="w-full px-1.5 py-1 bg-black/60 border border-white/10 rounded-lg text-white text-center text-xs font-mono focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <select
                              value={item.gst_rate}
                              onChange={(e) => handleItemChange(idx, 'gst_rate', Number(e.target.value))}
                              className="w-full px-1 py-1 bg-black/80 border border-white/10 rounded-lg text-white text-center text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-1 py-1 bg-black/60 border border-white/10 rounded-lg text-white text-center text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full px-1 py-1 bg-black/80 border border-white/10 rounded-lg text-white text-center text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                            >
                              <option value="prs">prs</option>
                              <option value="pcs">pcs</option>
                              <option value="box">box</option>
                              <option value="set">set</option>
                              <option value="mtr">mtr</option>
                              <option value="units">units</option>
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_rate}
                              onChange={(e) => handleItemChange(idx, 'unit_rate', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-white text-right text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-gray-300 text-xs">
                            ₹{item.amount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-gray-400 text-[11px]">
                            ₹{item.cgst.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-gray-400 text-[11px]">
                            ₹{item.sgst.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-amber-300 text-xs">
                            ₹{item.total.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              disabled={items.length <= 1}
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 rounded-lg text-gray-500 hover:text-rose-400 disabled:opacity-20 transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Refrens Add Line Button */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-2xl text-purple-300 hover:text-white hover:bg-purple-500/10 transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>+ Add New Line Item</span>
                </button>
              </div>

              {/* ── 6. Bottom Columns: Bank / UPI / Terms (Left) & Totals (Right) ─ */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">

                {/* LEFT COLUMN: BANK, UPI & TERMS (7 cols) */}
                <div className="md:col-span-7 space-y-4">

                  {/* Bank Account Details Card */}
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Show Bank Account Details (NEFT / IMPS)</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">Active Primary</span>
                    </div>
                    <div className="text-xs space-y-1 text-gray-300">
                      <div className="font-bold text-white">MURUGAN ENTERPRISES</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>Bank: <strong className="text-white">State Bank of India</strong></div>
                        <div>Acc No: <strong className="text-white font-mono">44909857955</strong></div>
                        <div>IFSC: <strong className="text-white font-mono">SBIN0002189</strong></div>
                        <div>Branch: <strong className="text-white">Alwarkurichi</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* UPI Details Card */}
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                        <span>UPI Payment Address</span>
                      </span>
                      <span className="text-[10px] text-purple-300">GPay, PhonePe, Paytm</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Merchant VPA:</span>
                      <span className="font-mono font-bold text-amber-300 px-2 py-0.5 bg-black/60 rounded-md border border-white/10">
                        9025268869@sbi
                      </span>
                    </div>
                  </div>

                  {/* Terms and Conditions Card (Matching Refrens Screenshot) */}
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2.5">
                    <div className="border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-black text-gray-300 uppercase tracking-wider border-b-2 border-dashed border-amber-400/40 inline-block pb-0.5">
                        Terms and Conditions
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[10.5px] text-gray-300 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-400 font-mono">01</span>
                        <span>Delivery charges are additional and will be charged as per distance and logistics.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-400 font-mono">02</span>
                        <span>50% of the document value must be paid in advance before dispatch of goods.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-400 font-mono">03</span>
                        <span>The remaining 50% balance is payable at the time of delivery / before unloading.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-400 font-mono">04</span>
                        <span>Goods will be dispatched only after receipt of advance payment.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-amber-400 font-mono">05</span>
                        <span>Any delay in payment may attract delivery hold or extra logistics charges.</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: FINANCIAL TOTALS BREAKDOWN (5 cols) */}
                <div className="md:col-span-5 bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Amount (Subtotal)</span>
                      <span className="font-mono font-bold text-white text-sm">{formatINR(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-400 text-[11px]">
                      <span>GST Breakdown</span>
                      <span className="font-mono text-gray-300">CGST {formatINR(totalCgst)} + SGST {formatINR(totalSgst)}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-400 pt-1 border-t border-white/5">
                      <span>Discounts (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        placeholder="0"
                        className="w-28 px-2 py-1 bg-black/80 border border-white/10 rounded-lg text-right font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400 text-xs"
                      />
                    </div>

                    <div className="flex justify-between items-center text-gray-400">
                      <span>Extra Charges (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={extraCharges}
                        onChange={(e) => setExtraCharges(e.target.value)}
                        placeholder="0"
                        className="w-28 px-2 py-1 bg-black/80 border border-white/10 rounded-lg text-right font-mono text-white focus:outline-none focus:border-amber-400 text-xs"
                      />
                    </div>

                    <div className="flex justify-between items-center text-gray-400">
                      <span>Delivery Charges (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={deliveryCharges}
                        onChange={(e) => setDeliveryCharges(e.target.value)}
                        placeholder="0"
                        className="w-28 px-2 py-1 bg-black/80 border border-white/10 rounded-lg text-right font-mono text-white focus:outline-none focus:border-amber-400 text-xs"
                      />
                    </div>

                    <div className="flex justify-between items-center text-gray-400 text-[10px]">
                      <span>Round Up / Adjustment</span>
                      <span className="font-mono text-gray-400">{roundUpVal < 0 ? `-₹${roundUpFormatted}` : `₹${roundUpFormatted}`}</span>
                    </div>

                    {/* BIG TOTAL BOX */}
                    <div className="pt-3 border-t border-white/15">
                      <div className="flex justify-between items-center bg-gradient-to-r from-amber-400/10 to-yellow-500/10 border-2 border-amber-400/40 p-3.5 rounded-2xl shadow-inner">
                        <span className="font-black text-xs text-amber-300 uppercase tracking-wider">Total (INR)</span>
                        <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
                          {formatINR(grandTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Total in words box */}
                    <div className="p-2.5 bg-black/50 border border-white/5 rounded-xl space-y-0.5">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total in Words</div>
                      <div className="text-[11px] font-bold text-gray-300 italic leading-snug">
                        {numberToWordsIndian(grandTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Bottom Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveDocument}
                      disabled={saving}
                      className={`w-full py-3 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                        isQuoteType ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20' :
                        isProformaType ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20' :
                        'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
                      }`}
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>{saving ? 'Saving...' : `Save & Confirm ${isQuoteType ? 'Quotation' : isProformaType ? 'Proforma' : 'Tax Invoice'}`}</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              MODE 2: EXACT PRINTABLE A4 COMMERCIAL OUTPUT
             ════════════════════════════════════════════════════════════════════ */}
          {previewTab && (
            <div
              ref={printRef}
              id="printable-invoice"
              className="w-full max-w-[850px] bg-white text-[#1e293b] shadow-2xl p-8 sm:p-12 relative text-[11px] leading-relaxed font-sans border border-slate-200 min-h-[1100px] flex flex-col justify-between"
              style={{ color: '#1e293b', backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              {/* Background Watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.09] overflow-hidden z-0 select-none"
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
                    <h1 className="text-3xl font-light tracking-tight text-[#1e293b] uppercase">
                      {docTypeTitle}
                    </h1>
                  </div>
                </div>

                {/* 2. Details Grid */}
                <div className="grid grid-cols-12 gap-6 text-[11px] leading-snug">
                  <div className="col-span-4 space-y-0.5">
                    <p className="text-[10px] text-slate-500 mb-1">{isQuoteType ? "Quotation From" : "Billed By"}</p>
                    <p className="font-bold text-[#0f172a] text-xs">MURUGAN ENTERPRISES</p>
                    <p className="text-slate-600">36/4, Ambasamudram to Tenkasi main road, ALWARKURICHI,</p>
                    <p className="text-slate-600">Tamil Nadu, India - 627412</p>
                    <p className="text-slate-600 pt-1">GSTIN: <span className="text-[#0f172a]">33KRQPS8169P1ZE</span></p>
                    <p className="text-slate-600">PAN: <span className="text-[#0f172a]">KRQPS8169P</span></p>
                    <p className="text-slate-600 pt-1">Phone: +91 90252 68869</p>
                  </div>

                  <div className="col-span-4 space-y-0.5">
                    <p className="text-[10px] text-slate-500 mb-1">{isQuoteType ? "Quotation For" : "Billed To"}</p>
                    <p className="font-bold text-[#0f172a] text-xs uppercase leading-tight">{schoolName || '—'}</p>
                    <div className="text-slate-600 uppercase whitespace-pre-line text-[10.5px]">{address || '—'}</div>
                    <p className="text-slate-600 text-[10.5px]">{district || 'Tamil Nadu, India'}</p>
                    <p className="text-slate-600 pt-1">Contact: {contactPerson || '—'} {phone ? `(${phone})` : ''}</p>
                  </div>

                  <div className="col-span-4 space-y-1 text-right">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isQuoteType ? "Quotation No:" : "Invoice No:"}</span>
                      <span className="text-[#0f172a] font-medium">{docNumber || 'NEW'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="text-[#0f172a] font-medium">{docDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isQuoteType ? "Valid Till:" : "Due Date:"}</span>
                      <span className="text-[#0f172a] font-medium">{dueDate}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Canvasser:</span>
                      <span className="text-[#0f172a] font-bold">{canvasserName || 'Canvasser'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Items Table */}
                <table className="w-full text-left border-collapse border border-slate-300 text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 text-[#0f172a] font-semibold border-b border-slate-300">
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-300">#</th>
                      <th className="py-2 px-3 border-r border-slate-300">Item Name</th>
                      <th className="py-2 px-2 text-center w-16 border-r border-slate-300">Size</th>
                      <th className="py-2 px-2 text-center w-16 border-r border-slate-300">HSN</th>
                      <th className="py-2 px-2 text-center w-14 border-r border-slate-300">GST %</th>
                      <th className="py-2 px-2 text-center w-14 border-r border-slate-300">Qty</th>
                      <th className="py-2 px-2 text-right w-18 border-r border-slate-300">Rate</th>
                      <th className="py-2 px-2 text-right w-20 border-r border-slate-300">Amount</th>
                      <th className="py-2 px-3 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {calculatedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 text-center border-r border-slate-300 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-300 font-medium text-[#0f172a]">{item.name || 'Custom Item'}</td>
                        <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">{item.size || '-'}</td>
                        <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">{item.hsn || '-'}</td>
                        <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">{item.gst_rate}%</td>
                        <td className="py-2 px-2 text-center border-r border-slate-300 font-mono font-medium">{item.quantity} {item.unit}</td>
                        <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">{formatINR(item.unit_rate)}</td>
                        <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">{formatINR(item.amount)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#0f172a]">{formatINR(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 4. Bottom Calculations Grid */}
                <div className="grid grid-cols-12 gap-6 pt-2">
                  <div className="col-span-7 space-y-2 text-[10px] text-slate-600">
                    <p className="font-bold text-[#0f172a]">Bank Details:</p>
                    <p>State Bank of India • Acc: 44909857955 • IFSC: SBIN0002189 • Alwarkurichi Branch</p>
                    <p className="pt-2 font-bold text-[#0f172a]">Terms & Conditions:</p>
                    <p>01 Delivery charges additional • 02 50% advance before dispatch • 03 50% balance before delivery.</p>
                  </div>

                  <div className="col-span-5 space-y-1.5 text-right font-mono text-[10.5px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST:</span>
                      <span>{formatINR(totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST:</span>
                      <span>{formatINR(totalSgst)}</span>
                    </div>
                    {parsedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-{formatINR(parsedDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Round Up:</span>
                      <span>{roundUpVal < 0 ? `-₹${roundUpFormatted}` : `₹${roundUpFormatted}`}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg mt-2">
                      <span>Grand Total:</span>
                      <span>{formatINR(grandTotal)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Footer */}
              <div className="pt-8 text-center text-[9px] text-slate-400 relative z-10 border-t border-slate-200">
                <p>This is an electronically generated document issued by Murugan Enterprises.</p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
