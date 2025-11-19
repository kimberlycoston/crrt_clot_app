import React, { useState } from 'react'
import { predictFull } from './apiClient'
import { HYPOTHETICAL_PATIENTS } from './patients.js'
import RiskGauge from './riskgauge.jsx'

function Full57Page() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handlePatientSelect = (patientKey) => {
    setSelectedPatient(patientKey)
    setResult(null)
    setError(null)
  }

  const handlePredict = async () => {
    if (!selectedPatient) return
    
    setLoading(true)
    setError(null)
    
    try {
      const patientData = HYPOTHETICAL_PATIENTS[selectedPatient]
      const response = await predictFull(patientData)
      setResult(response)
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
                    {key === 'low' && 'Stable patient'}
                    {key === 'moderate' && 'Mild inflammation'}
                    {key === 'high' && 'Rising pressures'}
                    {key === 'veryHigh' && 'Critical state'}
                    {key === 'bleeding' && 'Over-anticoagulated'}
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
                Select a patient scenario and click "Get Prediction" to see results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Full57Page

