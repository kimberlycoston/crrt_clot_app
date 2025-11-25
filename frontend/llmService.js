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
  // Determine which anticoagulation mode is active
  const modeHeparin = features.mode_heparin === 1;
  const modeCitrate = features.mode_citrate === 1;
  const modeNone = features.mode_none === 1;
  
  // Filter out the irrelevant anticoagulant from top contributors
  // This prevents the LLM from thinking both are being used
  const filteredContributors = { ...topContributors };
  
  if (modeHeparin) {
    // Patient is on heparin - remove citrate from factors
    delete filteredContributors.citrate;
    delete filteredContributors.mode_citrate;
  } else if (modeCitrate) {
    // Patient is on citrate - remove heparin from factors
    delete filteredContributors.heparin_dose;
    delete filteredContributors.mode_heparin;
  } else if (modeNone) {
    // No anticoagulation - remove both
    delete filteredContributors.citrate;
    delete filteredContributors.heparin_dose;
    delete filteredContributors.mode_citrate;
    delete filteredContributors.mode_heparin;
  }
  
  // Remove mode flags from display - they confuse the LLM
  delete filteredContributors.mode_heparin;
  delete filteredContributors.mode_citrate;
  delete filteredContributors.mode_none;

  // Separate positive (increasing risk) and negative (decreasing risk) factors
  const riskIncreasing = [];
  const riskDecreasing = [];
  
  Object.entries(filteredContributors).forEach(([feature, shapValue]) => {
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
  
  RISK FACTORS (from SHAP analysis, listed in order of impact):
  Factors INCREASING clot risk (address these first):
  ${increasingFactorsText || 'None identified'}
  
  Factors DECREASING clot risk (these are protective):
  ${decreasingFactorsText || 'None identified'}
  
  REFERENCE RANGES:
  - PTT: 60-90s is therapeutic for heparin (below 60s = subtherapeutic, above 90s = over-anticoagulated)
  - Heparin dose: 500-1000 units/hr typical range
  - Citrate: 150-200 mEq/hr typical range
  - Blood flow: 150-250 mL/min typical
  - Filter pressure: <200 mmHg preferred (>250 mmHg = high clot risk)
  
  CLINICAL RULES:
  1. PRIORITIZE recommendations that target the top "Factors INCREASING clot risk" - these have the highest SHAP values and are driving the clot risk UP
  2. Each recommendation should directly address one of the listed risk-increasing factors when possible
  3. Do not recommend changes to Low Risk patients (less than 35% risk)
  4. ONLY recommend changes to modifiable CRRT parameters (not lab values like fibrinogen or creatinine)
  5. ANTICOAGULATION: Patients use EITHER citrate OR heparin, NEVER both simultaneously
     - If patient is on heparin: adjust dose based on PTT (target 60-90s)
     - If patient is on citrate: adjust citrate dose only
  6. Match intervention intensity to risk level:
     - LOW (<35%): Maintenance only, acknowledge good control and do not recommend changes to any parameters
     - MODERATE (35-65%): Targeted adjustments to top 2-3 risk factors
     - HIGH (>65%): More aggressive interventions on multiple risk factors
  
  Generate 2-4 recommendations for moderate and high risk patients. Each recommendation MUST target a specific factor from the "Factors INCREASING clot risk" list. Respond with ONLY valid JSON, no markdown:
  
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