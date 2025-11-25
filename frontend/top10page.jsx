import React, { useState } from 'react'
import { predictTop20 } from './apiClient.js'
import RiskGauge from './riskgauge.jsx'
import ShapBidirectionalChart from './ShapBidirectionalChart.jsx'
import ClinicalRecommendations from './ClinicalRecommendations.jsx'
import { generateClinicalRecommendations } from './llmService.js'
import { Sparkles, RotateCcw, Activity, Info, Brain, Loader2 } from 'lucide-react'

const TOP20_FEATURES = [
  { key: 'blood_flow', label: 'Blood Flow (mL/min)', unit: 'mL/min', min: 50, max: 300, step: 25, info: 'Rate of blood flow through the circuit' },
  { key: 'fibrinogen', label: 'Fibrinogen (mg/dL)', unit: 'mg/dL', min: 100, max: 800, step: 10, info: 'Coagulation factor' },
  { key: 'phosphate', label: 'Phosphate (mg/dL)', unit: 'mg/dL', min: 1, max: 8, step: 0.1, info: 'Serum phosphate level' },
  { key: 'filter_pressure', label: 'Filter Pressure (mmHg)', unit: 'mmHg', min: 50, max: 300, step: 25, info: 'Transmembrane pressure' },
  { key: 'effluent_pressure', label: 'Effluent Pressure (mmHg)', unit: 'mmHg', min: 0, max: 200, step: 25, info: 'Outlet pressure' },
  { key: 'prefilter_replacement_rate', label: 'Prefilter Replacement (mL/hr)', unit: 'mL/hr', min: 0, max: 1500, step: 100, info: 'Pre-dilution rate' },
  { key: 'creatinine', label: 'Creatinine (mg/dL)', unit: 'mg/dL', min: 0.5, max: 8, step: 0.1, info: 'Renal function marker' },
  { key: 'return_pressure', label: 'Return Pressure (mmHg)', unit: 'mmHg', min: 50, max: 250, step: 10, info: 'Return pressure' },
  { key: 'effluent_bloodflow_ratio', label: 'Effluent/Blood Flow Ratio', unit: '', min: 0, max: 1, step: 0.01, info: 'Effluent/Blood Flow Ratio' },
  { key: 'dialysate_rate', label: 'Dialysate Rate (mL/hr)', unit: 'mL/hr', min: 500, max: 3000, step: 100, info: 'Dialysate rate' },
  { key: 'replacement_rate', label: 'Replacement Rate (mL/hr)', unit: 'mL/hr', min: 0, max: 2000, step: 100, info: 'Total replacement fluid' },
  { key: 'postfilter_replacement_rate', label: 'Postfilter Replacement (mL/hr)', unit: 'mL/hr', min: 0, max: 1000, step: 100, info: 'Post-dilution rate' },
  { key: 'creatinine_change', label: 'Creatinine Change (mg/dL)', unit: 'mg/dL', min: -3, max: 3, step: 0.1, info: 'Creatinine change' },
  { key: 'ptt', label: 'PTT (seconds)', unit: 'seconds', min: 20, max: 100, step: 1, info: 'Partial thromboplastin time' },
  { key: 'platelet_wbc_ratio', label: 'Platelet/WBC Ratio', unit: '', min: 0, max: 1, step: 0.01, info: 'Platelet/WBC Ratio' },
  { key: 'ldh', label: 'LDH (U/L)', unit: 'U/L', min: 100, max: 1000, step: 10, info: 'Lactate dehydrogenase level' }
]

const DEFAULT_VALUES = {
  blood_flow: 200,
  fibrinogen: 350,
  phosphate: 3.5,
  filter_pressure: 125,
  effluent_pressure: 75,
  prefilter_replacement_rate: 500,
  heparin_dose: 800,
  creatinine: 2.5,
  citrate: 200,
  return_pressure: 150,
  effluent_bloodflow_ratio: 0.375,
  dialysate_rate: 1500,
  replacement_rate: 700,
  postfilter_replacement_rate: 200,
  creatinine_change: 0,
  ptt: 38,
  platelet_wbc_ratio: 0.1,
  ldh: 300
}

