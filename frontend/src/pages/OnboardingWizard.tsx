import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';

const STEPS = ['Basic Info', 'Professional', 'Family & Preferences'];

/* ── Field component defined OUTSIDE the main component ──── */
function Field({ label, name, type = 'text', value, onChange, options, fullWidth = false }: any) {
  return (
    <div className={`form-group${fullWidth ? ' full-width' : ''}`}>
      <label className="form-label">{label}</label>
      {options ? (
        <select className="form-input form-select" name={name} value={value} onChange={onChange}>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="form-input" name={name} value={value} onChange={onChange} rows={3} style={{ resize:'vertical' }} />
      ) : (
        <input className="form-input" type={type} name={name} value={value} onChange={onChange} />
      )}
    </div>
  );
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [basic, setBasic] = useState({
    full_name: '', dob: '', gender: 'male', marital_status: 'never_married',
    height_cm: '', weight_kg: '', blood_group: 'O+', about_me: '',
    current_city: '', current_state: '', current_country: 'India',
  });
  const [professional, setProfessional] = useState({
    occupation: '', company: '', education_level: 'bachelors', education_field: '',
    annual_income: '', lifestyle_diet: 'vegetarian', lifestyle_smoke: 'no', lifestyle_drink: 'no',
  });
  const [family, setFamily] = useState({
    religion: '', caste: '', mother_tongue: '', hometown: '',
    manglik: 'dont_know', disability: 'none',
    horoscope_data: { nakshatra: '', rashi: '', gotra: '' }
  });

  const handleBasic = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBasic(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePro = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfessional(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFamily = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFamily(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleHoroscope = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFamily(prev => ({ ...prev, horoscope_data: { ...prev.horoscope_data, [name]: value } }));
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const payload = { ...basic, ...professional, ...family, wizard_step: step + 1 };
      await api.put('/profile/me', payload);
    } catch (err: any) {
      throw err;
    } finally { setLoading(false); }
  };

  const next = async () => {
    try {
      await save();
      if (step < 2) setStep(s => s + 1);
      else {
        await refreshUser();
        toast('Profile complete! 🎉', 'success');
        navigate('/discover');
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Save failed', 'error');
    }
  };

  return (
    <div className="wizard-page">
      <div className="glass wizard-card">
        {/* Steps indicator */}
        <div className="wizard-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`wizard-step${i < step ? ' done' : i === step ? ' active' : ''}`}>
              <div className="wizard-step-dot">{i < step ? '✓' : i + 1}</div>
              <span className="wizard-step-label">{s}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize:24, fontWeight:700, marginBottom:24, fontFamily:"'Cormorant Garamond', serif" }}>{STEPS[step]}</h2>

        {/* Step 0: Basic */}
        {step === 0 && (
          <div className="wizard-form">
            <Field label="Full Name"    name="full_name" value={basic.full_name} onChange={handleBasic} fullWidth />
            <Field label="Date of Birth" name="dob" type="date" value={basic.dob} onChange={handleBasic} />
            <Field label="Gender" name="gender" value={basic.gender} onChange={handleBasic} options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]} />
            <Field label="Marital Status" name="marital_status" value={basic.marital_status} onChange={handleBasic} options={[{value:'never_married',label:'Never Married'},{value:'divorced',label:'Divorced'},{value:'widowed',label:'Widowed'}]} />
            <Field label="Height (cm)" name="height_cm" type="number" value={basic.height_cm} onChange={handleBasic} />
            <Field label="Blood Group"  name="blood_group" value={basic.blood_group} onChange={handleBasic} options={['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=>({value:g,label:g}))} />
            <Field label="Current City"  name="current_city"  value={basic.current_city} onChange={handleBasic} />
            <Field label="Current State" name="current_state" value={basic.current_state} onChange={handleBasic} />
            <Field label="About Me" name="about_me" type="textarea" value={basic.about_me} onChange={handleBasic} fullWidth />
          </div>
        )}

        {/* Step 1: Professional */}
        {step === 1 && (
          <div className="wizard-form">
            <Field label="Occupation / Job Title" name="occupation" value={professional.occupation} onChange={handlePro} />
            <Field label="Company / Employer" name="company" value={professional.company} onChange={handlePro} />
            <Field label="Education Level" name="education_level" value={professional.education_level} onChange={handlePro} options={[{value:'high_school',label:'High School'},{value:'bachelors',label:"Bachelor's"},{value:'masters',label:"Master's"},{value:'phd',label:'PhD'},{value:'other',label:'Other'}]} />
            <Field label="Education Field" name="education_field" value={professional.education_field} onChange={handlePro} />
            <Field label="Annual Income (₹)" name="annual_income" type="number" value={professional.annual_income} onChange={handlePro} />
            <Field label="Diet" name="lifestyle_diet" value={professional.lifestyle_diet} onChange={handlePro} options={[{value:'vegetarian',label:'Vegetarian'},{value:'non-vegetarian',label:'Non-Vegetarian'},{value:'vegan',label:'Vegan'},{value:'eggetarian',label:'Eggetarian'}]} />
            <Field label="Smoking" name="lifestyle_smoke" value={professional.lifestyle_smoke} onChange={handlePro} options={[{value:'no',label:'No'},{value:'occasionally',label:'Occasionally'},{value:'yes',label:'Yes'}]} />
            <Field label="Drinking" name="lifestyle_drink" value={professional.lifestyle_drink} onChange={handlePro} options={[{value:'no',label:'No'},{value:'occasionally',label:'Occasionally'},{value:'yes',label:'Yes'}]} />
          </div>
        )}

        {/* Step 2: Family */}
        {step === 2 && (
          <div className="wizard-form">
            <Field label="Religion" name="religion" value={family.religion} onChange={handleFamily} />
            <Field label="Caste / Sub-caste" name="caste" value={family.caste} onChange={handleFamily} />
            <Field label="Mother Tongue" name="mother_tongue" value={family.mother_tongue} onChange={handleFamily} />
            <Field label="Hometown" name="hometown" value={family.hometown} onChange={handleFamily} />
            <Field label="Manglik Status" name="manglik" value={family.manglik} onChange={handleFamily} options={[{value:'no',label:'Not Manglik'},{value:'yes',label:'Manglik'},{value:'dont_know',label:"Don't Know"}]} />
            <Field label="Physical Status" name="disability" value={family.disability} onChange={handleFamily} options={[{value:'none',label:'No Disability'},{value:'physical',label:'Physical'},{value:'hearing',label:'Hearing'},{value:'visual',label:'Visual'}]} />
            <Field label="Rashi (Moon Sign)" name="rashi" value={family.horoscope_data.rashi} onChange={handleHoroscope} />
            <Field label="Nakshatra" name="nakshatra" value={family.horoscope_data.nakshatra} onChange={handleHoroscope} />
          </div>
        )}

        <div className="wizard-actions">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
          ) : <div />}
          <button className="btn btn-primary" onClick={next} disabled={loading}>
            {loading ? 'Saving...' : step < 2 ? 'Next →' : 'Complete Profile 🎉'}
          </button>
        </div>
      </div>
    </div>
  );
}
