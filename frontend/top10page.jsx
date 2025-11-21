import React, { useState } from 'react'
import { predictTop10 } from './apiClient.js'
import RiskGauge from './riskgauge.jsx'
import ShapBidirectionalChart from './ShapBidirectionalChart.jsx'
import ClinicalRecommendations from './ClinicalRecommendations.jsx'
import { generateClinicalRecommendations } from './llmService.js'
import { Sparkles, RotateCcw, Activity, Info, Brain, Loader2 } from 'lucide-react'

const TOP10_FEATURES = [
  { key: 'blood_flow', label: 'Blood Flow (mL/min)', unit: 'mL/min', min: 50, max: 300, info: 'Rate of blood flow through the circuit' },
  { key: 'citrate', label: 'Citrate (mEq/hr)', unit: 'mEq/hr', min: 0, max: 300, info: 'Anticoagulation rate' },
  { key: 'heparin_dose', label: 'Heparin Dose (units/hr)', unit: 'units/hr', min: 0, max: 2000, info: 'Systemic anticoagulation' },
  { key: 'phosphate', label: 'Phosphate (mg/dL)', unit: 'mg/dL', min: 1, max: 8, info: 'Serum phosphate level' },
  { key: 'fibrinogen', label: 'Fibrinogen (mg/dL)', unit: 'mg/dL', min: 100, max: 800, info: 'Coagulation factor' },
  { key: 'effluent_pressure', label: 'Effluent Pressure (mmHg)', unit: 'mmHg', min: 0, max: 200, info: 'Outlet pressure' },
  { key: 'filter_pressure', label: 'Filter Pressure (mmHg)', unit: 'mmHg', min: 50, max: 300, info: 'Transmembrane pressure' },
  { key: 'prefilter_replacement_rate', label: 'Prefilter Replacement (mL/hr)', unit: 'mL/hr', min: 0, max: 1500, info: 'Pre-dilution rate' },
  { key: 'creatinine', label: 'Creatinine (mg/dL)', unit: 'mg/dL', min: 0.5, max: 8, info: 'Renal function marker' },
  { key: 'replacement_rate', label: 'Replacement Rate (mL/hr)', unit: 'mL/hr', min: 0, max: 2000, info: 'Total replacement fluid' }
]

const DEFAULT_VALUES = {
  blood_flow: 200,
  citrate: 200,
  heparin_dose: 800,
  phosphate: 3.5,
  fibrinogen: 350,
  effluent_pressure: 75,
  filter_pressure: 125,
  prefilter_replacement_rate: 500,
  creatinine: 2.5,
  replacement_rate: 700
}

function Top10Page() {
  const [features, setFeatures] = useState(DEFAULT_VALUES)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const handleInputChange = (feature, value) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: parseFloat(value) || 0
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRecommendations(null)
    
    try {
      // Get prediction from backend
      const response = await predictTop10(features)
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
    setResult(null)
    setError(null)
    setRecommendations(null)
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
            Primary Risk Indicators
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
                  <Activity className="w-6 h-6 text-blue-600" />
                  <span>Patient Parameters</span>
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {TOP10_FEATURES.map(({ key, label, unit, min, max, info }) => (
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
                          step="0.1"
                          min={min}
                          max={max}
                          value={features[key]}
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
                  <img src="/crrt_icon.png" alt="CRRT Icon" className="w-8 h-8 object-contain" />
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
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                      <Activity className="w-10 h-10 text-blue-600" />
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
                maxDisplay={10}
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