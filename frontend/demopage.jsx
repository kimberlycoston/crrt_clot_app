import React, { useState } from 'react'
import { predictTop20 } from './apiClient.js'
import { HYPOTHETICAL_PATIENTS } from './patients.js'
import RiskGauge from './riskgauge.jsx'
import ShapBidirectionalChart from './ShapBidirectionalChart.jsx'
import ClinicalRecommendations from './ClinicalRecommendations.jsx'
import { generateClinicalRecommendations } from './llmService.js'
import { Brain, Loader2 } from 'lucide-react'

function DemoPage() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const handlePatientSelect = (patientKey) => {
    setSelectedPatient(patientKey)
    setResult(null)
    setError(null)
    setRecommendations(null)
  }

  const handlePredict = async () => {
    if (!selectedPatient) return
    
    setLoading(true)
    setError(null)
    setRecommendations(null)
    
    try {
      const patientData = HYPOTHETICAL_PATIENTS[selectedPatient]
      
      // Clean and transform the patient data
      const payload = {}
      
      // Determine anticoagulation mode from patient data
      const hasCitrate = patientData.citrate && patientData.citrate > 0
      const hasHeparin = patientData.heparin_dose && patientData.heparin_dose > 0
      
      if (hasCitrate && !hasHeparin) {
        payload.mode_heparin = 0
        payload.mode_citrate = 1
        payload.mode_none = 0
        payload.citrate = parseFloat(patientData.citrate) || 0
        payload.heparin_dose = 0
      } else if (hasHeparin && !hasCitrate) {
        payload.mode_heparin = 1
        payload.mode_citrate = 0
        payload.mode_none = 0
        payload.heparin_dose = parseFloat(patientData.heparin_dose) || 0
        payload.citrate = 0
      } else {
        // Neither or both - default to none
        payload.mode_heparin = 0
        payload.mode_citrate = 0
        payload.mode_none = 1
        payload.heparin_dose = 0
        payload.citrate = 0
      }
      
      // Add all other features, converting null/undefined/empty to 0
      Object.keys(patientData).forEach(key => {
        // Skip mode flags and anticoagulation values (already handled above)
        if (['mode_heparin', 'mode_citrate', 'mode_none', 'heparin_dose', 'citrate'].includes(key)) {
          return
        }
        
        const value = patientData[key]
        if (value === '' || value === null || value === undefined) {
          payload[key] = 0
        } else {
          payload[key] = typeof value === 'number' ? value : parseFloat(value) || 0
        }
      })
      
      const response = await predictTop20(payload)
      setResult(response)
      
      // Generate LLM recommendations
      setLoadingRecommendations(true)
      try {
        const llmResponse = await generateClinicalRecommendations(response, payload)
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

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Demo Scenarios
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Select Patient Scenario</h3>
            
            <div className="space-y-3 mb-6">
              {Object.keys(HYPOTHETICAL_PATIENTS).map(key => (
                <button
                  key={key}
                  onClick={() => handlePatientSelect(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedPatient === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold capitalize">
                    {key.charAt(0).toUpperCase() + key.slice(1)} Risk
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {key === 'low' && 'Stable patient, good anticoagulation'}
                    {key === 'moderate' && 'Some concerning factors'}
                    {key === 'high' && 'Multiple high-risk factors'}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handlePredict}
              disabled={!selectedPatient || loading}
              className="btn-primary w-full"
            >
              {loading ? 'Predicting...' : 'Get Prediction'}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Prediction Results</h3>
            
            {result ? (
              <div className="space-y-4">
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
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                Select a patient scenario and click "Get Prediction" to see results
              </div>
            )}
          </div>
        </div>

        {/* SHAP Chart - Full Width Below */}
        {result && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h4 className="font-bold text-2xl mb-2 flex items-center justify-center space-x-2">
              <span>Key Risk Factors</span>
            </h4>
            <div className="max-w-4xl mx-auto">
              <ShapBidirectionalChart 
                shapValues={Object.fromEntries(
                  Object.entries(result.top_contributors || {}).filter(
                    ([key]) => !['mode_none', 'mode_heparin', 'mode_citrate'].includes(key)
                  )
                )}
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
  )
}

export default DemoPage