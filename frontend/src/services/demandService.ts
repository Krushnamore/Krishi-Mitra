const API_BASE_URL = "http://127.0.0.1:8000";

export const uploadExcelFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-excel`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Excel upload failed");
  }

  return response.json();
};

export const predictDemand = async (
  season: string,
  weather: string,
  product: string
) => {
  const params = new URLSearchParams({
    season,
    weather,
    product,
  });

  const response = await fetch(
    `${API_BASE_URL}/predict-demand?${params.toString()}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Prediction failed");
  }

  return response.json();
};
