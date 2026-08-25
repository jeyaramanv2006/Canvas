import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, Target, FileText, Download, Eye, Sparkles, 
  TrendingUp, Users, CheckCircle2, ArrowRight, Share2, Award
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';

export default function MarketingCampaignsModule({ currentUser }) {
  const [campaigns, setCampaigns] = useState([]);
  const [collateral, setCollateral] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'collateral'
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, colList] = await Promise.all([
        mockApi.getMarketingCampaigns(),
        mockApi.getMarketingCollateral()
      ]);
      setCampaigns(cList);
      setCollateral(colList);
    } catch (e) {
      console.error("Failed to load marketing data", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-murugan-card border border-white/10 p-4 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Marketing & Growth Hub</h2>
            <p className="text-xs text-gray-400">Campaign analytics, lead funnels & field sales collateral</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'campaigns' 
                ? "bg-murugan-accent text-black shadow-md" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Active Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('collateral')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'collateral' 
                ? "bg-murugan-accent text-black shadow-md" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Field Collateral ({collateral.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading marketing hub...</div>
      ) : activeTab === 'campaigns' ? (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-murugan-card p-4 rounded-2xl border border-white/10">
              <span className="text-xs text-gray-400 font-medium">Total Campaign Reach</span>
              <p className="text-2xl font-extrabold text-white mt-1">40.1K</p>
              <span className="text-[11px] text-purple-400 font-semibold">Across TN Districts</span>
            </div>
            <div className="bg-murugan-card p-4 rounded-2xl border border-white/10">
              <span className="text-xs text-gray-400 font-medium">Total Inbound Leads</span>
              <p className="text-2xl font-extrabold text-white mt-1">148</p>
              <span className="text-[11px] text-emerald-400 font-semibold">+38% vs last month</span>
            </div>
            <div className="bg-murugan-card p-4 rounded-2xl border border-white/10">
              <span className="text-xs text-gray-400 font-medium">Overall Conversion</span>
              <p className="text-2xl font-extrabold text-white mt-1">25.0%</p>
              <span className="text-[11px] text-murugan-accent font-semibold">Lead to Order</span>
            </div>
            <div className="bg-murugan-card p-4 rounded-2xl border border-white/10">
              <span className="text-xs text-gray-400 font-medium">Blended Campaign ROI</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">5.1x</p>
              <span className="text-[11px] text-gray-400">Marketing Return</span>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {campaigns.map(cmp => (
              <motion.div
                key={cmp.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-murugan-card border border-white/10 hover:border-white/20 p-5 rounded-3xl shadow-lg space-y-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-murugan-accent font-bold">{cmp.id}</span>
                      <h3 className="text-base font-bold text-white">{cmp.name}</h3>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        cmp.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400'
                      )}>
                        {cmp.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Target: <strong className="text-gray-200">{cmp.target}</strong></p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-right">
                      <span className="text-gray-500 block text-[10px]">ROI Multiple</span>
                      <span className="text-emerald-400 font-extrabold text-sm">{cmp.roi}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">Audience Reach</span>
                    <span className="text-white font-bold text-sm mt-0.5 block">{cmp.reach.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">Leads Generated</span>
                    <span className="text-white font-bold text-sm mt-0.5 block">{cmp.leads} Leads</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">Won Orders</span>
                    <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{cmp.conversions} Closures</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">Channels</span>
                    <span className="text-gray-300 font-medium text-xs mt-0.5 truncate block">{cmp.channels.join(', ')}</span>
                  </div>
                </div>

                {/* Collateral attached to campaign */}
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Recommended Field Collateral</span>
                    <p className="text-gray-200 font-medium mt-0.5">{cmp.keyCollateral.join(' • ')}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('collateral');
                      showToast("Navigated to Collateral repository");
                    }}
                    className="px-3 py-1.5 bg-murugan-accent text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-yellow-400 transition-colors whitespace-nowrap"
                  >
                    <span>View Assets</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Collateral Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collateral.map(col => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-murugan-card border border-white/10 hover:border-white/20 p-5 rounded-3xl shadow-lg flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-murugan-accent/10 text-murugan-accent border border-murugan-accent/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{col.category} • {col.format}</span>
                        <h4 className="text-sm font-bold text-white">{col.title}</h4>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{col.size}</span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <p className="text-gray-400">
                      Audience: <strong className="text-gray-300">{col.targetAudience}</strong>
                    </p>
                    <p className="text-gray-400">
                      Best Used For: <span className="text-murugan-accent font-semibold">{col.recommendedFor}</span>
                    </p>
                    <p className="text-[11px] text-gray-500">Updated: {col.updatedAt}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => showToast(`Opened "${col.title}" preview`)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => showToast(`Downloading ${col.title}...`)}
                    className="flex-1 px-3 py-2 bg-murugan-accent text-black hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-murugan-accent/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </div>
              </motion.div>
            ))}
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
