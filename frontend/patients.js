// Hypothetical patient data for demonstrations
// Moderate is based on exact Quick Input values that produce 38% risk
// Low and High are adjusted from that baseline
export const HYPOTHETICAL_PATIENTS = {
  low: {
    // LOW RISK (target ~20%) - adjusted from moderate baseline
    // Increase protective factors, decrease risk factors  
    blood_flow: 200,
    citrate: 0,
    creatinine: 2.5,
    creatinine_change: 0,
    dialysate_rate: 1500,
    effluent_bloodflow_ratio: 0.55,    // INCREASED from 0.37 (higher = more risk)
    effluent_pressure: 40,              // DECREASED from 75 (lower = more risk)
    fibrinogen: 350,
    filter_pressure: 125,
    heparin_dose: 500,                  // DECREASED from 800 (lower = more risk)
    ldh: 300,
    phosphate: 3.5,
    platelet_wbc_ratio: 0.05,           // DECREASED from 0.1 (lower = more risk)
    postfilter_replacement_rate: 200,
    prefilter_replacement_rate: 800,    // INCREASED from 500 (higher = more risk)
    ptt: 35,                            // DECREASED - subtherapeutic
    replacement_rate: 700,
    return_pressure: 100                // DECREASED from 150 (lower = more risk)          // INCREASED from 150 (higher = less risk)
  },

  moderate: {
    // MODERATE RISK (~38%) - exact values from Quick Input
    blood_flow: 200,
    citrate: 0,
    creatinine: 2.5,
    creatinine_change: 0,
    dialysate_rate: 1500,
    effluent_bloodflow_ratio: 0.37,
    effluent_pressure: 75,
    fibrinogen: 350,
    filter_pressure: 125,
    heparin_dose: 800,
    ldh: 300,
    phosphate: 3.5,
    platelet_wbc_ratio: 0.1,
    postfilter_replacement_rate: 200,
    prefilter_replacement_rate: 500,
    ptt: 38,
    replacement_rate: 700,
    return_pressure: 150
  },

  high: {
    // HIGH RISK (target ~70%) - adjusted from moderate baseline
    // Decrease protective factors, increase risk factors
    blood_flow: 200,
    citrate: 0,
    creatinine: 2.5,
    creatinine_change: 0,
    dialysate_rate: 1500,
    effluent_bloodflow_ratio: 0.25,    // DECREASED from 0.37 (lower = less risk)
    effluent_pressure: 120,             // INCREASED from 75 (higher = less risk)
    fibrinogen: 350,
    filter_pressure: 125,
    heparin_dose: 1000,                 // INCREASED from 800 (higher = less risk)
    ldh: 300,
    phosphate: 3.5,
    platelet_wbc_ratio: 0.15,           // INCREASED from 0.1 (higher = less risk)
    postfilter_replacement_rate: 200,
    prefilter_replacement_rate: 300,    // DECREASED from 500 (lower = less risk)
    ptt: 70,                            // INCREASED - therapeutic range
    replacement_rate: 700,
    return_pressure: 180 
  }
};