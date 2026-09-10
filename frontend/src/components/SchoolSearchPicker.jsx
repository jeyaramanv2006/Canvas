import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, MapPin, Check, Plus, X, Sparkles } from 'lucide-react';
import { MASTER_SCHOOLS_DATABASE, TAMIL_NADU_DISTRICTS } from '../data/masterSchools';
import { cn } from '../lib/utils';

export default function SchoolSearchPicker({
  selectedSchoolName,
  selectedDistrict,
  selectedInstitutionType,
  isFromMasterDb,
  masterSchoolId,
  onSchoolChange
}) {
  const [query, setQuery] = useState(selectedSchoolName || '');
  const [districtFilter, setDistrictFilter] = useState(selectedDistrict || 'All');
  const [isOpen, setIsOpen] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(!isFromMasterDb && !!selectedSchoolName);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setQuery(selectedSchoolName || '');
  }, [selectedSchoolName]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSchools = MASTER_SCHOOLS_DATABASE.filter(s => {
    const matchesDist = districtFilter === 'All' || s.district?.toLowerCase() === districtFilter.toLowerCase();
    const cleanQ = query.trim().toLowerCase();
    const matchesQ = !cleanQ || 
      (s.school_name || '').toLowerCase().includes(cleanQ) || 
      (s.area || '').toLowerCase().includes(cleanQ) ||
      (s.block_or_cluster || '').toLowerCase().includes(cleanQ);
    return matchesDist && matchesQ;
  }).slice(0, 15);

  const handleSelectSchool = (school) => {
    setIsManualEntry(false);
    setQuery(school.school_name);
    setIsOpen(false);
    onSchoolChange({
      school_name: school.school_name,
      district: school.district,
      institution_type: school.board || 'School',
      is_from_master_db: true,
      master_school_id: school.id,
      cluster_or_block: school.block_or_cluster || school.area || ''
    });
  };

  const handleManualSwitch = () => {
    setIsManualEntry(true);
    setIsOpen(false);
    onSchoolChange({
      school_name: query,
      district: districtFilter !== 'All' ? districtFilter : (selectedDistrict || 'Chennai'),
      institution_type: selectedInstitutionType || 'School',
      is_from_master_db: false,
      master_school_id: null,
      cluster_or_block: ''
    });
  };

  return (
    <div className="space-y-3" ref={dropdownRef}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          Institution / School Search
        </label>
        
        {isFromMasterDb ? (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Check className="w-3 h-3" /> Master DB Linked ({masterSchoolId})
          </span>
        ) : isManualEntry ? (
          <button
            type="button"
            onClick={() => { setIsManualEntry(false); setIsOpen(true); }}
            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
          >
            Switch to Master DB Picker
          </button>
        ) : null}
      </div>

      {!isManualEntry ? (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search 2,500+ Tamil Nadu schools by name or area..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-24 py-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
            />
            
            {/* District Quick Filter Pill inside input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setIsOpen(true);
                }}
                className="bg-[#1f2029] text-[10px] text-gray-300 border border-white/10 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="All">All Districts</option>
                {TAMIL_NADU_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#14151c] border border-white/20 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-white/5">
              {filteredSchools.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-gray-400">No schools matching "{query}" in school directory.</p>
                  <button
                    type="button"
                    onClick={handleManualSwitch}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition"
                  >
                    + Enter School Manually
                  </button>
                </div>
              ) : (
                filteredSchools.map(school => (
                  <div
                    key={school.id}
                    onClick={() => handleSelectSchool(school)}
                    className="p-3 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-xs flex items-center gap-1.5">
                        {school.school_name}
                        <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 rounded font-mono">
                          {school.board}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {school.district} • {school.area || school.block_or_cluster || "Tamil Nadu"}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{school.id}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual fallback entry */
        <div className="space-y-2 p-3 bg-black/40 border border-amber-500/20 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-amber-400 font-bold uppercase">Manual Institution Entry</span>
            <button
              type="button"
              onClick={() => setIsManualEntry(false)}
              className="text-[10px] text-gray-400 hover:text-white"
            >
              Cancel & Pick from DB
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Full School Name"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSchoolChange({
                  school_name: e.target.value,
                  district: selectedDistrict || 'Chennai',
                  institution_type: selectedInstitutionType || 'School',
                  is_from_master_db: false,
                  master_school_id: null
                });
              }}
              className="bg-[#16171d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
            />
            <select
              value={selectedDistrict || 'Chennai'}
              onChange={(e) => onSchoolChange({
                school_name: query,
                district: e.target.value,
                institution_type: selectedInstitutionType || 'School',
                is_from_master_db: false,
                master_school_id: null
              })}
              className="bg-[#16171d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {TAMIL_NADU_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
