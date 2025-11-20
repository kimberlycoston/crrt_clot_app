import React from 'react'
import GaugeChart from 'react-gauge-chart'

function RiskGauge({ percentage, riskLevel }) {
  const getRiskColor = () => {
    if (riskLevel === 'low') return 'text-green-600'
    if (riskLevel === 'moderate') return 'text-yellow-500'
    return 'text-red-600'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md">
        <GaugeChart
          id="risk-gauge"
          nrOfLevels={3}
          colors={['green', '#e6c430', '#EF4444']} // Always green, yellow, red
          arcWidth={0.3}
          percent={percentage / 100}
          hideText={true}
          needleColor="#4B5563"
        />
      </div>
      
      <div className="mt-2 text-center">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {percentage.toFixed(1)}%
        </div>
        <div className={`text-2xl font-bold ${getRiskColor()}`}>
          {riskLevel.toUpperCase()} RISK
        </div>
        <div className="text-gray-600 mt-1">
          Probability of clot formation
        </div>
      </div>
    </div>
  )
}

export default RiskGauge