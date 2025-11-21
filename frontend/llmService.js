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

  return `PATIENT RISK ASSESSMENT:
- Clot Formation Risk: ${percentage.toFixed(1)}% (${riskLevel.toUpperCase()} RISK)

KEY FACTORS INCREASING CLOT RISK:
${increasingFactorsText || 'None identified'}

KEY FACTORS DECREASING CLOT RISK:
${decreasingFactorsText || 'None identified'}

INSTRUCTIONS:
Generate 3-4 concise, actionable recommendations focusing on MODIFIABLE parameters that are increasing clot risk.

Prioritize factors with highest SHAP values. Consider clinical safety - only suggest changes within safe ranges.

Focus on modifiable parameters such as:
- Blood flow rate adjustments
- Anticoagulation (citrate, heparin) optimization  
- Replacement/dialysate rate modifications
- Filter pressure management

Do NOT make recommendations about lab values or patient physiology that cannot be directly modified through CRRT settings.

REQUIRED JSON FORMAT - respond ONLY with valid JSON, no markdown, no other text:
{
  "summary": "One sentence overview of the clinical situation",
  "recommendations": [
    {
      "priority": 1,
      "parameter": "Filter Pressure",
      "currentValue": "200 mmHg",
      "recommendedAction": "Decrease to <150 mmHg",
      "rationale": "Brief explanation of why this reduces clot risk",
      "targetingFactor": "filter_pressure"
    }
  ]
}

Each recommendation must be specific, actionable, and include numeric targets when appropriate. Order by priority (1 = highest).`;
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