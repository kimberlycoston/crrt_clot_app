import React from 'react'
import GaugeChart from 'react-gauge-chart'

function RiskGauge({ percentage, riskLevel }) {
  const getGaugeColors = () => {
    if (riskLevel === 'low') {
      return ['#10B981', '#34D399', '#6EE7B7'] // Green shades
    } else if (riskLevel === 'moderate') {
      return ['#F59E0B', '#FBBF24', '#FCD34D'] // Yellow/Orange shades
    } else {
      return ['#EF4444', '#F87171', '#FCA5A5'] // Red shades
    }
  }

  const getRiskColor = () => {
    if (riskLevel === 'low') return 'text-green-600'
    if (riskLevel === 'moderate') return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md">
        <GaugeChart
          id="risk-gauge"
          nrOfLevels={3}
          colors={getGaugeColors()}
          arcWidth={0.3}
          percent={percentage / 100}
          textColor="#000000"
          needleColor="#4B5563"
          formatTextValue={() => `${percentage.toFixed(1)}%`}
        />
      </div>
      
      <div className="mt-4 text-center">
        <div className={`text-2xl font-bold ${getRiskColor()}`}>
          {riskLevel.toUpperCase()} RISK
        </div>
        <div className="text-gray-600 mt-1">
          {percentage.toFixed(1)}% probability of clot formation
        </div>
      </div>
    </div>
  )
}

export default RiskGauge

