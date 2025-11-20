import React, { useState } from 'react'
import { predictFull } from './apiClient.js'
import RiskGauge from './riskgauge.jsx'
import { Sparkles, RotateCcw, Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

// ... (keep the DEFAULT_VALUES as in original file)
const DEFAULT_VALUES = {
  // Top 10 Most Important - Pre-filled with typical ICU values (user can edit)
  blood_flow: 200,
  citrate: 200,
  heparin_dose: 800,
  phosphate: 3.5,
  fibrinogen: 350,
  effluent_pressure: 75,
  filter_pressure: 125,
  prefilter_replacement_rate: 500,
  creatinine: 2.5,
  replacement_rate: 700,
  // Other parameters - Pre-filled with typical ICU values
  access_pressure: -100,
  current_goal: 25,
  dialysate_rate: 1500,
  hourly_patient_fluid_removal: 75,
  postfilter_replacement_rate: 200,
  return_pressure: 120,
  ultrafiltrate_output: 1400,
  hematocrit: 28,
  hemoglobin: 9.5,
  platelet: 150,
  rbc: 3.0,
  wbc: 12.0,
  inr: 1.3,
  pt: 14.5,
  ptt: 38,
  aniongap: 14,
  bicarbonate: 21,
  bun: 45,
  calcium: 8.5,
  chloride: 103,
  glucose: 140,
  sodium: 139,
  potassium: 4.3,
  lactate: 1.8,
  ph: 7.35,
  pco2: 38,
  magnesium: 2.0,
  ldh: 250,
  high_pressure: 0,
  hour_of_day: 12,
  day_of_week: 3,
  is_weekend: 0,
  is_night_shift: 0,
  platelet_change: -10,
  ptt_change: 3,
  creatinine_change: 0.2,
  hematocrit_change: -1
}

// ... (keep the FEATURE_GROUPS as in original file)
const FEATURE_GROUPS = {
  'Top 10 Most Important (Required)': [
    { key: 'blood_flow', label: 'Blood Flow (mL/min)', min: 50, max: 300 },
    { key: 'citrate', label: 'Citrate (mEq/hr)', min: 0, max: 300 },
    { key: 'heparin_dose', label: 'Heparin Dose (units/hr)', min: 0, max: 2000 },
    { key: 'phosphate', label: 'Phosphate (mg/dL)', min: 1, max: 8 },
    { key: 'fibrinogen', label: 'Fibrinogen (mg/dL)', min: 100, max: 800 },
    { key: 'effluent_pressure', label: 'Effluent Pressure (mmHg)', min: 0, max: 200 },
    { key: 'filter_pressure', label: 'Filter Pressure (mmHg)', min: 50, max: 300 },
    { key: 'prefilter_replacement_rate', label: 'Prefilter Replacement Rate (mL/hr)', min: 0, max: 1500 },
    { key: 'creatinine', label: 'Creatinine (mg/dL)', min: 0.5, max: 8 },
    { key: 'replacement_rate', label: 'Replacement Rate (mL/hr)', min: 0, max: 2000 }
  ],
  'CRRT Machine Parameters': [
    { key: 'access_pressure', label: 'Access Pressure (mmHg)', min: -250, max: 0 },
    { key: 'current_goal', label: 'Current Goal (mL/kg/hr)', min: 10, max: 50 },
    { key: 'dialysate_rate', label: 'Dialysate Rate (mL/hr)', min: 500, max: 3000 },
    { key: 'hourly_patient_fluid_removal', label: 'Hourly Patient Fluid Removal (mL)', min: 0, max: 300 },
    { key: 'postfilter_replacement_rate', label: 'Postfilter Replacement Rate (mL/hr)', min: 0, max: 1000 },
    { key: 'return_pressure', label: 'Return Pressure (mmHg)', min: 50, max: 250 },
    { key: 'ultrafiltrate_output', label: 'Ultrafiltrate Output (mL/hr)', min: 500, max: 3000 }
  ],
  'Hematology': [
    { key: 'hematocrit', label: 'Hematocrit (%)', min: 15, max: 50 },
    { key: 'hemoglobin', label: 'Hemoglobin (g/dL)', min: 5, max: 18 },
    { key: 'platelet', label: 'Platelet (x10³/μL)', min: 20, max: 500 },
    { key: 'rbc', label: 'RBC (x10⁶/μL)', min: 1.5, max: 6 },
    { key: 'wbc', label: 'WBC (x10³/μL)', min: 2, max: 30 }
  ],
  'Coagulation': [
    { key: 'inr', label: 'INR', min: 0.8, max: 5 },
    { key: 'pt', label: 'PT (seconds)', min: 10, max: 40 },
    { key: 'ptt', label: 'PTT (seconds)', min: 20, max: 100 }
  ],
  'Chemistry': [
    { key: 'aniongap', label: 'Anion Gap (mEq/L)', min: 5, max: 30 },
    { key: 'bicarbonate', label: 'Bicarbonate (mEq/L)', min: 10, max: 35 },
    { key: 'bun', label: 'BUN (mg/dL)', min: 10, max: 120 },
    { key: 'calcium', label: 'Calcium (mg/dL)', min: 6, max: 12 },
    { key: 'chloride', label: 'Chloride (mEq/L)', min: 90, max: 115 },
    { key: 'glucose', label: 'Glucose (mg/dL)', min: 60, max: 400 },
    { key: 'sodium', label: 'Sodium (mEq/L)', min: 125, max: 155 },
    { key: 'potassium', label: 'Potassium (mEq/L)', min: 2.5, max: 7 },
    { key: 'lactate', label: 'Lactate (mmol/L)', min: 0.5, max: 10 },
    { key: 'ph', label: 'pH', min: 6.8, max: 7.8, step: 0.01 },
    { key: 'pco2', label: 'pCO₂ (mmHg)', min: 20, max: 80 },
    { key: 'magnesium', label: 'Magnesium (mg/dL)', min: 1, max: 4 },
    { key: 'ldh', label: 'LDH (U/L)', min: 100, max: 1000 }
  ],
  'Temporal Features': [
    { key: 'high_pressure', label: 'High Pressure Alert', min: 0, max: 1 },
    { key: 'hour_of_day', label: 'Hour of Day (0-23)', min: 0, max: 23 },
    { key: 'day_of_week', label: 'Day of Week (0-6)', min: 0, max: 6 },
    { key: 'is_weekend', label: 'Is Weekend (0/1)', min: 0, max: 1 },
    { key: 'is_night_shift', label: 'Is Night Shift (0/1)', min: 0, max: 1 }
  ],
  'Change Features': [
    { key: 'platelet_change', label: 'Platelet Change', min: -200, max: 200 },
    { key: 'ptt_change', label: 'PTT Change (seconds)', min: -50, max: 50 },
    { key: 'creatinine_change', label: 'Creatinine Change (mg/dL)', min: -3, max: 3, step: 0.1 },
    { key: 'hematocrit_change', label: 'Hematocrit Change (%)', min: -15, max: 15 }
  ]
}

function Full57InputPage() {
  const [features, setFeatures] = useState(DEFAULT_VALUES)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [collapsedGroups, setCollapsedGroups] = useState({})

  const handleInputChange = (key, value) => {
    setFeatures(prev => ({
      ...prev,
      [key]: value === '' ? '' : parseFloat(value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const top10Keys = FEATURE_GROUPS['Top 10 Most Important (Required)'].map(f => f.key)
    const missingTop10 = top10Keys.filter(key => features[key] === '' || features[key] === null)
    
    if (missingTop10.length > 0) {
      setError('Please fill in all Top 10 required features')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await predictFull(features)
      setResult(response)
    } catch (err) {
      setError(err.message || 'Failed to get prediction')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFeatures(DEFAULT_VALUES)
    setResult(null)
    setError(null)
  }

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 text-center animate-slide-in">
          {/* <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Activity className="w-4 h-4" />
            <span>Comprehensive Assessment Mode</span>
          </div> */}
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Full Model - All 57 Features
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Complete clinical assessment using all available parameters. Top 10 features are <strong>required</strong>, 
            while others are pre-filled with typical ICU values and can be adjusted as needed.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.entries(FEATURE_GROUPS).map(([groupName, groupFeatures]) => {
                const isRequired = groupName.includes('Top 10')
                const isCollapsed = collapsedGroups[groupName]
                
                return (
                  <div 
                    key={groupName} 
                    className={`card hover-lift animate-slide-in-right ${
                      isRequired ? 'feature-group-required' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between mb-4 focus:outline-none group"
                    >
                      <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
                        isRequired ? 'text-blue-700' : 'text-gray-800'
                      }`}>
                        {isRequired && <AlertCircle className="w-5 h-5 text-red-500" />}
                        <span>{groupName}</span>
                        {/* <span className={` ${
                          isRequired ? 'badge-danger' : 'badge-info'
                        }`}> */}
                          {/* {groupFeatures.length} fields */}
                        {/* </span> */}
                      </h3>
                      {isCollapsed ? 
                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" /> :
                        <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      }
                    </button>
                    
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-in">
                        {groupFeatures.map(({ key, label, min, max, step }) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {label}
                              {isRequired && (
                                <span className="text-red-500 ml-1 text-base">*</span>
                              )}
                            </label>
                            <input
                              type="number"
                              step={step || 0.1}
                              min={min}
                              max={max}
                              value={features[key]}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              className={`input-field ${
                                isRequired && features[key] === '' 
                                  ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                                  : ''
                              }`}
                              required={isRequired}
                              placeholder={isRequired ? 'Required' : 'Optional'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              
              <div className="card">
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Calculate Risk</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="card bg-red-50 border-red-200 animate-slide-in">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            <div className="results-panel">
              <div className="card animate-slide-in">
                <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                  <img src="/crrt_icon.png" alt="CRRT Icon" className="w-8 h-8 object-contain" />
                  <span>Risk Assessment</span>
                </h3>
                
                {result ? (
                  <div className="space-y-6">
                    <RiskGauge 
                      percentage={result.percentage}
                      riskLevel={result.risk_level}
                    />
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-semibold mb-4 flex items-center space-x-2">
                        <span>Top Contributors</span>
                        {/* <span className="badge badge-info text-xs">SHAP</span> */}
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {Object.entries(result.top_contributors || {})
                          .map(([feature, value]) => {
                            const absValue = Math.abs(value)
                            const maxAbs = Math.max(...Object.values(result.top_contributors).map(Math.abs))
                            const widthPercent = (absValue / maxAbs) * 100
                            
                            return (
                              <div key={feature}>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="font-medium text-gray-700 text-xs">
                                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  <span className={`font-semibold text-xs ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {value > 0 ? '+' : ''}{value.toFixed(4)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      value > 0 
                                        ? 'bg-gradient-to-r from-red-400 to-red-600' 
                                        : 'bg-gradient-to-r from-green-400 to-green-600'
                                    }`}
                                    style={{ width: `${widthPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow" style={{ backgroundColor: 'transparent' }}>
                    <img src="/crrt_icon.png" alt="CRRT Icon" className="w-20 h-20 object-contain" />
                    </div>
                    <p className="text-gray-500 mb-2 font-medium">Ready for Full Assessment</p>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                      Fill in the required Top 10 features and click "Calculate Risk"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Full57InputPage