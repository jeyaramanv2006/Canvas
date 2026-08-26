import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Building2, MapPin, CheckCircle2, PlusCircle, X, Sparkles, BookOpen, Layers } from 'lucide-react';
import { searchMasterSchoolsLocal } from '../data/masterSchools';
import { cn } from '../lib/utils';

export default function SchoolSearchPicker({
  selectedSchoolName = '',
  selectedDistrict = '',
  selectedInstitutionType = 'School',
  isFromMasterDb = false,
  masterSchoolId = null,
  onSchoolChange, // (schoolData: { school_name, district, institution_type, is_from_master_db, master_school_id, cluster_or_block }) => void
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(!isFromMasterDb && !!selectedSchoolName);
  const [results, setResults] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const matches = searchMasterSchoolsLocal(searchTerm, districtFilter, 15);
      setResults(matches);
    } else {
      const topSchools = searchMasterSchoolsLocal('', districtFilter, 8);
      setResults(topSchools);
    }
  }, [searchTerm, districtFilter]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSchool = (school) => {
    setIsCustomMode(false);
    setIsOpen(false);
    setSearchTerm('');
    onSchoolChange({
      school_name: school.school_name,
      district: school.district,
      institution_type: school.board.includes('CBSE') ? 'CBSE' :
                        school.board.includes('Matric') ? 'Matriculation' :
                        school.board.includes('ICSE') ? 'ICSE' :
                        school.board.includes('College') ? 'College' : 'School',
      is_from_master_db: true,
      master_school_id: school.id,
      cluster_or_block: school.block_or_cluster,
      area: school.area
    });
  };

  const handleEnableCustomMode = () => {
    setIsCustomMode(true);
    setIsOpen(false);
    onSchoolChange({
      school_name: selectedSchoolName || searchTerm || '',
      district: selectedDistrict || '',
      institution_type: selectedInstitutionType || 'School',
      is_from_master_db: false,
      master_school_id: null,
      cluster_or_block: ''
    });
  };

  const handleClearSelection = () => {
    setIsCustomMode(false);
    setSearchTerm('');
    onSchoolChange({
      school_name: '',
      district: '',
      institution_type: 'School',
      is_from_master_db: false,
      master_school_id: null,
      cluster_or_block: ''
    });
  };

  return (
    <div className="space-y-3" ref={dropdownRef}>
      {/* If a Master Database School is currently selected */}
      {isFromMasterDb && selectedSchoolName && !isCustomMode ? (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl relative shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified Master DB School
                </span>
                <span className="text-[11px] text-gray-400 font-mono">#{masterSchoolId}</span>
              </div>
              <h4 className="text-base font-extrabold text-white">{selectedSchoolName}</h4>
              <p className="text-xs text-gray-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedDistrict}</span>
                <span>•</span>
                <span className="text-murugan-accent font-semibold">{selectedInstitutionType}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Change
            </button>
          </div>
        </div>
      ) : isCustomMode ? (
        /* Manual Custom Input Mode */
        <div className="space-y-3 p-4 bg-black/40 border border-amber-500/30 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <PlusCircle className="w-3 h-3 text-amber-400" />
              Unlisted / New Discovery School
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                setIsOpen(true);
              }}
              className="text-xs text-murugan-accent hover:underline font-bold flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              Search Database Instead
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                placeholder="Type School / Institution Name"
                value={selectedSchoolName}
                onChange={e => onSchoolChange({
                  school_name: e.target.value,
                  district: selectedDistrict,
                  institution_type: selectedInstitutionType,
                  is_from_master_db: false,
                  master_school_id: null,
                  cluster_or_block: ''
                })}
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="District / City"
                  value={selectedDistrict}
                  onChange={e => onSchoolChange({
                    school_name: selectedSchoolName,
                    district: e.target.value,
                    institution_type: selectedInstitutionType,
                    is_from_master_db: false,
                    master_school_id: null,
                    cluster_or_block: ''
                  })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <select
                value={selectedInstitutionType}
                onChange={e => onSchoolChange({
                  school_name: selectedSchoolName,
                  district: selectedDistrict,
                  institution_type: e.target.value,
                  is_from_master_db: false,
                  master_school_id: null,
                  cluster_or_block: ''
                })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none font-medium"
              >
                <option value="School">School (General)</option>
                <option value="Matriculation">Matriculation</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
                <option value="College">College / Institute</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* Database Search & Autocomplete Input */
        <div className="relative space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-murugan-accent" />
              Select School from Master Database:
            </label>
            <button
              type="button"
              onClick={handleEnableCustomMode}
              className="text-xs text-gray-400 hover:text-murugan-accent font-semibold transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3 h-3" />
              + Unlisted School
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-murugan-accent" />
            <input
              type="text"
              placeholder="Search by school name, district, or block (e.g. Merit, Tenkasi, Alangulam)..."
              value={searchTerm}
              onFocus={() => setIsOpen(true)}
              onChange={e => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              className="w-full bg-black/50 border border-white/15 focus:border-murugan-accent rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent/40 shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-murugan-card border border-white/15 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-white/5 backdrop-blur-2xl"
              >
                {/* Quick District Filter Chips */}
                <div className="p-2.5 bg-black/40 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
                  <span className="text-gray-500 font-semibold px-1">District:</span>
                  {['all', 'Tenkasi', 'Tirunelveli', 'Chennai', 'Coimbatore', 'Madurai', 'Salem'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDistrictFilter(d)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition",
                        districtFilter === d ? "bg-murugan-accent text-black font-bold" : "bg-white/5 text-gray-300 hover:bg-white/10"
                      )}
                    >
                      {d === 'all' ? 'All' : d}
                    </button>
                  ))}
                </div>

                {results.length > 0 ? (
                  <div className="py-1">
                    {results.map((school) => (
                      <div
                        key={school.id}
                        onClick={() => handleSelectSchool(school)}
                        className="px-4 py-3 hover:bg-murugan-accent/15 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-1 pr-2">
                          <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {school.school_name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                            <span className="text-murugan-accent font-semibold">{school.district}</span>
                            <span>•</span>
                            <span>{school.block_or_cluster}</span>
                            {school.area && (
                              <>
                                <span>•</span>
                                <span className="text-gray-500 truncate max-w-[200px]">{school.area}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded-md">
                            {school.board}
                          </span>
                          <span className="text-xs font-bold text-murugan-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            Select →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center space-y-2">
                    <p className="text-xs text-gray-400">No matching schools in Master Database.</p>
                    <button
                      type="button"
                      onClick={handleEnableCustomMode}
                      className="px-4 py-2 bg-murugan-accent text-black font-bold text-xs rounded-xl shadow-md hover:bg-yellow-400 transition"
                    >
                      + Add "{searchTerm}" as Unlisted School
                    </button>
                  </div>
                )}

                {/* Footer action to enter manually */}
                <div className="p-3 bg-black/60 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-gray-400">Not listed in the directory?</span>
                  <button
                    type="button"
                    onClick={handleEnableCustomMode}
                    className="text-murugan-accent hover:underline font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Enter Custom School
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
