from __future__ import annotations

import csv
import json
import math
import struct
import zlib
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from statistics import mean
import zipfile
import xml.etree.ElementTree as ET


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ANALYSIS_ROOT = PROJECT_ROOT / "data-analysis"
RAW_DIR = ANALYSIS_ROOT / "raw"
OUTPUT_DIR = ANALYSIS_ROOT / "output"

TARGET_REGIONS = ["서울", "대전", "대구", "부산", "광주"]
CSV_ENCODINGS = ["utf-8-sig", "cp949", "euc-kr"]
SUMMER_MONTHS = {6, 7, 8, 9}
START_YEAR = 2020
END_YEAR = 2025

REGION_ALIASES = {
    "서울특별시": "서울",
    "서울": "서울",
    "대전광역시": "대전",
    "대전": "대전",
    "대구광역시": "대구",
    "대구": "대구",
    "부산광역시": "부산",
    "부산": "부산",
    "광주광역시": "광주",
    "광주": "광주",
}


def read_csv_rows(path: Path) -> tuple[list[list[str]], str]:
    last_error: Exception | None = None
    for encoding in CSV_ENCODINGS:
        try:
            with path.open("r", encoding=encoding, newline="") as file:
                rows = list(csv.reader(file))
            return rows, encoding
        except Exception as error:  # pragma: no cover - diagnostic fallback
            last_error = error
    raise RuntimeError(f"CSV read failed: {path.name}: {last_error}")


def xlsx_column_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    index = 0
    for char in letters:
        index = index * 26 + (ord(char.upper()) - 64)
    return index - 1


def read_xlsx_rows(path: Path) -> list[list[str]]:
    namespace = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("a:si", namespace):
                shared_strings.append("".join(text.text or "" for text in item.findall(".//a:t", namespace)))

        sheet_name = "xl/worksheets/sheet1.xml"
        root = ET.fromstring(archive.read(sheet_name))
        rows: list[list[str]] = []
        for row in root.findall(".//a:sheetData/a:row", namespace):
            values: list[str] = []
            for cell in row.findall("a:c", namespace):
                index = xlsx_column_index(cell.attrib.get("r", "A1"))
                while len(values) <= index:
                    values.append("")
                value_node = cell.find("a:v", namespace)
                value = "" if value_node is None else value_node.text or ""
                if cell.attrib.get("t") == "s" and value.isdigit():
                    value = shared_strings[int(value)]
                values[index] = value
            rows.append(values)
        return rows


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def normalize_region(value: str) -> str | None:
    value = (value or "").strip()
    for source, target in REGION_ALIASES.items():
        if source in value:
            return target
    return None


