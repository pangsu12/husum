from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import urlopen

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data-analysis" / "raw"
ENV_PATH = PROJECT_ROOT / ".env"

BASE_URL = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty"
SIDO_NAME = "대전"


def load_env() -> None:
    if not ENV_PATH.exists():
        return

    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def build_url(api_key: str) -> str:
    params = {
        "returnType": "json",
        "numOfRows": "100",
        "pageNo": "1",
        "sidoName": SIDO_NAME,
        "ver": "1.0",
    }
    service_key = api_key if "%" in api_key else quote(api_key, safe="")
    return f"{BASE_URL}?serviceKey={service_key}&{urlencode(params)}"


def request_json(api_key: str) -> dict:
    url = build_url(api_key)

    try:
        with urlopen(url, timeout=30) as response:
            raw_text = response.read().decode("utf-8", errors="replace")
            status = getattr(response, "status", 200)
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"에어코리아 API 호출 실패: 상태코드 {error.code}")
        print(f"응답 본문 일부: {body[:500]}")
        print("실패 원인 추정: API 키, 서비스 승인 상태, endpoint 또는 요청 파라미터를 확인해야 합니다.")
        raise
    except URLError as error:
        print("에어코리아 API 호출 실패: 네트워크 오류")
        print(f"실패 원인 추정: {error.reason}")
        raise

    if status != 200:
        print(f"에어코리아 API 호출 실패: 상태코드 {status}")
        print(f"응답 본문 일부: {raw_text[:500]}")
        raise RuntimeError(f"AirKorea HTTP status {status}")

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as error:
        print("에어코리아 API 호출 실패: JSON 파싱 실패")
        print(f"응답 본문 일부: {raw_text[:500]}")
        print("실패 원인 추정: 인증 오류 또는 공공데이터포털 오류 응답이 JSON이 아닐 수 있습니다.")
        raise RuntimeError("AirKorea JSON parse failed") from error

    header = data.get("response", {}).get("header", {})
    result_code = str(header.get("resultCode", ""))
    if result_code and result_code != "00":
        print(f"에어코리아 API 호출 실패: API resultCode={result_code}")
        print(f"응답 메시지: {header.get('resultMsg', '메시지 없음')}")
        print("실패 원인 추정: API 키 권한, 서비스 승인 상태 또는 sidoName 파라미터를 확인해야 합니다.")
        raise RuntimeError(f"AirKorea API resultCode={result_code}")

    return data


def extract_items(data: dict) -> list[dict]:
    items = data.get("response", {}).get("body", {}).get("items", [])
    if isinstance(items, dict):
        return [items]
    return items if isinstance(items, list) else []


def parse_float(value: object) -> float:
    if value is None:
        return 0.0
    text = str(value).strip()
    if text in {"", "-", "점검중", "자료이상", "통신장애"}:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def air_risk_score(pm10: float, pm25: float, ozone: float, air_quality_index: float) -> float:
    score = 0.0
    score += min(max(pm10 / 150 * 25, 0), 25)
    score += min(max(pm25 / 75 * 30, 0), 30)
    score += min(max(ozone / 0.15 * 25, 0), 25)
    score += min(max(air_quality_index / 250 * 20, 0), 20)
    return round(min(max(score, 0), 100), 1)


def rows_from_items(items: list[dict]) -> list[dict]:
    rows = []
    for item in items:
        pm10 = parse_float(item.get("pm10Value"))
        pm25 = parse_float(item.get("pm25Value"))
        ozone = parse_float(item.get("o3Value"))
        khai = parse_float(item.get("khaiValue"))
        rows.append(
            {
                "datetime": item.get("dataTime", ""),
                "region": item.get("sidoName") or SIDO_NAME,
                "station": item.get("stationName", ""),
                "pm10": pm10,
                "pm25": pm25,
                "ozone": ozone,
                "air_quality_index": khai,
                "air_risk_score": air_risk_score(pm10, pm25, ozone, khai),
                "source": "getCtprvnRltmMesureDnsty",
            }
        )
    return rows


def main() -> int:
    load_env()
    api_key = os.environ.get("AIR_QUALITY_API_KEY")

    if not api_key:
        print(".env에 AIR_QUALITY_API_KEY를 입력한 뒤 다시 실행해주세요.")
        return 0

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    try:
        data = request_json(api_key)
    except Exception as error:
        print(f"에어코리아 API 호출을 완료하지 못했습니다: {type(error).__name__}")
        return 1

    raw_path = RAW_DIR / "air_quality_raw.json"
    raw_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    rows = rows_from_items(extract_items(data))
    output_columns = [
        "datetime",
        "region",
        "station",
        "pm10",
        "pm25",
        "ozone",
        "air_quality_index",
        "air_risk_score",
        "source",
    ]
    csv_path = RAW_DIR / "air_quality.csv"
    pd.DataFrame(rows, columns=output_columns).to_csv(csv_path, index=False, encoding="utf-8-sig")

    print(f"에어코리아 원본 저장: {raw_path}")
    print(f"air_quality.csv 저장: {csv_path} ({len(rows):,}행)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
