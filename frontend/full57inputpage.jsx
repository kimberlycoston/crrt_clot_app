import React, { useState } from 'react'
import { predictFull } from './apiClient.js'
import RiskGauge from './riskgauge.jsx'

// Default values for the 47 non-top-10 features (reasonable medians/means from CRRT data)
const DEFAULT_VALUES = {
  // Top 10 features - start empty (user must fill)
  blood_flow: '',
  citrate: '',
  heparin_dose: '',
  phosphate: '',
  fibrinogen: '',
  effluent_pressure: '',
  filter_pressure: '',
  prefilter_replacement_rate: '',
  creatinine: '',
  replacement_rate: '',
  
  // CRRT Machine Parameters (pre-filled with typical values)
  access_pressure: -100,
  current_goal: 25,
  dialysate_rate: 1500,
  hourly_patient_fluid_removal: 75,
  postfilter_replacement_rate: 200,
  return_pressure: 120,
  ultrafiltrate_output: 1400,
  
  // Hematology (pre-filled with typical ICU values)
  hematocrit: 28,
  hemoglobin: 9.5,
  platelet: 150,
  rbc: 3.0,
  wbc: 12.0,
  
  // Coagulation (pre-filled with typical values)
  inr: 1.3,
  pt: 14.5,
  ptt: 38,
  
  // Chemistry (pre-filled with typical ICU values)
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
  
  // Temporal features (pre-filled)
  high_pressure: 0,
  hour_of_day: 12,
  day_of_week: 3,
  is_weekend: 0,
  is_night_shift: 0,
  
  // Change features (pre-filled with typical changes)
  platelet_change: -10,
  ptt_change: 3,
  creatinine_change: 0.2,
  hematocrit_change: -1
}

// Feature groups for better organization
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

  const handleInputChange = (key, value) => {
    setFeatures(prev => ({
      ...prev,
      [key]: value === '' ? '' : parseFloat(value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate top 10 features are filled
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

  return (
    <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Full Model - All 57 Features
        </h2>
        <p className="text-gray-600 mb-6">
          Top 10 features are required. Other features are pre-filled with typical ICU values but can be adjusted.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form - Takes up 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {Object.entries(FEATURE_GROUPS).map(([groupName, groupFeatures]) => (
                <div key={groupName} className="border-b pb-4">
                  <h3 className={`text-lg font-semibold mb-3 ${
                    groupName.includes('Top 10') ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    {groupName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupFeatures.map(({ key, label, min, max, step }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {label}
                          {groupName.includes('Top 10') && (
                            <span className="text-red-500 ml-1">*</span>
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
                            groupName.includes('Top 10') && features[key] === '' 
                              ? 'border-red-300 bg-red-50' 
                              : ''
                          }`}
                          required={groupName.includes('Top 10')}
                          placeholder={groupName.includes('Top 10') ? 'Required' : ''}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Predicting...' : 'Get Prediction'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  Reset
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Results - Takes up 1 column */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Prediction Results</h3>
            
            {result ? (
              <div className="space-y-4">
                <RiskGauge 
                  percentage={result.percentage}
                  riskLevel={result.risk_level}
                />
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Top 10 Contributors:</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(result.top_contributors || {})
                      .map(([feature, value]) => (
                        <div key={feature} className="flex justify-between text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-700">
                            {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`font-medium ${value > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {value > 0 ? '+' : ''}{value.toFixed(4)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                <p className="mb-2">Fill in the required fields</p>
                <p className="text-sm">(Top 10 features marked with *)</p>
                <p className="text-sm mt-4">Other fields are pre-filled with typical ICU values but can be adjusted</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Full57InputPage