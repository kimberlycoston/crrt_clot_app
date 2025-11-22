/**
 * LLM Service for generating clinical recommendations using OpenAI
 */

// Configuration: Check if running in production with API key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || null;
const IS_PRODUCTION = !!OPENAI_API_KEY;

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
    // Check if API key is available
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a nephrology critical care assistant providing evidence-based guidance for CRRT management. Always respond with valid JSON only, no additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API Error:", errorData);
      
      if (response.status === 401) {
        throw new Error("Invalid OpenAI API key. Please check your .env file.");
      }
      if (response.status === 429) {
        throw new Error("OpenAI API rate limit exceeded. Please try again later.");
      }
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
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
      `- ${formatFeatureName(feature)}: ${value} (SHAP impact: +${shapValue.toFixed(3)})`
    )
    .join('\n');

  const decreasingFactorsText = riskDecreasing
    .map(({ feature, shapValue, value }) => 
      `- ${formatFeatureName(feature)}: ${value} (SHAP impact: ${shapValue.toFixed(3)})`
    )
    .join('\n');

  // Assess anticoagulation status
  const citrate = features.citrate || 0;
  const heparin = features.heparin_dose || 0;
  const ptt = features.ptt || 0;
  const inr = features.inr || 0;
  
  const anticoagStatus = assessAnticoagulationStatus(citrate, heparin, ptt, inr);

  return `PATIENT RISK ASSESSMENT:
- Clot Formation Risk: ${percentage.toFixed(1)}% (${riskLevel.toUpperCase()} RISK)
- Anticoagulation Status: ${anticoagStatus}

KEY FACTORS INCREASING CLOT RISK:
${increasingFactorsText || 'None identified'}

KEY FACTORS DECREASING CLOT RISK:
${decreasingFactorsText || 'None identified'}

CRITICAL CLINICAL CONSIDERATIONS:
1. Risk Level Context:
   - LOW risk (<25%): Use conservative interventions. Patient is already well-managed.
   - MODERATE risk (25-50%): Standard interventions appropriate.
   - HIGH risk (>50%): More aggressive interventions may be needed.

2. Anticoagulation Balance:
   - If PTT >45 or INR >1.5 or citrate >200 or heparin >1000: Patient may be OVER-ANTICOAGULATED
   - NEVER recommend increasing anticoagulation if patient is already over-anticoagulated
   - Consider DECREASING anticoagulation if bleeding risk indicators present
   - Balance clot prevention with bleeding risk

3. Pressure Management:
   - High filter pressure (>200 mmHg) increases clot risk
   - Low pressures may indicate over-anticoagulation or under-filtration
   - Consider the clinical context

INSTRUCTIONS:
Generate 2-4 clinically appropriate, actionable recommendations.

FOR LOW RISK PATIENTS (<25%):
- Acknowledge patient is well-managed
- Suggest MAINTENANCE or minor optimizations only
- Do NOT recommend aggressive interventions
- Focus on monitoring and sustaining current good outcomes

FOR MODERATE/HIGH RISK:
- Focus on modifiable parameters with highest positive SHAP values
- Prioritize safe, evidence-based interventions
- Consider the anticoagulation status before recommending changes

MODIFIABLE PARAMETERS:
- Blood flow rate adjustments
- Anticoagulation (citrate, heparin) optimization - BUT RESPECT ANTICOAGULATION STATUS
- Replacement/dialysate rate modifications
- Filter pressure management

NEVER RECOMMEND:
- Increasing anticoagulation if patient is over-anticoagulated
- Changes to lab values that cannot be directly controlled (phosphate, fibrinogen, creatinine)
- Aggressive interventions for LOW risk patients

REQUIRED JSON FORMAT - respond ONLY with valid JSON, no markdown:
{
  "summary": "One sentence clinical overview considering risk level and anticoagulation status",
  "recommendations": [
    {
      "priority": 1,
      "parameter": "Filter Pressure",
      "currentValue": "200 mmHg",
      "recommendedAction": "Monitor and maintain current levels",
      "rationale": "Brief clinical explanation considering context",
      "targetingFactor": "filter_pressure"
    }
  ]
}

Each recommendation must be clinically appropriate given the risk level and anticoagulation status. For LOW risk patients, focus on maintenance rather than aggressive changes.`;
}

