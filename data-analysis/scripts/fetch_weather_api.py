from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import urlopen

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data-analysis" / "raw"
ENV_PATH = PROJECT_ROOT / ".env"

BASE_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"
NX = 67
NY = 100
REGION = "대전"


def load_env() -> None:
    if not ENV_PATH.exists():
        return

    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def build_url(operation: str, api_key: str, params: dict[str, str]) -> str:
    encoded_params = urlencode(params, doseq=True)
    service_key = api_key if "%" in api_key else quote(api_key, safe="")
    return f"{BASE_URL}/{operation}?serviceKey={service_key}&{encoded_params}"


def candidate_base_times(now: datetime) -> list[tuple[str, str]]:
    start = now.replace(minute=0, second=0, microsecond=0)
    if now.minute < 45:
        start -= timedelta(hours=1)

    candidates = []
    for offset in range(0, 8):
        base = start - timedelta(hours=offset)
        candidates.append((base.strftime("%Y%m%d"), base.strftime("%H00")))
    return candidates


def request_json(operation: str, api_key: str, base_date: str, base_time: str) -> dict:
    params = {
        "pageNo": "1",
        "numOfRows": "1000",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": str(NX),
        "ny": str(NY),
    }
    url = build_url(operation, api_key, params)

    try:
        with urlopen(url, timeout=30) as response:
            raw_text = response.read().decode("utf-8", errors="replace")
            status = getattr(response, "status", 200)
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"{operation} 호출 실패: 상태코드 {error.code}")
        print(f"응답 본문 일부: {body[:500]}")
        print("실패 원인 추정: API 키, 요청 파라미터, 서비스 endpoint 또는 호출 가능 시간이 맞지 않을 수 있습니다.")
        raise
    except URLError as error:
        print(f"{operation} 호출 실패: 네트워크 오류")
        print(f"실패 원인 추정: {error.reason}")
        raise

    if status != 200:
        print(f"{operation} 호출 실패: 상태코드 {status}")
        print(f"응답 본문 일부: {raw_text[:500]}")
        raise RuntimeError(f"{operation} HTTP status {status}")

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as error:
        print(f"{operation} 호출 실패: JSON 파싱 실패")
        print(f"응답 본문 일부: {raw_text[:500]}")
        print("실패 원인 추정: 인증 오류 또는 공공데이터포털 오류 응답이 JSON이 아닐 수 있습니다.")
        raise RuntimeError(f"{operation} JSON parse failed") from error

    header = data.get("response", {}).get("header", {})
    result_code = str(header.get("resultCode", ""))
    if result_code and result_code != "00":
        print(f"{operation} 호출 실패: API resultCode={result_code}")
        print(f"응답 메시지: {header.get('resultMsg', '메시지 없음')}")
        print("실패 원인 추정: API 키 권한, base_date/base_time, nx/ny 또는 서비스 승인 상태를 확인해야 합니다.")
        raise RuntimeError(f"{operation} API resultCode={result_code}")

    return data


def fetch_with_time_fallback(operation: str, api_key: str) -> tuple[dict, str, str]:
    last_error: Exception | None = None
    for base_date, base_time in candidate_base_times(datetime.now()):
        try:
            data = request_json(operation, api_key, base_date, base_time)
            items = extract_items(data)
            if items:
                return data, base_date, base_time
            print(f"{operation}: {base_date} {base_time} 응답에 item이 없어 이전 기준시각으로 재시도합니다.")
        except Exception as error:
            last_error = error
            continue

    if last_error:
        raise last_error
    raise RuntimeError(f"{operation} 응답 item을 찾지 못했습니다.")


def extract_items(data: dict) -> list[dict]:
    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    if isinstance(items, dict):
        return [items]
    return items if isinstance(items, list) else []


def parse_float(value: object) -> float:
    if value is None:
        return 0.0
    text = str(value).strip()
    if text in {"", "-", "강수없음", "없음"}:
        return 0.0
    if "mm" in text:
        text = text.replace("mm", "")
    if "미만" in text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def apparent_temperature(temperature: float, humidity: float) -> float:
    if temperature <= 0:
        return 0.0
    # 간단한 체감 더위 보정값입니다. 실제 체감온도 공식이 아닌 분석용 근사값입니다.
    return round(temperature + max(humidity - 60, 0) * 0.05, 1)