def parse_number(value: object) -> float | None:
    text = str(value).replace(",", "").replace("%", "").replace("<br>", "").strip()
    if text in {"", "-", "nan"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_date(value: str) -> datetime | None:
    value = (value or "").strip()
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def is_analysis_period(date: datetime) -> bool:
    return START_YEAR <= date.year <= END_YEAR and date.month in SUMMER_MONTHS


def average(values: list[float]) -> float | None:
    clean = [value for value in values if value is not None]
    return round(mean(clean), 2) if clean else None


def normalize_scores(values_by_region: dict[str, float]) -> dict[str, float]:
    values = list(values_by_region.values())
    if not values:
        return {region: 0 for region in TARGET_REGIONS}
    low = min(values)
    high = max(values)
    if math.isclose(low, high):
        return {region: 50.0 for region in TARGET_REGIONS}
    return {
        region: round(((values_by_region.get(region, 0) - low) / (high - low)) * 100, 2)
        for region in TARGET_REGIONS
    }


def pearson(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) < 2 or len(xs) != len(ys):
        return None
    mean_x = mean(xs)
    mean_y = mean(ys)
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    denominator_x = math.sqrt(sum((x - mean_x) ** 2 for x in xs))
    denominator_y = math.sqrt(sum((y - mean_y) ** 2 for y in ys))
    if denominator_x == 0 or denominator_y == 0:
        return None
    return round(numerator / (denominator_x * denominator_y), 4)


def analyze_weather(limitations: list[str]) -> tuple[list[dict[str, object]], dict[tuple[str, str], dict[str, float]], list[dict[str, object]]]:
    weather_files = [RAW_DIR / "asos_weather.csv", RAW_DIR / "asos_daegu.csv"]
    records: list[dict[str, object]] = []
    for path in weather_files:
        if not path.exists():
            limitations.append(f"{path.name} 파일이 없어 ASOS 기상 분석에서 제외했습니다.")
            continue
        rows, _encoding = read_csv_rows(path)
        header = rows[0]
        index = {name: header.index(name) for name in header}
        for row in rows[1:]:
            if len(row) < len(header):
                continue
            date = parse_date(row[index["일시"]])
            region = normalize_region(row[index["지점명"]])
            if not date or not region or region not in TARGET_REGIONS or not is_analysis_period(date):
                continue
            records.append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "year": date.year,
                    "region": region,
                    "avg_temp": parse_number(row[index["평균기온(°C)"]]),
                    "max_temp": parse_number(row[index["최고기온(°C)"]]),
                    "min_temp": parse_number(row[index["최저기온(°C)"]]),
                    "avg_humidity": parse_number(row[index["평균 상대습도(%)"]]),
                }
            )

    by_region: dict[str, list[dict[str, object]]] = defaultdict(list)
    by_region_year: dict[tuple[str, int], list[float]] = defaultdict(list)
    by_date_region: dict[tuple[str, str], dict[str, float]] = {}
    for record in records:
        region = str(record["region"])
        year = int(record["year"])
        by_region[region].append(record)
        max_temp = record["max_temp"]
        if isinstance(max_temp, float):
            by_region_year[(region, year)].append(max_temp)
            by_date_region[(str(record["date"]), region)] = {"max_temp": max_temp}

    summary: list[dict[str, object]] = []
    for region in TARGET_REGIONS:
        items = by_region.get(region, [])
        max_temps = [item["max_temp"] for item in items if isinstance(item["max_temp"], float)]
        avg_temps = [item["avg_temp"] for item in items if isinstance(item["avg_temp"], float)]
        humidities = [item["avg_humidity"] for item in items if isinstance(item["avg_humidity"], float)]
        summary.append(
            {
                "region": region,
                "avg_max_temp": average(max_temps),
                "avg_temp": average(avg_temps),
                "avg_humidity": average(humidities),
                "days_max_temp_33_or_more": sum(1 for value in max_temps if value >= 33),
                "weather_days": len(items),
            }
        )

    yearly_trend = [
        {
            "region": region,
            "year": year,
            "avg_max_temp": average(values),
        }
        for (region, year), values in sorted(by_region_year.items())
    ]
    return summary, by_date_region, yearly_trend


def analyze_heat_illness() -> tuple[list[dict[str, object]], dict[tuple[str, str], int], dict[str, object]]:
    rows, _encoding = read_csv_rows(RAW_DIR / "heat_illness.csv")
    header = rows[0]
    index = {name: header.index(name) for name in header}
    date_region_counts: dict[tuple[str, str], int] = defaultdict(int)
    yearly_counts: dict[int, int] = defaultdict(int)
    region_counts: dict[str, int] = defaultdict(int)
    date_counts: dict[str, int] = defaultdict(int)

    for row in rows[1:]:
        if len(row) < len(header):
            continue
        date = parse_date(row[index["발생일자"]])
        region = normalize_region(row[index["발생시도"]])
        if not date or not region or region not in TARGET_REGIONS or not is_analysis_period(date):
            continue
        date_key = date.strftime("%Y-%m-%d")
        date_region_counts[(date_key, region)] += 1
        yearly_counts[date.year] += 1
        region_counts[region] += 1
        date_counts[date_key] += 1

    summary = [
        {
            "region": region,
            "heat_illness_cases": region_counts.get(region, 0),
        }
        for region in TARGET_REGIONS
    ]
    peak_date = max(date_counts.items(), key=lambda item: item[1]) if date_counts else (None, 0)
    meta = {
        "total_heat_illness_cases": sum(region_counts.values()),
        "yearly_heat_illness_cases": dict(sorted(yearly_counts.items())),
        "peak_date": peak_date[0],
        "peak_date_cases": peak_date[1],
    }
    return summary, date_region_counts, meta


