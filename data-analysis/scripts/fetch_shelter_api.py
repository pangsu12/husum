from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data-analysis" / "raw"
ENV_PATH = PROJECT_ROOT / ".env"


def load_env() -> None:
    if not ENV_PATH.exists():
        return

    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def main() -> int:
    load_env()
    api_key = os.environ.get("SHELTER_API_KEY")

    if not api_key:
        print("API 키가 없습니다. 승인 후 .env에 입력해주세요.")
        return 0

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # TODO: 공공데이터포털의 행정안전부_무더위쉼터 API 실제 endpoint로 교체하세요.
    api_url = "https://api.example.go.kr/TODO_REPLACE_WITH_REAL_SHELTER_ENDPOINT"

    # TODO: API 명세에 맞춰 serviceKey, pageNo, numOfRows, type 등의 파라미터 이름을 조정하세요.
    params = {
        "serviceKey": api_key,
        "pageNo": "1",
        "numOfRows": "1000",
        "type": "json",
    }

    request_url = f"{api_url}?{urlencode(params)}"

    with urlopen(request_url, timeout=30) as response:
        raw_text = response.read().decode("utf-8")

    output_path = RAW_DIR / "shelters_api_raw.json"

    try:
        parsed = json.loads(raw_text)
        output_path.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
    except json.JSONDecodeError:
        output_path.write_text(raw_text, encoding="utf-8")

    print(f"API 응답 저장 완료: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
