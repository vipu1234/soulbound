import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import MatchCard from '../components/MatchCard';

const INITIAL_FILTERS = {
  age_min: '', age_max: '', height_min: '', height_max: '',
  marital_status: 'any', religion: '', caste: '', mother_tongue: '',
  location_city: '', location_state: '', education_level: 'any', education_field: '',
  profession: '', income_min: '', income_max: '',
  lifestyle_diet: 'any', manglik: 'any', disability: 'any', requires_photo: false, gender: 'any',
};

export default function SearchPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const upd = (k: string, v: any) => setFilters(f => ({ ...f, [k]: v }));

  const search = async (pg = 1) => {
    setLoading(true);
    setPage(pg);
    try {
      const params: any = { page: pg, limit: 20 };
      Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== 'any' && v !== false) params[k] = v; });
      if (filters.requires_photo) params.requires_photo = 'true';
      const { data } = await api.get('/search', { params });
      setResults(data.profiles); setTotal(data.total);
    } catch (err: any) { toast(err.response?.data?.error || 'Search failed', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { search(); }, []);

  const sendInterest = async (userId: string) => {
    try { await api.post(`/interests/${userId}`); toast('Interest sent! 💌', 'success'); }
    catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="filter-group">
      <div className="filter-label">{label}</div>
      {children}
    </div>
  );

  const Sel = ({ k, options }: { k: string; options: string[] }) => (
    <select className="form-input form-select" style={{ fontSize:13 }} value={(filters as any)[k]} onChange={e => upd(k, e.target.value)}>
      {options.map(o => <option key={o} value={o.toLowerCase() === 'any' ? 'any' : o}>{o}</option>)}
    </select>
  );

  return (
    <div className="search-layout">
      {/* Sidebar */}
      <aside className="filter-sidebar">
        <div className="glass filter-panel">
          <div className="filter-title">🔍 15 Filters</div>

          {/* Filter 1-2: Age & Height */}
          <F label="Age Range">
            <div className="range-inputs">
              <input className="form-input" type="number" placeholder="Min" value={filters.age_min} onChange={e=>upd('age_min',e.target.value)} style={{ fontSize:13 }} />
              <span className="range-sep">—</span>
              <input className="form-input" type="number" placeholder="Max" value={filters.age_max} onChange={e=>upd('age_max',e.target.value)} style={{ fontSize:13 }} />
            </div>
          </F>
          <F label="Height (cm)">
            <div className="range-inputs">
              <input className="form-input" type="number" placeholder="Min" value={filters.height_min} onChange={e=>upd('height_min',e.target.value)} style={{ fontSize:13 }} />
              <span className="range-sep">—</span>
              <input className="form-input" type="number" placeholder="Max" value={filters.height_max} onChange={e=>upd('height_max',e.target.value)} style={{ fontSize:13 }} />
            </div>
          </F>

          {/* Filter 3: Marital Status */}
          <F label="Marital Status"><Sel k="marital_status" options={['Any','Never Married','Divorced','Widowed']} /></F>

          {/* Filter 4-5: Religion & Caste */}
          <F label="Religion">
            <input className="form-input" style={{fontSize:13}} placeholder="Any" value={filters.religion} onChange={e=>upd('religion',e.target.value)} />
          </F>
          <F label="Caste / Sub-caste">
            <input className="form-input" style={{fontSize:13}} placeholder="Any" value={filters.caste} onChange={e=>upd('caste',e.target.value)} />
          </F>

          {/* Filter 6: Mother Tongue */}
          <F label="Mother Tongue">
            <input className="form-input" style={{fontSize:13}} placeholder="Any" value={filters.mother_tongue} onChange={e=>upd('mother_tongue',e.target.value)} />
          </F>

          {/* Filter 7: Location */}
          <F label="City / State">
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <input className="form-input" style={{fontSize:13}} placeholder="City" value={filters.location_city} onChange={e=>upd('location_city',e.target.value)} />
              <input className="form-input" style={{fontSize:13}} placeholder="State" value={filters.location_state} onChange={e=>upd('location_state',e.target.value)} />
            </div>
          </F>

          {/* Filter 8: Hometown - same input */}

          {/* Filter 9-10: Education */}
          <F label="Education Level"><Sel k="education_level" options={['Any','High School','Bachelors','Masters','PhD']} /></F>
          <F label="Education Field">
            <input className="form-input" style={{fontSize:13}} placeholder="Engineering, Arts…" value={filters.education_field} onChange={e=>upd('education_field',e.target.value)} />
          </F>

          {/* Filter 11: Profession */}
          <F label="Profession / Industry">
            <input className="form-input" style={{fontSize:13}} placeholder="IT, Govt, Business…" value={filters.profession} onChange={e=>upd('profession',e.target.value)} />
          </F>

          {/* Filter 12: Income */}
          <F label="Annual Income (₹)">
            <div className="range-inputs">
              <input className="form-input" type="number" placeholder="Min" value={filters.income_min} onChange={e=>upd('income_min',e.target.value)} style={{fontSize:13}} />
              <span className="range-sep">—</span>
              <input className="form-input" type="number" placeholder="Max" value={filters.income_max} onChange={e=>upd('income_max',e.target.value)} style={{fontSize:13}} />
            </div>
          </F>

          {/* Filter 13: Lifestyle */}
          <F label="Diet"><Sel k="lifestyle_diet" options={['Any','Vegetarian','Non-Vegetarian','Vegan','Eggetarian']} /></F>

          {/* Filter 14: Manglik */}
          <F label="Manglik Status"><Sel k="manglik" options={['Any','No','Yes','Dont_know']} /></F>

          {/* Filter 15: Disability */}
          <F label="Physical Status"><Sel k="disability" options={['Any','None','Physical','Hearing','Visual']} /></F>

          {/* Photo */}
          <F label="Photo Available">
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <input type="checkbox" checked={filters.requires_photo} onChange={e=>upd('requires_photo',e.target.checked)} />
              <span style={{ fontSize:13 }}>With photo only</span>
            </label>
          </F>

          <div className="filter-actions">
            <button className="btn btn-primary" onClick={() => search(1)} disabled={loading}>
              {loading ? '...' : '🔍 Search'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters(INITIAL_FILTERS); search(1); }}>Reset</button>
          </div>
        </div>
      </aside>

      {/* Results */}
      <main>
        <div className="search-results-header">
          <h2 style={{ fontSize:22, fontWeight:700 }}>Search Results</h2>
          <span className="results-count">{total} profiles found</span>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No profiles match your filters</div>
            <p>Try relaxing some of the filters to see more results.</p>
          </div>
        ) : (
          <>
            <div className="matches-grid">
              {results.map(p => (
                <MatchCard key={p.user_id} profile={p} onInterest={sendInterest} onClick={() => navigate(`/profile/${p.user_id}`)} />
              ))}
            </div>
            {total > page * 20 && (
              <div style={{ textAlign:'center', marginTop:32 }}>
                <button className="btn btn-ghost" onClick={() => search(page + 1)} disabled={loading}>Load More</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
