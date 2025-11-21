import React from 'react'
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'

function ClinicalRecommendations({ recommendations }) {
  if (!recommendations || !recommendations.recommendations) {
    return null
  }

  const { summary, recommendations: recs } = recommendations

  const getPriorityColor = (priority) => {
    if (priority === 1) return 'border-red-400 bg-red-50'
    if (priority === 2) return 'border-orange-400 bg-orange-50'
    if (priority === 3) return 'border-yellow-400 bg-yellow-50'
    return 'border-blue-400 bg-blue-50'
  }

  const getPriorityBadge = (priority) => {
    if (priority === 1) return 'bg-red-100 text-red-800 border-red-300'
    if (priority === 2) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (priority === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-blue-100 text-blue-800 border-blue-300'
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">{summary}</p>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        {recs.map((rec, index) => (
          <div
            key={index}
            className={`border-l-4 rounded-lg p-4 transition-all hover:shadow-md ${getPriorityColor(rec.priority)}`}
          >
            {/* Header with Priority Badge */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getPriorityBadge(rec.priority)}`}>
                  Priority {rec.priority}
                </span>
                <h5 className="font-bold text-gray-900">{rec.parameter}</h5>
              </div>
            </div>

            {/* Current vs Recommended */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div className="bg-white/60 rounded p-2 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Current</p>
                <p className="font-semibold text-gray-900">{rec.currentValue}</p>
              </div>
              <div className="bg-white/80 rounded p-2 border border-green-300">
                <p className="text-xs text-green-700 font-medium mb-1">Recommended</p>
                <p className="font-semibold text-green-900">{rec.recommendedAction}</p>
              </div>
            </div>

            {/* Rationale */}
            <p className="text-sm text-gray-700 leading-relaxed mb-2">
              {rec.rationale}
            </p>

            {/* Targeting Factor */}
            {rec.targetingFactor && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3" />
                <span>Addresses: <span className="font-medium">{rec.targetingFactor}</span></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClinicalRecommendations