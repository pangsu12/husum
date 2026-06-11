export type HeatAlertStatus = "none" | "advisory" | "warning";

export type WeatherAlertApiData = {
  heatAlertStatus: HeatAlertStatus;
  heatRiskLevel?: "높음" | "매우 높음";
};

declare const process: {
  env: {
    EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY?: string;
  };
};

const SPECIAL_WEATHER_API_KEY = process.env.EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY?.trim();
const WEATHER_ALERT_API_URL = "https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnList";

function toAlertItems(payload: unknown): Array<Record<string, unknown>> {
  const body = payload as {
    response?: {
      body?: {
        items?: {
          item?: Array<Record<string, unknown>> | Record<string, unknown>;
        };
      };
    };
  };
  const item = body.response?.body?.items?.item;

  if (Array.isArray(item)) return item;
  if (item) return [item];
  return [];
}

function hasHeatAlertText(item: Record<string, unknown>) {
  return Object.values(item).some((value) => typeof value === "string" && value.includes("폭염"));
}

function isWarningText(item: Record<string, unknown>) {
  return Object.values(item).some((value) => typeof value === "string" && value.includes("경보"));
}

function isAdvisoryText(item: Record<string, unknown>) {
  return Object.values(item).some((value) => typeof value === "string" && value.includes("주의보"));
}

export async function fetchHeatAlertStatus(stnId = "108"): Promise<WeatherAlertApiData | null> {
  if (!SPECIAL_WEATHER_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      serviceKey: SPECIAL_WEATHER_API_KEY,
      pageNo: "1",
      numOfRows: "50",
      dataType: "JSON",
      stnId
    });
    const response = await fetch(`${WEATHER_ALERT_API_URL}?${params.toString()}`);

    if (!response.ok) return null;

    const payload = await response.json();
    const heatAlertItems = toAlertItems(payload).filter(hasHeatAlertText);

    if (heatAlertItems.some(isWarningText)) {
      return { heatAlertStatus: "warning", heatRiskLevel: "매우 높음" };
    }

    if (heatAlertItems.some(isAdvisoryText) || heatAlertItems.length > 0) {
      return { heatAlertStatus: "advisory", heatRiskLevel: "높음" };
    }

    return { heatAlertStatus: "none" };
  } catch {
    return null;
  }
}