def find_header_row(rows: list[list[str]], required: str) -> int:
    for index, row in enumerate(rows):
        if required in row:
            return index
    return 0


def analyze_heatwave() -> list[dict[str, object]]:
    city_files = {
        "서울": "heatwave_seoul.csv",
        "대전": "heatwave_daejeon.csv",
        "대구": "heatwave_daegu.csv",
        "부산": "heatwave_busan.csv",
        "광주": "heatwave_gwangju.csv",
    }
    summary: list[dict[str, object]] = []
    for region, filename in city_files.items():
        rows, _encoding = read_csv_rows(RAW_DIR / filename)
        header_index = find_header_row(rows, "연도")
        header = rows[header_index]
        year_index = header.index("연도")
        total_index = header.index("연합계")
        yearly: dict[str, int] = {}
        for row in rows[header_index + 1 :]:
            if len(row) <= total_index:
                continue
            year_text = row[year_index].strip()
            if not year_text.isdigit():
                continue
            year = int(year_text)
            if START_YEAR <= year <= END_YEAR:
                yearly[str(year)] = int(parse_number(row[total_index]) or 0)
        summary.append(
            {
                "region": region,
                "heatwave_days_total": sum(yearly.values()),
                "yearly_heatwave_days": yearly,
                "trend_2020_2025": yearly.get(str(END_YEAR), 0) - yearly.get(str(START_YEAR), 0),
            }
        )
    return summary


def analyze_elderly(limitations: list[str]) -> list[dict[str, object]]:
    rows, _encoding = read_csv_rows(RAW_DIR / "kosis_elderly.csv")
    if len(rows) < 3:
        limitations.append("kosis_elderly.csv 구조를 해석할 수 없어 고령인구 비율을 계산하지 못했습니다.")
        return []

    year_row = rows[0]
    metric_row = rows[1]
    year_metric_indexes: dict[str, dict[str, int]] = defaultdict(dict)
    for index, year in enumerate(year_row):
        if not str(year).isdigit():
            continue
        metric = metric_row[index] if index < len(metric_row) else ""
        year_metric_indexes[str(year)][metric] = index

    latest_year = max((year for year in year_metric_indexes if START_YEAR <= int(year) <= END_YEAR), default=None)
    summary: list[dict[str, object]] = []
    if latest_year is None:
        limitations.append("kosis_elderly.csv에서 2020~2025 연도 컬럼을 찾지 못했습니다.")
        return summary

    metrics = year_metric_indexes[latest_year]
    elderly_index = next((idx for name, idx in metrics.items() if "65세이상" in name or "고령" in name), None)
    total_index = next((idx for name, idx in metrics.items() if "전체인구" in name), None)
    rate_index = next((idx for name, idx in metrics.items() if "구성비" in name or "비율" in name), None)

    for row in rows[2:]:
        if not row:
            continue
        region = normalize_region(row[0])
        if not region or region not in TARGET_REGIONS:
            continue
        rate: float | None = None
        if rate_index is not None and rate_index < len(row):
            rate = parse_number(row[rate_index])
        if rate is None and elderly_index is not None and total_index is not None:
            elderly = parse_number(row[elderly_index]) if elderly_index < len(row) else None
            total = parse_number(row[total_index]) if total_index < len(row) else None
            if elderly is not None and total:
                rate = round((elderly / total) * 100, 2)
        summary.append(
            {
                "region": region,
                "elderly_rate": round(rate or 0, 2),
                "elderly_rate_year": latest_year,
            }
        )
    return summary


