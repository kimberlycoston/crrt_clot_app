import React, { useState } from 'react'
import { predictFull } from './apiClient.js'
import { HYPOTHETICAL_PATIENTS } from './patients.js'
import RiskGauge from './riskgauge.jsx'
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
      const response = await predictFull(patientData)
      setResult(response)
      
      // Generate LLM recommendations
      setLoadingRecommendations(true)
      try {
        const llmResponse = await generateClinicalRecommendations(response, patientData)
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
          Full Model - 57 Features
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
                    {key === 'veryHigh' ? 'Very High Risk' : key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {key === 'bleeding' && 'Over-anticoagulated'}
                    {key === 'low' && 'Stable patient'}
                    {key === 'moderate' && 'Mild inflammation'}
                    {key === 'high' && 'Rising pressures'}
                    {key === 'veryHigh' && 'Critical state'}
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
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Top 10 Contributors:</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(result.top_contributors || {})
                      .map(([feature, value]) => (
                        <div key={feature} className="flex justify-between text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-700">
                            {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`font-medium ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {value > 0 ? '+' : ''}{value.toFixed(4)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                Select a patient scenario and click "Get Prediction" to see results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoPage