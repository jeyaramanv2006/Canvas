import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Plus,
  Trash2,
  Eye,
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
  AlertCircle
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';
import { searchMasterSchoolsLocal } from '../data/masterSchools';

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
  const schoolDropdownRef = useRef(null);
  const data = initialData || documentData || visitData;

  const isQuoteType = type.toLowerCase().includes('quote');

  // Form State
  const [formMode, setFormMode] = useState(mode);
  const [previewTab, setPreviewTab] = useState(mode === 'view');
  const [saving, setSaving] = useState(false);
  const [docError, setDocError] = useState(null);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  // Document Type Header
  const [docTypeTitle, setDocTypeTitle] = useState(
    isQuoteType ? "QUOTATION" : (data?.doc_type || "Proforma Invoice")
  );

  // Form fields (No hardcoded example names)
  const [docNumber, setDocNumber] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [docDate, setDocDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [countryOfSupply, setCountryOfSupply] = useState('India');
  const [placeOfSupply, setPlaceOfSupply] = useState('Tamil Nadu (33)');
  const [extraCharges, setExtraCharges] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [canvasserName, setCanvasserName] = useState('');
  const [canvasserId, setCanvasserId] = useState('');

  // Dynamic Line Items
  const [items, setItems] = useState([]);

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
        setDocTypeTitle(isQuoteType ? "QUOTATION" : (data.doc_type || (type.toLowerCase().includes('tax') ? "Tax Invoice" : "Proforma Invoice")));
        setDocNumber(data.invoice_number || data.quotation_number || data.id || (isQuoteType ? `QTN-${Math.floor(1000 + Math.random() * 9000)}` : `INV-${Math.floor(1000 + Math.random() * 9000)}`));
        setSchoolName(data.school_name || '');
        setAddress(data.address || data.area || '');
        setDistrict(data.district || 'Tamil Nadu, India');
        setContactPerson(data.contact_person || '');
        setPhone(data.phone || '');
        setDocDate(formatDisplayDate(data.date || data.invoice_date || data.quotation_date || new Date()));
        setDueDate(formatDisplayDate(data.due_date || data.valid_until || new Date(Date.now() + 86400000 * 15)));
        setCountryOfSupply(data.country_of_supply || "India");
        setPlaceOfSupply(data.place_of_supply || "Tamil Nadu (33)");
        setExtraCharges(Number(data.extra_charges !== undefined ? data.extra_charges : 0));
        setDeliveryCharges(Number(data.delivery_charges !== undefined ? data.delivery_charges : 0));
        setDiscountAmount(Number(data.discount_amount) || 0);
        setCanvasserName(data.canvasser_name || currentUser?.name || 'Canvasser');
        setCanvasserId(data.canvasser_id || currentUser?.id || '');

        // Normalizing items
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items.map(i => ({
            name: i.name || i.item_name || i.product || (i.description ? `${i.product ? i.product + ' ' : ''}${i.description}` : 'Custom Item'),
            size: i.size || '-',
            hsn: i.hsn || (i.hsn_code || ''),
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
              hsn: item.toLowerCase().includes('sock') ? '611595' : (item.toLowerCase().includes('shoe') ? '640411' : (item.toLowerCase().includes('belt') ? '392690' : (item.toLowerCase().includes('tie') ? '621510' : ''))),
              gst_rate: 5,
              quantity: Number(data.student_strength) || 100,
              unit: item.toLowerCase().includes('shoe') ? 'box' : 'prs',
              unit_rate: item.toLowerCase().includes('shoe') ? 345 : 48
            })));
          } else {
            setItems([{ name: 'Custom Product Item', size: '-', hsn: '', gst_rate: 5, quantity: 100, unit: 'prs', unit_rate: 50 }]);
          }
        } else {
          // Default initial empty clean item
          setItems([
            { name: '', size: '-', hsn: '', gst_rate: 5, quantity: 1, unit: isQuoteType ? '' : 'prs', unit_rate: 0 }
          ]);
        }
      } else {
        // Brand new document
        const isQ = isQuoteType;
        setDocTypeTitle(isQ ? "QUOTATION" : "Proforma Invoice");
        setDocNumber(isQ ? `QTN-${Math.floor(1000 + Math.random() * 9000)}` : `INV-${Math.floor(1000 + Math.random() * 9000)}`);
        setSchoolName('');
        setAddress('');
        setDistrict('Tamil Nadu, India');
        setContactPerson('');
        setPhone('');
        setDocDate(formatDisplayDate(new Date()));
        setDueDate(formatDisplayDate(new Date(Date.now() + 86400000 * 15)));
        setCountryOfSupply("India");
        setPlaceOfSupply("Tamil Nadu (33)");
        setExtraCharges(0);
        setDeliveryCharges(0);
        setDiscountAmount(0);
        setCanvasserName(currentUser?.name || 'Canvasser');
        setCanvasserId(currentUser?.id || 1);
        setItems([
          { name: '', size: '-', hsn: '', gst_rate: 5, quantity: 1, unit: isQ ? '' : 'prs', unit_rate: 0 }
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
    setDocError(null);
    if (!schoolName.trim()) {
      setDocError("Please enter the School / Institution Name");
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
        canvasser_name: canvasserName || currentUser?.name || 'Canvasser',
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
      setDocError(err.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  // High-Fidelity Isolated Print: Injects all styles to guarantee exact identical layout without collapsing
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

    // Grab all stylesheet and style links from head
    let styleElements = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      styleElements += node.outerHTML + '\n';
    });

    const origin = window.location.origin;

    pri.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTypeTitle} - ${docNumber}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          ${styleElements}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important; /* Strips standard browser URL, timestamp & headers */
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
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #1e293b !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
              font-size: 11px !important;
              line-height: 1.4 !important;
              overflow: hidden !important;
            }
            #printable-invoice {
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              padding: 16mm 18mm 14mm 18mm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              position: relative !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              font-size: 10.5px !important;
            }
            .bg-\\[\\#38bdf8\\] {
              background-color: #38bdf8 !important;
              color: #ffffff !important;
            }
          </style>
        </head>
        <body>
          ${printableEl.outerHTML}
        </body>
      </html>
    `);
    pri.document.close();

    // Ensure all images are fully loaded before printing
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

      {/* Outer Shell */}
      <div className="bg-[#121319] border border-white/20 rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900">

        {/* Top Control Bar (Screen Only - Hidden in Print) */}
        <div className="p-4 bg-slate-950 border-b border-white/10 flex flex-wrap items-center justify-between text-white gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
              ME
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  {docTypeTitle} {previewTab ? "Preview & Print" : "Editor"}
                </h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  {docNumber || 'NEW'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Murugan Enterprises Standard Template • Matching Official Format</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formMode === 'create' && (
              <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer",
                    !previewTab ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" : "text-gray-300 hover:text-white"
                  )}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Parameters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer",
                    previewTab ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" : "text-gray-300 hover:text-white"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Exact Preview</span>
                </button>
              </div>
            )}

            {previewTab && (
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            )}

            {formMode === 'create' && (
              <button
                onClick={handleSaveDocument}
                disabled={saving}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : `Save ${isQuoteType ? 'Quotation' : 'Invoice'}`}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-900/90 flex justify-center">

          {/* TAB 1: PARAMETERS FORM EDITOR */}
          {!previewTab && formMode === 'create' && (
            <div className="w-full max-w-4xl bg-gradient-to-b from-[#181924] to-[#12131a] border border-white/15 rounded-3xl p-5 sm:p-7 text-white space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{docTypeTitle} Parameters & Line Items</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">All details entered here map directly to the official printed commercial format</p>
                </div>
                <div className="text-right bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-2xl">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Document Total</span>
                  <span className="text-sm font-black text-amber-400 font-mono">₹{grandTotal.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              {/* In-Modal Error Alert Banner */}
              {docError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-400 text-xs shadow-lg backdrop-blur-md">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{docError}</div>
                  <button 
                    type="button" 
                    onClick={() => setDocError(null)} 
                    className="text-red-400/60 hover:text-red-400 transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Document Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Document Title</label>
                  <input
                    type="text"
                    value={docTypeTitle}
                    onChange={(e) => setDocTypeTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">{isQuoteType ? 'Quotation Number' : 'Invoice Number'}</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Enter document number"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Searchable School Dropdown with Master DB Autofill */}
                <div className="relative" ref={schoolDropdownRef}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-gray-300 font-bold">School / Institution (Billed To) *</label>
                    {matchingSchools.length > 0 && showSchoolDropdown && (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {matchingSchools.length} in Master DB
                      </span>
                    )}
                  </div>
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
                      placeholder="Type school name to search Master DB..."
                      className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-bold pr-8"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {showSchoolDropdown && matchingSchools.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#14151c] border border-amber-500/30 rounded-2xl shadow-2xl z-[100] max-h-56 overflow-y-auto divide-y divide-white/5 backdrop-blur-xl">
                      <div className="p-2 bg-amber-500/10 border-b border-white/5 flex items-center justify-between text-[10px] text-amber-300 font-bold px-3">
                        <span>⚡ AUTOFILL FROM MASTER DB</span>
                        <span className="text-gray-400 font-normal">Click to fill details</span>
                      </div>
                      {matchingSchools.map(school => (
                        <div
                          key={school.id}
                          onMouseDown={() => handleSelectMasterSchool(school)}
                          className="p-2.5 px-3 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-white text-xs flex items-center gap-1.5">
                              {school.school_name}
                              {school.board && (
                                <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 rounded font-mono">
                                  {school.board}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {school.district} {school.area ? `• ${school.area}` : ''} {school.block_or_cluster ? `(${school.block_or_cluster})` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 shrink-0 ml-2">{school.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Billing Street Address</label>
                  <textarea
                    rows="2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street, road, or area address"
                    className="w-full px-3.5 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">District, State & PIN</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="District, State, PIN Code"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">{isQuoteType ? 'Quote Date' : 'Invoice Date'}</label>
                    <input
                      type="text"
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      placeholder="e.g. Aug 24, 2026"
                      className="w-full px-2.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">{isQuoteType ? 'Valid Till' : 'Due Date'}</label>
                    <input
                      type="text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="e.g. Sep 08, 2026"
                      className="w-full px-2.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Principal / Admin Name"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-[11px] text-amber-300 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>All fields can be manually adjusted anytime.</span>
                  </div>
                </div>
              </div>

              {/* Line Items Editor with Dedicated Column Headers including HSN/SAC */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Product Line Items ({items.length})</h4>
                    <p className="text-[11px] text-gray-400">All fields (including HSN, Size, GST Rate, and Unit) are fully editable</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                {/* Table Header Row */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Item Description</div>
                  <div className="col-span-2">HSN Code</div>
                  <div className="col-span-1 text-center">Size</div>
                  <div className="col-span-1 text-center">GST %</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-1 text-right">Rate (₹)</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Line Item Rows */}
                <div className="space-y-2.5">
                  {items.map((item, idx) => {
                    const itemAmt = (Number(item.quantity) || 0) * (Number(item.unit_rate) || 0);
                    return (
                      <div key={idx} className="p-3 bg-black/40 border border-white/10 hover:border-amber-500/30 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs transition-all">
                        <div className="sm:col-span-1 text-left sm:text-center font-mono font-bold text-amber-400">
                          #{idx + 1}
                        </div>
                        
                        {/* Item Description */}
                        <div className="sm:col-span-4 space-y-1">
                          <span className="sm:hidden text-[10px] text-gray-400 block">Item Description:</span>
                          <input
                            type="text"
                            required
                            placeholder="Item name / description"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-medium"
                          />
                        </div>

                        {/* HSN Code Input */}
                        <div className="sm:col-span-2 space-y-1">
                          <span className="sm:hidden text-[10px] text-gray-400 block">HSN Code:</span>
                          <input
                            type="text"
                            placeholder="HSN Code"
                            value={item.hsn}
                            onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)}
                            className="w-full px-2.5 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono text-center focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Size */}
                        <div className="sm:col-span-1 space-y-1">
                          <span className="sm:hidden text-[10px] text-gray-400 block">Size:</span>
                          <input
                            type="text"
                            placeholder="-"
                            value={item.size}
                            onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                            className="w-full px-2 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs text-center focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* GST Rate */}
                        <div className="sm:col-span-1 space-y-1">
                          <span className="sm:hidden text-[10px] text-gray-400 block">GST %:</span>
                          <input
                            type="number"
                            placeholder="5"
                            value={item.gst_rate}
                            onChange={(e) => handleItemChange(idx, 'gst_rate', Number(e.target.value) || 0)}
                            className="w-full px-1.5 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs text-center font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-1 space-y-1">
                          <span className="sm:hidden text-[10px] text-gray-400 block">Quantity:</span>
                          <input
                            type="number"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono text-right focus:outline-none focus:border-amber-400 font-bold"
                          />
                        </div>

                        {/* Unit Rate */}
                        <div className="sm:col-span-1 space-y-1">
                          <span className="sm:hidden text-[10px] text-gray-400 block">Rate (₹):</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={item.unit_rate}
                            onChange={(e) => handleItemChange(idx, 'unit_rate', e.target.value)}
                            className="w-full px-2 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono text-right focus:outline-none focus:border-amber-400 font-bold text-amber-300"
                          />
                        </div>

                        {/* Delete Action & Mobile Subtotal */}
                        <div className="sm:col-span-1 flex items-center justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          <span className="sm:hidden text-xs font-mono font-bold text-emerald-400">
                            Subtotal: ₹{itemAmt.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItem(idx)}
                            className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20 transition cursor-pointer"
                            title="Delete Line Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Extra Charges (₹)</label>
                  <input
                    type="number"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Delivery Charges (₹)</label>
                  <input
                    type="number"
                    value={deliveryCharges}
                    onChange={(e) => setDeliveryCharges(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Discounts (₹)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none text-emerald-400 focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewTab(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Exact Commercial Output</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXACT MATCHING PRINTABLE COMMERCIAL DOCUMENT */}
          {previewTab && (
            <div
              ref={printRef}
              id="printable-invoice"
              className="w-full max-w-[850px] bg-white text-[#1e293b] shadow-2xl p-8 sm:p-12 relative text-[11px] leading-relaxed font-sans border border-slate-200 min-h-[1100px] flex flex-col justify-between"
              style={{ color: '#1e293b', backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              {/* Center Background Watermark Logo */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.11] overflow-hidden z-0 select-none"
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
                      {schoolName || '—'}
                    </p>
                    <div className="text-slate-600 uppercase whitespace-pre-line text-[10.5px]">
                      {address || '—'}
                    </div>
                    <p className="text-slate-600 text-[10.5px]">
                      {district || 'Tamil Nadu, India'}
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

                {/* 3. Items Table */}
                <div className="pt-2">
                  {!isQuoteType ? (
                    /* Invoice Style Table */
                    <table className="w-full text-left text-[10.5px] border-collapse">
                      <thead>
                        <tr className="bg-[#f1f5f9] text-slate-700 font-normal">
                          <th className="py-2.5 px-2.5 font-medium text-left" style={{ width: '30%' }}>Item</th>
                          <th className="py-2.5 px-2 font-medium text-center" style={{ width: '9%' }}>HSN</th>
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
                              <span>{idx + 1}. {item.name || 'Item'}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 font-mono">{item.hsn || "—"}</td>
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
                    /* Quotation Style Table */
                    <table className="w-full text-left text-[10px] border-collapse border border-slate-700">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-800 font-medium">
                          <th className="p-2 border-r border-slate-700 text-left" style={{ width: '32%' }}>Item</th>
                          <th className="p-2 border-r border-slate-700 text-center" style={{ width: '8%' }}>SIZE</th>
                          <th className="p-2 border-r border-slate-700 text-center" style={{ width: '9%' }}>HSN</th>
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
                              <span>{idx + 1}.  {item.name || 'Item'}</span>
                            </td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-center">{item.size || "-"}</td>
                            <td className="p-1.5 px-2 border-r border-slate-700 text-center text-slate-600 font-mono">{item.hsn || "—"}</td>
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
                          <span className="col-span-8 text-[#0f172a] font-medium">MURUGAN ENTERPRISES</span>
                          <span className="col-span-4 text-slate-500">Account Number</span>
                          <span className="col-span-8 text-[#0f172a] font-mono">44909857955</span>
                          <span className="col-span-4 text-slate-500">IFSC</span>
                          <span className="col-span-8 text-[#0f172a] font-mono">SBIN0002189</span>
                          <span className="col-span-4 text-slate-500">Account Type</span>
                          <span className="col-span-8 text-[#0f172a]">Current</span>
                          <span className="col-span-4 text-slate-500">Bank</span>
                          <span className="col-span-8 text-[#0f172a]">State Bank of India</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-700 leading-normal text-[10px]">
                        <p className="font-semibold text-slate-800 mb-1">Terms and Conditions</p>
                        <p>1. Delivery charges are additional and will be charged as per distance and logistics.</p>
                        <p>2. 70% of the invoice value must be paid in advance before dispatch of goods.</p>
                        <p>3. Goods will be dispatched only after receipt of advance payment.</p>
                        <p>4. The remaining 30% balance is payable at the time of delivery / before unloading.</p>
                        <p>5. Any delay in payment may attract delivery hold or extra charges.</p>
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
                          className="flex justify-between items-center px-4 py-2.5 bg-[#38bdf8] text-white font-medium text-xs mt-2"
                          style={{ backgroundColor: '#38bdf8', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                          <span className="font-normal">Total (INR)</span>
                          <span className="font-bold text-sm">{formatINR(grandTotal)}</span>
                        </div>
                      </div>
                    ) : (
                      /* Quotation Calculation Block */
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
                        {parsedDiscount > 0 && (
                          <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                            <span>Discounts</span>
                            <span className="text-[#0f172a]">{formatINR(parsedDiscount)}</span>
                          </div>
                        )}
                        {parsedExtra > 0 && (
                          <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                            <span>Extra Charges</span>
                            <span className="text-[#0f172a]">{formatINR(parsedExtra)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-1 px-3 border-b border-slate-700 text-slate-700">
                          <span>Round Up</span>
                          <span className="text-[#0f172a]">{roundUpVal < 0 ? `-₹${roundUpFormatted}` : `₹${roundUpFormatted}`}</span>
                        </div>
                        {/* Solid Blue Total Cell */}
                        <div
                          className="flex justify-between items-center py-2 px-3 bg-[#38bdf8] text-white text-xs font-semibold"
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