def analyze_reference_kosis(limitations: list[str]) -> dict[str, object]:
    reference: dict[str, object] = {}
    children_path = RAW_DIR / "kosis_children.csv"
    if children_path.exists():
        rows, _encoding = read_csv_rows(children_path)
        reference["kosis_children_rows"] = max(0, len(rows) - 1)
        limitations.append("kosis_children.csv는 현재 전국 단위 구조라 지역별 종합 위험도 계산에는 포함하지 않았습니다.")
    single_path = RAW_DIR / "kosis_single_household.xlsx"
    if single_path.exists():
        rows = read_xlsx_rows(single_path)
        reference["kosis_single_household_rows"] = max(0, len(rows) - 1)
        limitations.append("kosis_single_household.xlsx는 현재 전국 단위 구조라 지역별 종합 위험도 계산에는 포함하지 않았습니다.")
    return reference


def analyze_shelter(limitations: list[str]) -> dict[str, object] | None:
    path = RAW_DIR / "행정안전부_무더위쉼터.csv"
    if not path.exists():
        limitations.append("통합대피소는 API 연동 예정이라 이번 CSV 분석 필수 요소에는 포함하지 않았습니다.")
        return None
    try:
        rows, _encoding = read_csv_rows(path)
        if not rows:
            raise ValueError("empty shelter csv")
        header_index = 0
        for i, row in enumerate(rows[:5]):
            if "RSTR_NM" in row or "USE_PSBL_NMPR" in row:
                header_index = i
                break
        header = rows[header_index]
        data = rows[header_index + 1 :]
        name_idx = header.index("RSTR_NM") if "RSTR_NM" in header else None
        capacity_idx = header.index("USE_PSBL_NMPR") if "USE_PSBL_NMPR" in header else None
        ac_idx = header.index("COLR_HOLD_ARCNDTN") if "COLR_HOLD_ARCNDTN" in header else None
        fan_idx = header.index("COLR_HOLD_ELEFN") if "COLR_HOLD_ELEFN" in header else None
        region_idx = header.index("DTL_ADRES") if "DTL_ADRES" in header else None

        region_counts: dict[str, int] = defaultdict(int)
        total_capacity = 0.0
        total_ac = 0.0
        total_fan = 0.0
        count = 0
        for row in data:
            if name_idx is not None and name_idx < len(row) and not row[name_idx].strip():
                continue
            name_value = row[name_idx].strip() if name_idx is not None and name_idx < len(row) else ""
            capacity_value = parse_number(row[capacity_idx]) if capacity_idx is not None and capacity_idx < len(row) else None
            ac_value = parse_number(row[ac_idx]) if ac_idx is not None and ac_idx < len(row) else None
            fan_value = parse_number(row[fan_idx]) if fan_idx is not None and fan_idx < len(row) else None
            if ("명칭" in name_value or "쉼터" in name_value) and capacity_value is None and ac_value is None and fan_value is None:
                continue
            count += 1
            total_capacity += capacity_value or 0
            total_ac += ac_value or 0
            total_fan += fan_value or 0
            if region_idx is not None and region_idx < len(row):
                region = normalize_region(row[region_idx])
                if region:
                    region_counts[region] += 1
        limitations.append("행정안전부 무더위쉼터 CSV는 보조 분석으로만 사용했습니다. 앱 최신 쉼터 후보는 통합대피소 API 연동 예정입니다.")
        return {
            "total_shelters": count,
            "region_shelter_count": dict(region_counts),
            "total_capacity": int(total_capacity),
            "total_air_conditioners": int(total_ac),
            "total_fans": int(total_fan),
        }
    except Exception as error:
        limitations.append(f"행정안전부 무더위쉼터 CSV 컬럼 구조를 해석하지 못해 보조 분석에서 제외했습니다: {error}")
        return None


