import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, Package, FileCheck, CheckCircle2, AlertCircle, 
  MapPin, Phone, Calendar, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';

export default function OperationsModule({ currentUser }) {
  const [activeTab, setActiveTab] = useState('dispatches'); // 'dispatches' | 'inventory' | 'data_entry'
  const [dispatches, setDispatches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadOpsData();
  }, []);

  const loadOpsData = async () => {
    setLoading(true);
    try {
      const [dList, invList] = await Promise.all([
        mockApi.getDispatches(),
        mockApi.getInventoryStock()
      ]);
      setDispatches(dList);
      setInventory(invList);
    } catch (e) {
      console.error("Failed to load operations data", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleUpdateStatus = (id, newStatus) => {
    setDispatches(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    showToast(`Dispatch ${id} marked as ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-murugan-card border border-white/10 p-4 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Operations & Logistics Command</h2>
            <p className="text-xs text-gray-400">Dispatch fulfillment, warehouse inventory & billing verification</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dispatches')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === 'dispatches' ? "bg-murugan-accent text-black shadow-md" : "text-gray-400 hover:text-white"
            )}
          >
            Dispatches & Delivery ({dispatches.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === 'inventory' ? "bg-murugan-accent text-black shadow-md" : "text-gray-400 hover:text-white"
            )}
          >
            Warehouse Stock ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('data_entry')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === 'data_entry' ? "bg-murugan-accent text-black shadow-md" : "text-gray-400 hover:text-white"
            )}
          >
            Data Entry Audit
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading operations module...</div>
      ) : activeTab === 'dispatches' ? (
        /* Dispatches Queue */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dispatches.map(dsp => (
              <motion.div
                key={dsp.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-murugan-card border border-white/10 hover:border-white/20 p-5 rounded-3xl shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{dsp.id}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        dsp.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        dsp.status === 'Out for Delivery' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400'
                      )}>
                        {dsp.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">{dsp.dispatch_date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2">{dsp.school_name}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    {dsp.district}
                  </p>

                  <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 text-xs">
                    <p className="text-gray-300 font-semibold">{dsp.items_summary}</p>
                    <p className="text-[11px] text-gray-500">Ref: {dsp.order_ref}</p>
                    <p className="text-[11px] text-gray-500">Carrier: {dsp.carrier} ({dsp.driver_contact})</p>
                    <p className="text-[11px] text-cyan-400 font-mono">Tracking: {dsp.tracking_no}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  {dsp.status !== 'Delivered' ? (
                    <button
                      onClick={() => handleUpdateStatus(dsp.id, 'Delivered')}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Delivered & Received
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-white/5 border border-white/5 rounded-xl text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivery Confirmed
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : activeTab === 'inventory' ? (
        /* Inventory Tab */
        <div className="bg-murugan-card border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Warehouse Apparel Stocks</h3>
            <p className="text-xs text-gray-400">Live inventory levels, safety stocks, and reorder thresholds</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/40 text-gray-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3">SKU Code</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-right">In Stock</th>
                  <th className="p-3 text-right">Safety Threshold</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-black/20">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{item.id}</td>
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3 text-right font-extrabold text-white">{item.inStock.toLocaleString()} {item.unit}</td>
                    <td className="p-3 text-right text-gray-400">{item.reorderLevel.toLocaleString()} {item.unit}</td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        item.status === 'Optimal' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => showToast(`Stock reconciliation audit logged for ${item.id}`)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-semibold transition"
                      >
                        Audit Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Data Entry Audit Tab */
        <div className="bg-murugan-card border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-murugan-accent/10 text-murugan-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Data Entry & Quality Verification Checklist</h3>
              <p className="text-xs text-gray-400">Daily verification protocol for billing executives and administrative staff</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">1. GSTIN & Tax Rate Verification</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-gray-400">Ensures all newly generated tax invoices use 18% GST and compliant HSN codes.</p>
              <span className="text-[10px] text-emerald-400 font-semibold block">Audit Status: 99.8% Accuracy</span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">2. Field Visit Entry Synchronization</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-gray-400">Checks for missing contact numbers, institution types, and follow-up dates.</p>
              <span className="text-[10px] text-emerald-400 font-semibold block">Audit Status: 99.4% Accuracy</span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">3. Payment Collection Slip Reconciliation</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-gray-400">Matches UPI reference IDs and NEFT UTR numbers against bank settlement statements.</p>
              <span className="text-[10px] text-emerald-400 font-semibold block">Audit Status: 48 Slips Reconciled</span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">4. End-of-Day (EOD) Sync Verification</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-gray-400">Guarantees that all field quotations and dispatches are synced to the cloud database.</p>
              <span className="text-[10px] text-emerald-400 font-semibold block">Audit Status: 100% On-Time</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 z-50">
          <CheckCircle2 className="w-4 h-4" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