/**
 * Assess anticoagulation status based on available parameters
 */
function assessAnticoagulationStatus(citrate, heparin, ptt, inr) {
    // Determine which anticoagulation method is being used
    const usingCitrate = citrate > 50; // Threshold for active citrate use
    const usingHeparin = heparin > 100; // Threshold for active heparin use
    
    // Flag if both are being used (unusual/dangerous)
    if (usingCitrate && usingHeparin) {
      return `WARNING: Both citrate (${citrate}) and heparin (${heparin}) detected - unusual dual anticoagulation`;
    }
    
    const issues = [];
    
    // Assess based on which method is being used
    if (usingCitrate) {
      // Citrate anticoagulation assessment
      if (citrate > 250) {
        issues.push(`Very high citrate (${citrate} mEq/hr)`);
      } else if (citrate > 200) {
        issues.push(`High citrate (${citrate} mEq/hr)`);
      }
      
      // PTT/INR less relevant with citrate, but still check
      if (ptt > 50) issues.push(`PTT elevated (${ptt}s)`);
      if (inr > 1.8) issues.push(`INR elevated (${inr})`);
      
      if (issues.length >= 2) {
        return `OVER-ANTICOAGULATED (Citrate) - ${issues.join(', ')}. BLEEDING RISK.`;
      } else if (issues.length === 1) {
        return `Possible over-anticoagulation (Citrate) - ${issues[0]}`;
      } else if (citrate < 150) {
        return `Citrate anticoagulation - may be subtherapeutic (${citrate} mEq/hr)`;
      } else {
        return `Citrate anticoagulation - therapeutic range (${citrate} mEq/hr)`;
      }
    } else if (usingHeparin) {
      // Heparin anticoagulation assessment
      if (heparin > 1200) {
        issues.push(`Very high heparin (${heparin} units/hr)`);
      } else if (heparin > 1000) {
        issues.push(`High heparin (${heparin} units/hr)`);
      }
      
      // PTT is key for heparin monitoring
      if (ptt > 80) {
        issues.push(`PTT critically elevated (${ptt}s)`);
      } else if (ptt > 60) {
        issues.push(`PTT elevated (${ptt}s)`);
      }
      
      if (inr > 1.8) issues.push(`INR elevated (${inr})`);
      
      if (issues.length >= 2) {
        return `OVER-ANTICOAGULATED (Heparin) - ${issues.join(', ')}. BLEEDING RISK.`;
      } else if (issues.length === 1) {
        return `Possible over-anticoagulation (Heparin) - ${issues[0]}`;
      } else if (ptt < 30 && heparin < 500) {
        return `Heparin anticoagulation - likely subtherapeutic (PTT: ${ptt}s, Heparin: ${heparin} units/hr)`;
      } else if (ptt >= 45 && ptt <= 60) {
        return `Heparin anticoagulation - therapeutic range (PTT: ${ptt}s)`;
      } else {
        return `Heparin anticoagulation - monitor PTT (current: ${ptt}s)`;
      }
    } else {
      // No anticoagulation or very minimal
      return `Minimal/no anticoagulation detected (Citrate: ${citrate}, Heparin: ${heparin})`;
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
    'replacement_rate': 'Total Replacement Rate'
  };
  
  return nameMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if API is properly configured
 */
export function checkApiConfiguration() {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API key not found!");
    console.warn("Please set VITE_OPENAI_API_KEY in your .env file");
    return false;
  }
  
  console.log("✅ OpenAI API key configured");
  return true;
}