def heat_risk_score(temperature: float, humidity: float, apparent: float) -> float:
    base_temperature = apparent if apparent > 0 else temperature
    score = 0.0
    score += max(base_temperature - 27, 0) * 8
    score += 10 if base_temperature >= 30 else 0
    score += 18 if base_temperature >= 33 else 0
    score += 15 if base_temperature >= 35 else 0
    score += max(humidity - 60, 0) * 0.7
    score += 8 if humidity >= 70 else 0
    return round(min(max(score, 0), 100), 1)


def weather_rows_from_items(items: list[dict], source: str) -> list[dict]:
    grouped: dict[tuple[str, str], dict[str, object]] = {}

    for item in items:
        date = str(item.get("fcstDate") or item.get("baseDate") or "")
        time = str(item.get("fcstTime") or item.get("baseTime") or "").zfill(4)
        if not date or not time:
            continue

        key = (date, time)
        row = grouped.setdefault(
            key,
            {
                "datetime": f"{date[:4]}-{date[4:6]}-{date[6:8]} {time[:2]}:{time[2:]}:00",
                "region": REGION,
                "nx": NX,
                "ny": NY,
                "temperature": 0.0,
                "humidity": 0.0,
                "wind_speed": 0.0,
                "rainfall": 0.0,
                "sky": "",
                "precipitation_type": "",
                "apparent_temperature": 0.0,
                "heat_risk_score": 0.0,
                "source": source,
            },
        )

        category = item.get("category")
        value = item.get("fcstValue", item.get("obsrValue"))
        if category == "T1H":
            row["temperature"] = parse_float(value)
        elif category == "REH":
            row["humidity"] = parse_float(value)
        elif category == "WSD":
            row["wind_speed"] = parse_float(value)
        elif category == "RN1":
            row["rainfall"] = parse_float(value)
        elif category == "SKY":
            row["sky"] = str(value)
        elif category == "PTY":
            row["precipitation_type"] = str(value)

    rows = []
    for row in grouped.values():
        temperature = float(row["temperature"])
        humidity = float(row["humidity"])
        apparent = apparent_temperature(temperature, humidity)
        row["apparent_temperature"] = apparent
        row["heat_risk_score"] = heat_risk_score(temperature, humidity, apparent)
        rows.append(row)

    return sorted(rows, key=lambda row: str(row["datetime"]))


def save_json(data: dict, path: Path) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    load_env()
    api_key = os.environ.get("WEATHER_API_KEY")

    if not api_key:
        print(".env에 WEATHER_API_KEY를 입력한 뒤 다시 실행해주세요.")
        return 0

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    try:
        ncst_data, ncst_date, ncst_time = fetch_with_time_fallback("getUltraSrtNcst", api_key)
        fcst_data, fcst_date, fcst_time = fetch_with_time_fallback("getUltraSrtFcst", api_key)
    except Exception as error:
        print(f"기상청 API 호출을 완료하지 못했습니다: {type(error).__name__}")
        return 1

    ncst_path = RAW_DIR / "weather_ultra_srt_ncst_raw.json"
    fcst_path = RAW_DIR / "weather_ultra_srt_fcst_raw.json"
    save_json(ncst_data, ncst_path)
    save_json(fcst_data, fcst_path)

    rows = [
        *weather_rows_from_items(extract_items(ncst_data), "getUltraSrtNcst"),
        *weather_rows_from_items(extract_items(fcst_data), "getUltraSrtFcst"),
    ]

    output_columns = [
        "datetime",
        "region",
        "nx",
        "ny",
        "temperature",
        "humidity",
        "wind_speed",
        "rainfall",
        "sky",
        "precipitation_type",
        "apparent_temperature",
        "heat_risk_score",
        "source",
    ]
    weather_csv = RAW_DIR / "weather.csv"
    pd.DataFrame(rows, columns=output_columns).to_csv(weather_csv, index=False, encoding="utf-8-sig")

    print(f"기상청 초단기실황 원본 저장: {ncst_path}")
    print(f"기상청 초단기예보 원본 저장: {fcst_path}")
    print(f"weather.csv 저장: {weather_csv} ({len(rows):,}행)")
    print(f"사용 기준시각: 실황 {ncst_date} {ncst_time}, 예보 {fcst_date} {fcst_time}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