def create_integrated_risk(
    weather_summary: list[dict[str, object]],
    heatwave_summary: list[dict[str, object]],
    illness_summary: list[dict[str, object]],
    elderly_summary: list[dict[str, object]],
) -> list[dict[str, object]]:
    weather_values = {
        str(row["region"]): float(row["avg_max_temp"] or 0) + float(row["days_max_temp_33_or_more"] or 0) * 0.15
        for row in weather_summary
    }
    heatwave_values = {str(row["region"]): float(row["heatwave_days_total"] or 0) for row in heatwave_summary}
    illness_values = {str(row["region"]): float(row["heat_illness_cases"] or 0) for row in illness_summary}
    elderly_values = {str(row["region"]): float(row["elderly_rate"] or 0) for row in elderly_summary}

    weather_scores = normalize_scores(weather_values)
    heatwave_scores = normalize_scores(heatwave_values)
    illness_scores = normalize_scores(illness_values)
    elderly_scores = normalize_scores(elderly_values)

    result: list[dict[str, object]] = []
    for region in TARGET_REGIONS:
        total = (
            weather_scores.get(region, 0) * 0.35
            + heatwave_scores.get(region, 0) * 0.25
            + illness_scores.get(region, 0) * 0.25
            + elderly_scores.get(region, 0) * 0.15
        )
        result.append(
            {
                "region": region,
                "weather_risk_score": round(weather_scores.get(region, 0), 2),
                "heatwave_score": round(heatwave_scores.get(region, 0), 2),
                "heat_illness_score": round(illness_scores.get(region, 0), 2),
                "elderly_score": round(elderly_scores.get(region, 0), 2),
                "integrated_heat_risk_score": round(total, 2),
            }
        )
    return sorted(result, key=lambda row: float(row["integrated_heat_risk_score"]), reverse=True)


