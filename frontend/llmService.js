/**
 * LLM Service for generating clinical recommendations using backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generate clinical recommendations based on prediction results
 * @param {Object} predictionResult - The prediction result from the API
 * @param {Object} features - The input features used for prediction
 * @returns {Promise<Object>} - Structured clinical recommendations
 */
export async function generateClinicalRecommendations(predictionResult, features) {
  const { percentage, risk_level, top_contributors } = predictionResult;
  
  // Build the prompt with clinical context
  const prompt = buildClinicalPrompt(percentage, risk_level, top_contributors, features);
  
  try {
    // Call backend endpoint
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend API Error:", errorData);
      throw new Error(`Backend API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.response;
    
    // Parse the JSON response
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", content);
      throw new Error("Invalid response format from AI");
    }
    
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw new Error(error.message || "Failed to generate clinical recommendations");
  }
}

/**
 * Build the clinical prompt for the LLM
 */
function buildClinicalPrompt(percentage, riskLevel, topContributors, features) {
  // Separate positive (increasing risk) and negative (decreasing risk) factors
  const riskIncreasing = [];
  const riskDecreasing = [];
  
  Object.entries(topContributors).forEach(([feature, shapValue]) => {
    const actualValue = features[feature];
    if (shapValue > 0) {
      riskIncreasing.push({ feature, shapValue, value: actualValue });
    } else {
      riskDecreasing.push({ feature, shapValue, value: actualValue });
    }
  });

  // Sort by absolute SHAP value
  riskIncreasing.sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
  riskDecreasing.sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));

  // Build feature descriptions
  const increasingFactorsText = riskIncreasing
    .map(({ feature, shapValue, value }) => 
      `- ${formatFeatureName(feature)}: ${value} (SHAP: +${shapValue.toFixed(3)})`
    )
    .join('\n');

  const decreasingFactorsText = riskDecreasing
    .map(({ feature, shapValue, value }) => 
      `- ${formatFeatureName(feature)}: ${value} (SHAP: ${shapValue.toFixed(3)})`
    )
    .join('\n');

  const anticoagStatus = assessAnticoagulationStatus(features);

  return `You are an expert nephrologist specializing in CRRT (Continuous Renal Replacement Therapy) in the ICU. You are reviewing a machine learning-based CRRT clot risk prediction to provide clinical guidance on adjusting modifiable risk factors for clotting.

PATIENT DATA:
- Predicted Clot Risk: ${percentage.toFixed(1)}% (${riskLevel.toUpperCase()})
- Anticoagulation: ${anticoagStatus}

RISK FACTORS (from SHAP analysis):
Increasing risk:
${increasingFactorsText || 'None identified'}

Decreasing risk:
${decreasingFactorsText || 'None identified'}

REFERENCE RANGES:
- PTT: 60-90s is therapeutic for heparin (below 60s = subtherapeutic, above 90s = over-anticoagulated)

CLINICAL RULES:
1. Use your clinical judgment to determine the best course of action based on the patient's data
2. ONLY recommend changes to modifiable CRRT parameters and risk factors
3. ANTICOAGULATION: Patients use EITHER citrate OR heparin, NEVER both simultaneously
   - If patient is on citrate: adjust citrate dose, do not add heparin
   - If patient is on heparin: adjust heparin dose based on PTT (target 60-90s), do not add citrate
   - Switching anticoagulation (e.g., heparin → citrate) may be considered if current regimen is inadequate despite optimization
4. Match intervention intensity to risk level:
   - LOW (<35%): Maintenance only, acknowledge good control
   - MODERATE (35-65%): Targeted adjustments to top risk factors
   - HIGH (>65%): More aggressive but still safe interventions

Generate 2-4 recommendations. Respond with ONLY valid JSON, no markdown:

{
  "summary": "Brief clinical interpretation in one sentence",
  "recommendations": [
    {
      "priority": 1,
      "parameter": "Parameter name",
      "currentValue": "Current value with units",
      "recommendedAction": "Specific action to take",
      "rationale": "Why this helps reduce clot risk",
      "targetingFactor": "feature_name_from_shap"
    }
  ]
}`;
}

/**
 * Assess anticoagulation status based on available parameters
 */
function assessAnticoagulationStatus(features) {
  const citrate = features.citrate || 0;
  const heparin = features.heparin_dose || 0;
  const ptt = features.ptt || 0;
  
  // Check mode flags
  const modeHeparin = features.mode_heparin === 1;
  const modeCitrate = features.mode_citrate === 1;
  const modeNone = features.mode_none === 1;
  
  if (modeNone) {
    return `None`;
  }
  
  if (modeCitrate) {
    return `Citrate (${citrate} mEq/hr)`;
  }
  
  if (modeHeparin) {
    return `Heparin (${heparin} units/hr, PTT: ${ptt}s)`;
  }
  
  // Fallback if no mode flags
  if (citrate > 50) {
    return `Citrate (${citrate} mEq/hr)`;
  } else if (heparin > 100) {
    return `Heparin (${heparin} units/hr, PTT: ${ptt}s)`;
  } else {
    return `None detected`;
  }
}

/**
 * Format feature names for better readability
 */
function formatFeatureName(feature) {
  const nameMap = {
    'blood_flow': 'Blood Flow',
    'citrate': 'Citrate Rate',
    'heparin_dose': 'Heparin Dose',
    'phosphate': 'Serum Phosphate',
    'fibrinogen': 'Fibrinogen',
    'effluent_pressure': 'Effluent Pressure',
    'filter_pressure': 'Filter Pressure',
    'prefilter_replacement_rate': 'Prefilter Replacement Rate',
    'creatinine': 'Creatinine',
    'replacement_rate': 'Total Replacement Rate',
    'return_pressure': 'Return Pressure',
    'effluent_bloodflow_ratio': 'Effluent/Blood Flow Ratio',
    'dialysate_rate': 'Dialysate Rate',
    'postfilter_replacement_rate': 'Postfilter Replacement Rate',
    'ptt': 'PTT',
    'platelet_wbc_ratio': 'Platelet/WBC Ratio',
    'ldh': 'LDH',
    'mode_none': 'No Anticoagulation Mode',
    'mode_heparin': 'Heparin Mode',
    'mode_citrate': 'Citrate Mode',
    'creatinine_change': 'Creatinine Change'
  };
  
  return nameMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if backend API is reachable
 */
export function checkApiConfiguration() {
  console.log(`✅ Backend API configured at: ${API_BASE_URL}`);
  return true;
}