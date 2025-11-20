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
 * @returns {Promise<string>} - Clinical recommendations text
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
        model: "gpt-4o-mini", // or "gpt-4o" for better quality
        messages: [
          {
            role: "system",
            content: "You are a nephrology critical care assistant providing evidence-based guidance for CRRT management. Provide concise, actionable clinical recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
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
    return data.choices[0].message.content;
    
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
1. Provide 3-4 concise, actionable recommendations focusing on MODIFIABLE parameters that are increasing clot risk
2. Prioritize the factors with the highest SHAP values (greatest impact on prediction)
3. Consider clinical safety - only suggest changes within safe ranges
4. Be specific about direction of change (increase/decrease) and approximate targets when appropriate
5. Use clear, professional medical language suitable for ICU clinicians

Focus on modifiable parameters such as:
- Blood flow rate adjustments
- Anticoagulation (citrate, heparin) optimization  
- Replacement/dialysate rate modifications
- Filter pressure management

Do NOT make recommendations about lab values or patient physiology that cannot be directly modified through CRRT settings.

Format your response as a brief paragraph (3-5 sentences) with clear, prioritized recommendations. Be concise and actionable.`;
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
