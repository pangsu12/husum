export type WeatherApiData = {
  temperature: number;
  feelsLikeTemperature: number;
  humidity: number;
  condition: string;
};

export type WeatherGrid = {
  nx: number;
  ny: number;
};

declare const process: {
  env: {
    EXPO_PUBLIC_WEATHER_API_KEY?: string;
  };
};

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY?.trim();
const WEATHER_API_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const DEFAULT_GRID: WeatherGrid = { nx: 61, ny: 127 };

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

function getConditionFromPrecipitation(precipitationType?: string) {
  if (!precipitationType || precipitationType === "0") return undefined;
  if (precipitationType === "1" || precipitationType === "5") return "비";
  if (precipitationType === "2" || precipitationType === "6") return "비/눈";
  if (precipitationType === "3" || precipitationType === "7") return "눈";
  return "흐림";
}

function getWeatherCondition(temperature: number, humidity: number, precipitationType?: string) {
  const precipitationCondition = getConditionFromPrecipitation(precipitationType);
  if (precipitationCondition) return precipitationCondition;
  if (humidity >= 80) return "구름 많음";
  if (temperature >= 30) return "맑음";
  return "맑음";
}

export function calculateFeelsLikeTemperature(temperature: number, humidity: number) {
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

  const celsius = (heatIndexF - 32) / 1.8;
  if (!Number.isFinite(celsius) || celsius < temperature) return Math.round(temperature * 10) / 10;
  return Math.round(celsius * 10) / 10;
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

export async function fetchCurrentWeather(grid: WeatherGrid = DEFAULT_GRID): Promise<WeatherApiData | null> {
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
      nx: String(grid.nx),
      ny: String(grid.ny)
    });
    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);

    if (!response.ok) return null;

    const payload = await response.json();
    const items = toItemList(payload);
    const temperature = Number(items.find((item) => item.category === "T1H")?.obsrValue);
    const humidity = Number(items.find((item) => item.category === "REH")?.obsrValue);
    const precipitationType = items.find((item) => item.category === "PTY")?.obsrValue;

    if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) return null;

    return {
      temperature,
      humidity,
      feelsLikeTemperature: calculateFeelsLikeTemperature(temperature, humidity),
      condition: getWeatherCondition(temperature, humidity, precipitationType)
    };
  } catch {
    return null;
  }
}
