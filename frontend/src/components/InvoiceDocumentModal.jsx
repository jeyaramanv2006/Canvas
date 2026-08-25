import React, { useState, useEffect } from 'react';
import { mockApi } from '../mockApi';

export default function InvoiceDocumentModal({
  isOpen,
  onClose,
  type = 'quote', // 'quote' | 'invoice'
  mode = 'view', // 'view' | 'create'
  initialData = null,
  visitData = null,
  currentUser = null,
  onSaveSuccess
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Document Form State
  const [schoolName, setSchoolName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [gstPercent, setGstPercent] = useState(18);

  // Line items state
  const [items, setItems] = useState([
    { product: '', description: '', qty: 1, rate: 0, amount: 0 }
  ]);

  // Read-only view object
  const [docData, setDocData] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'create') {
      // Auto fill if visitData provided
      if (visitData) {
        setSchoolName(visitData.school_name || '');
        setContactPerson(visitData.contact_person || '');
        setPhone(visitData.phone || '');
        setDistrict(visitData.district || '');

        // Auto populate line items based on product_interests
        if (Array.isArray(visitData.product_interests) && visitData.product_interests.length > 0) {
          const initialItems = visitData.product_interests.map(pName => {
            const matchedP = products.find(p => p.name.toLowerCase() === pName.toLowerCase());
            const rate = matchedP ? matchedP.unit_price : 100;
            const qty = visitData.student_strength || 100;
            return {
              product: pName,
              description: matchedP ? matchedP.description : `${pName} for school`,
              qty: qty,
              rate: rate,
              amount: qty * rate
            };
          });
          setItems(initialItems);
        } else {
          setItems([{ product: 'Uniforms', description: 'School Uniform Set', qty: 100, rate: 480, amount: 48000 }]);
        }
      } else if (initialData) {
        setSchoolName(initialData.school_name || '');
        setContactPerson(initialData.contact_person || '');
        setPhone(initialData.phone || '');
        setDistrict(initialData.district || '');
        if (initialData.items && initialData.items.length > 0) {
          setItems(initialData.items);
        }
      } else {
        setSchoolName('');
        setContactPerson('');
        setPhone('');
        setDistrict('');
        setItems([{ product: '', description: '', qty: 1, rate: 0, amount: 0 }]);
      }
    } else {
      // View mode
      setDocData(initialData);
    }
  }, [isOpen, mode, visitData, initialData, products]);

  const fetchProducts = async () => {
    try {
      const pList = await mockApi.getProducts();
      setProducts(pList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSelect = (index, prodName) => {
    const matched = products.find(p => p.name === prodName);
    const updated = [...items];
    updated[index].product = prodName;
    if (matched) {
      updated[index].description = matched.description;
      updated[index].rate = matched.unit_price;
      updated[index].amount = updated[index].qty * matched.unit_price;
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'qty' || field === 'rate') {
      const q = Number(updated[index].qty || 0);
      const r = Number(updated[index].rate || 0);
      updated[index].amount = q * r;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { product: '', description: '', qty: 1, rate: 0, amount: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const calculateTax = () => {
    return Math.round((calculateSubtotal() * gstPercent) / 100);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!schoolName.trim()) {
      setError('Please provide a School or Customer Name.');
      return;
    }

    if (items.some(i => !i.product || i.qty <= 0)) {
      setError('Please ensure all items have a selected product and valid quantity.');
      return;
    }

    setLoading(true);
    try {
      const subtotal = calculateSubtotal();
      const tax_amount = calculateTax();
      const grand_total = calculateGrandTotal();

      const payload = {
        school_name: schoolName,
        contact_person: contactPerson,
        phone: phone,
        district: district,
        date: date,
        items: items,
        subtotal: subtotal,
        gst_percent: gstPercent,
        tax_amount: tax_amount,
        grand_total: grand_total,
        notes: notes,
        visit_id: visitData ? visitData.id : (initialData ? initialData.visit_id : null),
        quotation_id: initialData && type === 'invoice' ? initialData.id : null
      };

      if (type === 'quote') {
        payload.valid_until = dueDate;
        payload.status = 'Sent';
        await mockApi.addQuotation(payload, currentUser?.id || 1, currentUser?.name || 'User');
      } else {
        payload.due_date = dueDate;
        payload.paid_amount = 0;
        payload.pending_balance = grand_total;
        payload.status = 'Unpaid';
        await mockApi.addInvoice(payload, currentUser?.id || 1, currentUser?.name || 'User');
      }

      setLoading(false);
      onClose();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to save document.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-murugan-card border border-murugan-border rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-murugan-border bg-murugan-dark/50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-murugan-accent/20 text-murugan-accent flex items-center justify-center font-bold text-xl">
              {type === 'quote' ? 'Q' : 'INV'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'create' 
                  ? (type === 'quote' ? 'Create Sales Quotation' : 'Generate Tax Invoice')
                  : (type === 'quote' ? `Quotation #${docData?.id}` : `Tax Invoice #${docData?.id}`)}
              </h2>
              <p className="text-xs text-gray-400">Refrens-Integrated Document System</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {mode === 'view' && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-gray-700 transition"
              >
                <span>🖨️ Print / PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        {mode === 'create' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Customer & Document Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-murugan-dark/40 p-4 rounded-xl border border-murugan-border">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">School / Customer Name *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. St. Xavier Matriculation School"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">District / Location</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Mr. Ramesh (Principal)"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Document Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  {type === 'quote' ? 'Valid Until Date' : 'Payment Due Date'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-murugan-accent uppercase tracking-wider">
                  Order Line Items
                </h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-3 py-1 bg-murugan-accent/20 hover:bg-murugan-accent/30 text-murugan-accent rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <span>+ Add Item</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-murugan-border">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900/80 text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3 w-1/4">Product</th>
                      <th className="p-3 w-1/3">Description</th>
                      <th className="p-3 w-20 text-right">Qty</th>
                      <th className="p-3 w-24 text-right">Rate (₹)</th>
                      <th className="p-3 w-28 text-right">Amount (₹)</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-900/30">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/40">
                        <td className="p-2">
                          <select
                            value={item.product}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-murugan-accent"
                          >
                            <option value="">Select Product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.name}>{p.name} (₹{p.unit_price}/{p.unit})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Specification / Details"
                            className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-murugan-accent"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs text-right focus:outline-none focus:border-murugan-accent"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs text-right focus:outline-none focus:border-murugan-accent"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold text-white">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="text-red-400 hover:text-red-300 font-bold text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-2">
              <div className="w-full md:w-1/2 space-y-2">
                <label className="block text-xs font-medium text-gray-300">Notes & Payment Terms</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 30% advance on order confirmation, balance before dispatch."
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div className="w-full md:w-5/12 bg-gray-900/90 p-4 rounded-xl border border-gray-800 space-y-2 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-white">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <div className="flex items-center space-x-1">
                    <span>GST Rate:</span>
                    <select
                      value={gstPercent}
                      onChange={(e) => setGstPercent(Number(e.target.value))}
                      className="bg-gray-800 border border-gray-700 rounded px-1 text-xs text-white"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  </div>
                  <span className="font-semibold text-white">₹{calculateTax().toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-gray-800 pt-2 flex justify-between text-sm font-bold text-murugan-accent">
                  <span>Grand Total:</span>
                  <span>₹{calculateGrandTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-murugan-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-murugan-accent hover:bg-emerald-400 text-black rounded-xl text-sm font-bold shadow-lg transition flex items-center space-x-2"
              >
                {loading ? 'Saving...' : (type === 'quote' ? 'Issue Quotation' : 'Issue Tax Invoice')}
              </button>
            </div>
          </form>
        ) : (
          /* Professional Refrens-Style Printable View */
          <div className="p-8 space-y-6 bg-white text-gray-900 rounded-b-2xl printable-document">
            
            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-emerald-700 tracking-tight">MURUGAN ENTERPRISES</h1>
                <p className="text-xs text-gray-500 font-medium">School Apparel & Accessories Manufacturer</p>
                <p className="text-xs text-gray-500 mt-1">142 Industrial Estate, Peelamedu, Coimbatore - 641004</p>
                <p className="text-xs text-gray-500">GSTIN: 33ABCDE1234F1Z5 | Phone: +91 98765 43210</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {type === 'quote' ? 'Sales Quotation' : 'Tax Invoice'}
                </span>
                <p className="text-lg font-bold text-gray-900 mt-2">#{docData?.id}</p>
                <p className="text-xs text-gray-500">Date: {docData?.date}</p>
                <p className="text-xs text-gray-500">
                  {type === 'quote' ? `Valid Until: ${docData?.valid_until}` : `Due Date: ${docData?.due_date}`}
                </p>
              </div>
            </div>

            {/* Billed To / Shipping Address */}
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Billed To (Customer):</p>
                <p className="font-bold text-gray-900 text-sm">{docData?.school_name}</p>
                <p className="text-gray-600 mt-0.5">Contact: {docData?.contact_person || 'N/A'}</p>
                <p className="text-gray-600">Phone: {docData?.phone || 'N/A'}</p>
                <p className="text-gray-600">District: {docData?.district || 'Tamil Nadu'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Assigned Sales Canvasser:</p>
                <p className="font-bold text-gray-800 text-xs">{docData?.canvasser_name || 'Murugan Sales Team'}</p>
                <p className="text-gray-500 mt-1">Status: <span className="font-bold text-emerald-600 uppercase">{docData?.status}</span></p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-t border-gray-300">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item & Description</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {docData?.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900">{item.product}</p>
                        <p className="text-[11px] text-gray-500">{item.description}</p>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-medium">₹{Number(item.rate).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="flex justify-between items-start pt-4 border-t border-gray-200 text-xs">
              <div className="w-1/2 space-y-2">
                <p className="font-bold text-gray-700">Terms & Payment Instructions:</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 text-[11px] leading-relaxed">
                  {docData?.notes || 'Payment terms: 30% advance on order confirmation. Balance payable upon delivery. Account Name: Murugan Enterprises | HDFC Bank A/C: 50200012345678 | IFSC: HDFC0001234'}
                </p>
              </div>

              <div className="w-5/12 space-y-2 text-right">
                <div className="flex justify-between text-gray-600">
                  <span>Sub Total:</span>
                  <span className="font-semibold text-gray-900">₹{Number(docData?.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST ({docData?.gst_percent || 18}%):</span>
                  <span className="font-semibold text-gray-900">₹{Number(docData?.tax_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-800 border-t border-gray-300 pt-2">
                  <span>Grand Total:</span>
                  <span>₹{Number(docData?.grand_total || 0).toLocaleString('en-IN')}</span>
                </div>

                {type === 'invoice' && (
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 mt-2 space-y-1">
                    <div className="flex justify-between text-emerald-700">
                      <span>Paid Amount:</span>
                      <span className="font-bold">₹{Number(docData?.paid_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-amber-700 font-bold border-t border-emerald-200 pt-1">
                      <span>Balance Due:</span>
                      <span>₹{Number(docData?.pending_balance || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Authorised Signatory Footer */}
            <div className="pt-8 border-t border-gray-200 flex justify-between items-end text-xs text-gray-500">
              <p>Thank you for choosing Murugan Enterprises!</p>
              <div className="text-center">
                <div className="h-10 border-b border-gray-400 w-40 mb-1"></div>
                <p className="font-bold text-gray-800">Authorised Signatory</p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
