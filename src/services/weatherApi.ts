export type WeatherApiData = {
  temperature: number;
  feelsLikeTemperature: number;
  humidity: number;
  condition: string;
};

declare const process: {
  env: {
    EXPO_PUBLIC_WEATHER_API_KEY?: string;
  };
};

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY?.trim();
const WEATHER_API_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const SEONGBUK_GRID = { nx: 61, ny: 127 };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getBaseDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 45);

  return {
    baseDate: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
    baseTime: `${pad(now.getHours())}00`
  };
}

function getWeatherCondition(temperature?: number, humidity?: number) {
  if (typeof temperature === "number" && temperature >= 33) return "맑음";
  if (typeof humidity === "number" && humidity >= 80) return "습함";
  return "맑음";
}

function getHeatIndex(temperature: number, humidity: number) {
  const fahrenheit = temperature * 1.8 + 32;
  const heatIndexF =
    -42.379 +
    2.04901523 * fahrenheit +
    10.14333127 * humidity -
    0.22475541 * fahrenheit * humidity -
    0.00683783 * fahrenheit * fahrenheit -
    0.05481717 * humidity * humidity +
    0.00122874 * fahrenheit * fahrenheit * humidity +
    0.00085282 * fahrenheit * humidity * humidity -
    0.00000199 * fahrenheit * fahrenheit * humidity * humidity;

  return Math.round(((heatIndexF - 32) / 1.8) * 10) / 10;
}

function toItemList(payload: unknown): Array<{ category?: string; obsrValue?: string }> {
  const body = payload as {
    response?: {
      body?: {
        items?: {
          item?: Array<{ category?: string; obsrValue?: string }> | { category?: string; obsrValue?: string };
        };
      };
    };
  };
  const item = body.response?.body?.items?.item;

  if (Array.isArray(item)) return item;
  if (item) return [item];
  return [];
}

export async function fetchCurrentWeather(): Promise<WeatherApiData | null> {
  if (!WEATHER_API_KEY) return null;

  try {
    const { baseDate, baseTime } = getBaseDateTime();
    const params = new URLSearchParams({
      serviceKey: WEATHER_API_KEY,
      pageNo: "1",
      numOfRows: "1000",
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: String(SEONGBUK_GRID.nx),
      ny: String(SEONGBUK_GRID.ny)
    });
    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);

    if (!response.ok) return null;

    const payload = await response.json();
    const items = toItemList(payload);
    const temperature = Number(items.find((item) => item.category === "T1H")?.obsrValue);
    const humidity = Number(items.find((item) => item.category === "REH")?.obsrValue);

    if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) return null;

    return {
      temperature,
      humidity,
      feelsLikeTemperature: getHeatIndex(temperature, humidity),
      condition: getWeatherCondition(temperature, humidity)
    };
  } catch {
    return null;
  }
}
