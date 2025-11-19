import React, { useState } from 'react'
import { predictTop10 } from './apiClient.js'
import RiskGauge from './riskgauge.jsx'

const TOP10_FEATURES = [
  'blood_flow',
  'citrate',
  'heparin_dose',
  'phosphate',
  'fibrinogen',
  'effluent_pressure',
  'filter_pressure',
  'prefilter_replacement_rate',
  'creatinine',
  'replacement_rate'
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
    
    try {
      const response = await predictTop10(features)
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
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Quick Input - Top 10 Features
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Enter Patient Data</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {TOP10_FEATURES.map(feature => (
                <div key={feature}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={features[feature]}
                    onChange={(e) => handleInputChange(feature, e.target.value)}
                    className="input-field"
                    required
                  />
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
                  <h4 className="font-semibold mb-2">Top Contributors:</h4>
                  <div className="space-y-2">
                    {Object.entries(result.top_contributors || {})
                      .slice(0, 5)
                      .map(([feature, value]) => (
                        <div key={feature} className="flex justify-between text-sm">
                          <span>{feature.replace(/_/g, ' ')}</span>
                          <span className={value > 0 ? 'text-red-600' : 'text-blue-600'}>
                            {value > 0 ? '+' : ''}{value.toFixed(4)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-12">
                Enter patient data and click "Get Prediction" to see results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Top10Page