function Top10Page() {
  const [features, setFeatures] = useState(DEFAULT_VALUES)
  const [anticoagulationMode, setAnticoagulationMode] = useState('heparin') // 'heparin', 'citrate', or 'none'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const handleInputChange = (feature, value) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: value === '' ? '' : (parseFloat(value) || 0)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRecommendations(null)
    
    try {
      // Build payload with only TOP20 features that the model expects
      // The backend will extract these and pass to the model
      // Note: The model may have been trained without citrate/heparin_dose, but they're in TOP20_FEATURES
      // so we include them and let the backend handle the extraction
      const payload = {}
      
      // Set mode flags first based on selected anticoagulation mode
      if (anticoagulationMode === 'heparin') {
        payload.mode_heparin = 1
        payload.mode_citrate = 0
        payload.mode_none = 0
        // Include heparin_dose from features
        payload.heparin_dose = features.heparin_dose ? parseFloat(features.heparin_dose) || 0 : 0
        payload.citrate = 0
      } else if (anticoagulationMode === 'citrate') {
        payload.mode_heparin = 0
        payload.mode_citrate = 1
        payload.mode_none = 0
        // Include citrate from features
        payload.citrate = features.citrate ? parseFloat(features.citrate) || 0 : 0
        payload.heparin_dose = 0
      } else { // 'none'
        payload.mode_heparin = 0
        payload.mode_citrate = 0
        payload.mode_none = 1
        // Set both to 0
        payload.heparin_dose = 0
        payload.citrate = 0
      }
      
      // Add all TOP20 features from the features state
      // These match the backend TOP20_FEATURES list
      const top20Keys = [
        'blood_flow', 'fibrinogen', 'phosphate', 'filter_pressure', 'effluent_pressure',
        'prefilter_replacement_rate', 'creatinine', 'return_pressure',
        'effluent_bloodflow_ratio', 'dialysate_rate', 'replacement_rate',
        'postfilter_replacement_rate', 'creatinine_change', 'ptt',
        'platelet_wbc_ratio', 'ldh'
      ]
      
      top20Keys.forEach(key => {
        const value = features[key]
        if (value === '' || value === null || value === undefined) {
          payload[key] = 0
        } else {
          payload[key] = typeof value === 'number' ? value : parseFloat(value) || 0
        }
      })
      
      // Get prediction from backend
      const response = await predictTop20(payload)
      setResult(response)
      
      // Generate LLM recommendations
      setLoadingRecommendations(true)
      try {
        const llmResponse = await generateClinicalRecommendations(response, features)
        setRecommendations(llmResponse)
      } catch (llmError) {
        console.error("LLM recommendation error:", llmError)
        setRecommendations(null)
      } finally {
        setLoadingRecommendations(false)
      }
      
    } catch (err) {
      setError(err.message || 'Failed to get prediction')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFeatures(DEFAULT_VALUES)
    setAnticoagulationMode('heparin')
    setResult(null)
    setError(null)
    setRecommendations(null)
  }
  
  const handleModeChange = (mode) => {
    setAnticoagulationMode(mode)
    // Clear the irrelevant dose when switching modes
    if (mode === 'heparin') {
      setFeatures(prev => ({ ...prev, citrate: null }))
    } else if (mode === 'citrate') {
      setFeatures(prev => ({ ...prev, heparin_dose: null }))
    } else { // 'none'
      setFeatures(prev => ({ ...prev, heparin_dose: null, citrate: null }))
    }
  }

  return (
    <>
      <style>{`
        .tooltip-container:hover .tooltip {
          opacity: 1;
        }
      `}</style>
      <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 text-center animate-slide-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Quick Clot Risk Calculator
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
          Quick evaluation of circuit clotting risk based on key treatment parameters.
          </p>
        </div>
        
        {/* Top Row: Patient Parameters and Risk Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card hover-lift animate-slide-in-right">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
                  <img src="/parameters_icon.png" alt="Parameters Icon" className="w-6 h-6 object-contain" />
                  <span>Patient Parameters</span>
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Anticoagulation Mode Selector */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Anticoagulation Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="anticoagulationMode"
                        value="none"
                        checked={anticoagulationMode === 'none'}
                        onChange={(e) => handleModeChange(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">None</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="anticoagulationMode"
                        value="heparin"
                        checked={anticoagulationMode === 'heparin'}
                        onChange={(e) => handleModeChange(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Heparin</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="anticoagulationMode"
                        value="citrate"
                        checked={anticoagulationMode === 'citrate'}
                        onChange={(e) => handleModeChange(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Citrate</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Anticoagulation Dose Inputs */}
                {anticoagulationMode === 'heparin' && (
                  <div className="mb-4">
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center space-x-1">
                        <span>Heparin Dose (units/hr)</span>
                        <div className="relative inline-block tooltip-container">
                          <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                          <div className="tooltip absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10 pointer-events-none opacity-0 transition-opacity duration-200">
                            Systemic anticoagulation dose
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        units/hr
                      </span>
                    </label>
                    <input
                      type="number"
                      step="50.0"
                      min={0}
                      max={2000}
                      value={features.heparin_dose ?? ''}
                      onChange={(e) => handleInputChange('heparin_dose', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                )}

                {anticoagulationMode === 'citrate' && (
                  <div className="mb-4">
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center space-x-1">
                        <span>Citrate (mEq/hr)</span>
                        <div className="relative inline-block tooltip-container">
                          <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                          <div className="tooltip absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10 pointer-events-none opacity-0 transition-opacity duration-200">
                            Regional anticoagulation rate
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        mEq/hr
                      </span>
                    </label>
                    <input
                      type="number"
                      step="50.0"
                      min={0}
                      max={300}
                      value={features.citrate ?? ''}
                      onChange={(e) => handleInputChange('citrate', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                )}

                {/* Regular Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {TOP20_FEATURES.map(({ key, label, unit, min, max, step, info }) => (
                    <div key={key}>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center space-x-1">
                          <span>{label}</span>
                          <div className="relative inline-block tooltip-container">
                            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                            <div className="tooltip absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10 pointer-events-none opacity-0 transition-opacity duration-200">
                              {info}
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {unit}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={step || 0.1}
                          min={min}
                          max={max}
                          value={features[key] ?? ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4 pt-6 border-t border-gray-200">
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
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-in">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            <div className="results-panel">
              <div className="card animate-slide-in">
                <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                  <img src="/risk_icon.png" alt="Risk Icon" className="w-8 h-8 object-contain" />
                  <span>Risk Assessment</span>
                </h3>
                
                {result ? (
                  <div className="space-y-6">
                    <RiskGauge 
                      percentage={result.percentage}
                      riskLevel={result.risk_level}
                    />
                    
                    {/* LLM Clinical Interpretation */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="font-bold text-lg mb-4 flex items-center justify-center space-x-2">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <span>Clinical Interpretation</span>
                      </h4>
                      
                      {loadingRecommendations ? (
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-center space-x-3">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            <span className="text-sm text-blue-700 font-medium">
                              Generating recommendations...
                            </span>
                          </div>
                        </div>
                      ) : recommendations ? (
                        <div>
                          <ClinicalRecommendations recommendations={recommendations} />
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-600 italic flex items-center justify-center space-x-1">
                              <Brain className="w-3 h-3" />
                              <span>AI-generated clinical guidance</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-500 text-center italic">
                            Recommendations will appear here
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow" style={{ backgroundColor: 'transparent' }}>
                      <img src="/analyze_icon.png" alt="Analyze Icon" className="w-20 h-20 object-contain" />
                    </div>
                    <p className="text-gray-500 mb-2 font-medium">Ready for Assessment</p>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                      Enter patient parameters and click "Calculate Risk" to see the prediction
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Key Risk Factors - Full Width */}
        {result && (
          <div className="card animate-slide-in">
            <h4 className="font-bold text-2xl mb-2 flex items-center justify-center space-x-2">
              <span>Key Risk Factors</span>
            </h4>
            <div className="max-w-4xl mx-auto">
              <ShapBidirectionalChart 
                shapValues={result.top_contributors || {}}
                maxDisplay={20}
              />
            </div>
            <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-blue-50 rounded-lg text-xs text-gray-700 border border-blue-100 max-w-2xl mx-auto">
              <p className="font-semibold mb-1">Understanding SHAP Values</p>
              <p><strong>SHAP values</strong> show how much each feature pushes the prediction away from the baseline. 
              Features extending <span className="text-red-600 font-semibold">right (red)</span> increase clot risk, 
              while features extending <span className="text-green-600 font-semibold">left (green)</span> decrease it.</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default Top10Page