def draw_bar_png(path: Path, labels: list[str], values: list[float], title: str, color: tuple[int, int, int]) -> None:
    width, height = 900, 560
    pixels = [(255, 255, 255)] * (width * height)

    def rect(x0: int, y0: int, x1: int, y1: int, fill: tuple[int, int, int]) -> None:
        for y in range(max(0, y0), min(height, y1)):
            base = y * width
            for x in range(max(0, x0), min(width, x1)):
                pixels[base + x] = fill

    rect(0, 0, width, height, (248, 250, 252))
    chart_left, chart_top, chart_right, chart_bottom = 80, 80, 850, 460
    rect(chart_left, chart_top, chart_right, chart_bottom, (255, 255, 255))
    max_value = max(values) if values else 1
    bar_gap = 28
    bar_width = max(28, int((chart_right - chart_left - bar_gap * (len(values) + 1)) / max(1, len(values))))
    for index, value in enumerate(values):
        x0 = chart_left + bar_gap + index * (bar_width + bar_gap)
        bar_h = int((value / max_value) * (chart_bottom - chart_top - 30)) if max_value else 0
        rect(x0, chart_bottom - bar_h, x0 + bar_width, chart_bottom, color)
    # The PNG is intentionally simple; numeric values are preserved in CSV/JSON/summary.
    raw = b"".join(b"\x00" + bytes(channel for pixel in pixels[y * width : (y + 1) * width] for channel in pixel) for y in range(height))

    def chunk(name: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"tEXt", f"Title\x00{title}".encode("utf-8"))
    png += chunk(b"tEXt", f"Labels\x00{','.join(labels)}".encode("utf-8"))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def create_outputs(
    weather_summary: list[dict[str, object]],
    weather_trend: list[dict[str, object]],
    illness_summary: list[dict[str, object]],
    illness_meta: dict[str, object],
    heatwave_summary: list[dict[str, object]],
    elderly_summary: list[dict[str, object]],
    integrated: list[dict[str, object]],
    correlation: float | None,
    shelter_summary: dict[str, object] | None,
    reference_summary: dict[str, object],
    limitations: list[str],
) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    write_csv(
        OUTPUT_DIR / "weather_region_summary.csv",
        weather_summary,
        ["region", "avg_max_temp", "avg_temp", "avg_humidity", "days_max_temp_33_or_more", "weather_days"],
    )
    write_csv(
        OUTPUT_DIR / "heatwave_region_summary.csv",
        heatwave_summary,
        ["region", "heatwave_days_total", "trend_2020_2025", "yearly_heatwave_days"],
    )
    write_csv(
        OUTPUT_DIR / "heat_illness_region_summary.csv",
        illness_summary,
        ["region", "heat_illness_cases"],
    )
    write_csv(
        OUTPUT_DIR / "vulnerable_region_summary.csv",
        elderly_summary,
        ["region", "elderly_rate", "elderly_rate_year"],
    )
    write_csv(
        OUTPUT_DIR / "integrated_heat_risk_by_region.csv",
        integrated,
        [
            "region",
            "weather_risk_score",
            "heatwave_score",
            "heat_illness_score",
            "elderly_score",
            "integrated_heat_risk_score",
        ],
    )

    avg_max_temperature = average([float(row["avg_max_temp"]) for row in weather_summary if row["avg_max_temp"] is not None])
    avg_humidity = average([float(row["avg_humidity"]) for row in weather_summary if row["avg_humidity"] is not None])
    hot_days_total = sum(int(row["days_max_temp_33_or_more"] or 0) for row in weather_summary)
    heatwave_top = max(heatwave_summary, key=lambda row: int(row["heatwave_days_total"]))
    elderly_top = max(elderly_summary, key=lambda row: float(row["elderly_rate"])) if elderly_summary else None
    risk_top = integrated[0] if integrated else None

    analysis_result = {
        "analysis_period": f"{START_YEAR}~{END_YEAR} summer(June~September)",
        "analysis_regions": TARGET_REGIONS,
        "average_max_temperature": avg_max_temperature,
        "average_humidity": avg_humidity,
        "days_max_temp_33_or_more": hot_days_total,
        "total_heat_illness_cases": illness_meta["total_heat_illness_cases"],
        "heat_illness_peak_date": illness_meta["peak_date"],
        "heat_illness_peak_date_cases": illness_meta["peak_date_cases"],
        "temperature_heat_illness_correlation": correlation,
        "heatwave_top_region": heatwave_top["region"],
        "heatwave_top_region_days": heatwave_top["heatwave_days_total"],
        "elderly_rate_top_region": elderly_top["region"] if elderly_top else None,
        "elderly_rate_top_value": elderly_top["elderly_rate"] if elderly_top else None,
        "integrated_heat_risk_top_region": risk_top["region"] if risk_top else None,
        "integrated_heat_risk_top_score": risk_top["integrated_heat_risk_score"] if risk_top else None,
        "region_risk_scores": integrated,
        "weather_region_summary": weather_summary,
        "heatwave_region_summary": heatwave_summary,
        "heat_illness_region_summary": illness_summary,
        "vulnerable_region_summary": elderly_summary,
        "shelter_reference_summary": shelter_summary,
        "reference_data_summary": reference_summary,
        "limitations": limitations,
    }
    (OUTPUT_DIR / "analysis_result.json").write_text(
        json.dumps(analysis_result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    weather_trend_by_year: dict[int, list[float]] = defaultdict(list)
    for row in weather_trend:
        if row["avg_max_temp"] is not None:
            weather_trend_by_year[int(row["year"])].append(float(row["avg_max_temp"]))
    weather_years = sorted(weather_trend_by_year)
    draw_bar_png(
        OUTPUT_DIR / "weather_temperature_trend.png",
        [str(year) for year in weather_years],
        [average(weather_trend_by_year[year]) or 0 for year in weather_years],
        "Weather temperature trend",
        (37, 99, 235),
    )
    yearly_illness = illness_meta["yearly_heat_illness_cases"]
    draw_bar_png(
        OUTPUT_DIR / "heat_illness_trend.png",
        [str(year) for year in yearly_illness],
        [float(count) for count in yearly_illness.values()],
        "Heat illness trend",
        (239, 68, 68),
    )
    draw_bar_png(
        OUTPUT_DIR / "heatwave_days_by_region.png",
        [str(row["region"]) for row in heatwave_summary],
        [float(row["heatwave_days_total"]) for row in heatwave_summary],
        "Heatwave days by region",
        (249, 115, 22),
    )
    draw_bar_png(
        OUTPUT_DIR / "elderly_rate_by_region.png",
        [str(row["region"]) for row in elderly_summary],
        [float(row["elderly_rate"]) for row in elderly_summary],
        "Elderly rate by region",
        (147, 51, 234),
    )
    draw_bar_png(
        OUTPUT_DIR / "integrated_heat_risk_by_region.png",
        [str(row["region"]) for row in integrated],
        [float(row["integrated_heat_risk_score"]) for row in integrated],
        "Integrated heat risk by region",
        (220, 38, 38),
    )

    summary_lines = [
        "# 휴숨 실제 CSV/XLSX 폭염 위험 분석 요약",
        "",
        f"- 분석 기간: {START_YEAR}~{END_YEAR}년 여름철(6~9월)",
        f"- 분석 지역: {', '.join(TARGET_REGIONS)}",
        f"- 평균 최고기온: {avg_max_temperature}도",
        f"- 평균 습도: {avg_humidity}%",
        f"- 최고기온 33도 이상 일수: {hot_days_total}일",
        f"- 총 온열질환자 수: {illness_meta['total_heat_illness_cases']}명",
        f"- 온열질환 최다 날짜: {illness_meta['peak_date']} ({illness_meta['peak_date_cases']}명)",
        f"- 최고기온과 온열질환자 수 상관관계: {correlation}",
        f"- 폭염일수 최다 지역: {heatwave_top['region']} ({heatwave_top['heatwave_days_total']}일)",
        f"- 고령인구 비율 최고 지역: {elderly_top['region'] if elderly_top else '확인 불가'} ({elderly_top['elderly_rate'] if elderly_top else 'N/A'}%)",
        f"- 종합 폭염 취약도 최고 지역: {risk_top['region'] if risk_top else '확인 불가'} ({risk_top['integrated_heat_risk_score'] if risk_top else 'N/A'}점)",
        "",
        "## 지역별 종합 폭염 취약도",
        "",
    ]
    for index, row in enumerate(integrated, start=1):
        summary_lines.append(
            f"{index}. {row['region']}: {row['integrated_heat_risk_score']}점 "
            f"(기상 {row['weather_risk_score']}, 폭염일수 {row['heatwave_score']}, "
            f"온열질환 {row['heat_illness_score']}, 고령인구 {row['elderly_score']})"
        )
    summary_lines.extend(
        [
            "",
            "## 분석 한계 및 참고 처리",
            "",
        ]
    )
    for limitation in limitations:
        summary_lines.append(f"- {limitation}")
    (OUTPUT_DIR / "summary.md").write_text("\n".join(summary_lines) + "\n", encoding="utf-8")


def main() -> None:
    limitations: list[str] = [
        "통합대피소는 API 연동 예정이라 이번 CSV 분석 필수 요소에는 포함하지 않았습니다.",
    ]
    weather_summary, weather_by_date_region, weather_trend = analyze_weather(limitations)
    illness_summary, illness_by_date_region, illness_meta = analyze_heat_illness()
    heatwave_summary = analyze_heatwave()
    elderly_summary = analyze_elderly(limitations)
    reference_summary = analyze_reference_kosis(limitations)
    shelter_summary = analyze_shelter(limitations)

    xs: list[float] = []
    ys: list[float] = []
    for key, weather in weather_by_date_region.items():
        xs.append(weather["max_temp"])
        ys.append(float(illness_by_date_region.get(key, 0)))
    correlation = pearson(xs, ys)

    integrated = create_integrated_risk(weather_summary, heatwave_summary, illness_summary, elderly_summary)
    create_outputs(
        weather_summary,
        weather_trend,
        illness_summary,
        illness_meta,
        heatwave_summary,
        elderly_summary,
        integrated,
        correlation,
        shelter_summary,
        reference_summary,
        limitations,
    )
    print(f"analysis complete: {OUTPUT_DIR}")
    print(f"top risk region: {integrated[0]['region']} ({integrated[0]['integrated_heat_risk_score']})")


if __name__ == "__main__":
    main()
