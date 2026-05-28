export interface DemandPredictionResult {
  product: string;
  season: string;
  weather: string;
  predicted_demand_score: number;
  recommendation: string;
}
