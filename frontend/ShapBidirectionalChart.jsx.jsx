import React from 'react'

function ShapBidirectionalChart({ shapValues = {}, maxDisplay = 10 }) {
  // Convert shapValues object to array and sort by absolute value
  const sortedFeatures = Object.entries(shapValues)
    .map(([feature, value]) => ({
      feature: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: parseFloat(value) || 0
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, maxDisplay)

  if (sortedFeatures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No SHAP values available
      </div>
    )
  }

  // Find the maximum absolute value for scaling
  const maxAbsValue = Math.max(...sortedFeatures.map(f => Math.abs(f.value)))

  return (
    <div className="space-y-3">
      {/* Axis Labels */}
      <div className="flex items-center justify-between text-md font-bold mb-2 px-1">
        <span className="text-green-600">← Decreases Risk</span>
        <span className="text-red-600">Increases Risk →</span>
      </div>

      {/* Feature Bars */}
      {sortedFeatures.map(({ feature, value }, index) => {
        const isPositive = value >= 0
        const widthPercent = (Math.abs(value) / maxAbsValue) * 100
        
        return (
          <div 
            key={index} 
            className="group"
          >
            {/* Feature Label and Value */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-md font-medium text-gray-700 capitalize">
                {feature}
              </span>
              <span className={`text-md font-semibold ${
                isPositive ? 'text-red-600' : 'text-green-600'
              }`}>
                {value >= 0 ? '+' : ''}{value.toFixed(2)}
              </span>
            </div>

            {/* Bidirectional Bar */}
            <div className="flex items-center gap-0">
              {/* Left side - for negative values */}
              <div className="flex-1 flex justify-end pr-0.5">
                {!isPositive && (
                  <div 
                    className="h-8 bg-gradient-to-l from-green-500 to-green-600 rounded-l transition-all duration-300 group-hover:from-green-600 group-hover:to-green-700"
                    style={{ width: `${widthPercent}%` }}
                  />
                )}
              </div>
              
              {/* Center line */}
              <div className="w-0.5 h-8 bg-gray-300 flex-shrink-0" />
              
              {/* Right side - for positive values */}
              <div className="flex-1 pl-0.5">
                {isPositive && (
                  <div 
                    className="h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-r transition-all duration-300 group-hover:from-red-600 group-hover:to-red-700"
                    style={{ width: `${widthPercent}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ShapBidirectionalChart