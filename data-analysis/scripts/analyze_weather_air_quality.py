from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Iterable

import pandas as pd

try:
    import matplotlib.pyplot as plt
except ImportError as error:
    print("matplotlib 설치가 필요합니다: pip install matplotlib")
    raise SystemExit(1) from error


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data-analysis" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "data-analysis" / "output"

WEATHER_FILE_KEYWORDS = ("weather", "기상", "날씨", "폭염")
AIR_FILE_KEYWORDS = ("air_quality", "airquality", "대기질", "에어코리아", "airkorea", "미세먼지")

WEATHER_COLUMN_CANDIDATES = {
    "datetime": ["datetime", "date_time", "time", "timestamp", "발표시간", "측정시간", "일시", "시간"],
    "region": ["region", "area", "district", "지역", "시군구", "지점명"],
    "temperature": ["temperature", "temp", "기온", "온도", "t1h"],
    "humidity": ["humidity", "humid", "습도", "reh"],
    "apparent_temperature": ["apparent_temperature", "feels_like", "heat_index", "체감온도"],
    "heat_risk_score": ["heat_risk_score", "heat_risk", "폭염위험도", "위험도"],
}

AIR_COLUMN_CANDIDATES = {
    "datetime": ["datetime", "date_time", "time", "timestamp", "측정시간", "일시", "시간", "datatime"],
    "station": ["station", "station_name", "측정소", "측정소명", "stationname"],
    "region": ["region", "area", "district", "지역", "시군구", "sidoname"],
    "pm10": ["pm10", "pm_10", "pm10value", "미세먼지", "미세먼지농도"],
    "pm25": ["pm25", "pm2.5", "pm_25", "pm25value", "초미세먼지", "초미세먼지농도"],
    "ozone": ["ozone", "o3", "o3value", "오존"],
    "air_quality_index": ["air_quality_index", "aqi", "khaivalue", "통합대기환경지수", "통합대기지수"],
    "air_risk_score": ["air_risk_score", "air_risk", "실외이동위험도", "대기질위험도"],
}

WEATHER_NUMERIC_KEYS = ("temperature", "humidity", "apparent_temperature", "heat_risk_score")
AIR_NUMERIC_KEYS = ("pm10", "pm25", "ozone", "air_quality_index", "air_risk_score")
DESCRIPTION_MARKERS = {
    "datetime",
    "발표시간",
    "측정시간",
    "일시",
    "region",
    "지역",
    "temperature",
    "기온",
    "humidity",
    "습도",
    "pm10",
    "미세먼지",
    "pm25",
    "초미세먼지",
    "ozone",
    "오존",
}


def normalize_name(value: object) -> str:
    return re.sub(r"[^0-9a-zA-Z가-힣.]+", "", str(value)).lower()


def find_data_files(keywords: Iterable[str]) -> list[Path]:
    files = [*RAW_DIR.glob("*.csv"), *RAW_DIR.glob("*.xlsx")]
    return sorted(
        path
        for path in files
        if any(keyword.lower() in path.name.lower() for keyword in keywords)
    )


def read_data(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        for encoding in ("utf-8-sig", "cp949", "euc-kr", "utf-8"):
            try:
                return pd.read_csv(path, encoding=encoding)
            except UnicodeDecodeError:
                continue
        return pd.read_csv(path)

    return pd.read_excel(path)


def match_columns(columns: Iterable[str], candidates: dict[str, list[str]]) -> dict[str, str | None]:
    normalized_columns = {normalize_name(column): column for column in columns}
    matched: dict[str, str | None] = {}

    for key, names in candidates.items():
        matched[key] = None
        normalized_candidates = [normalize_name(name) for name in names]

        for candidate in normalized_candidates:
            if candidate in normalized_columns:
                matched[key] = normalized_columns[candidate]
                break

        if matched[key] is not None:
            continue

        for normalized_column, original_column in normalized_columns.items():
            if any(candidate in normalized_column or normalized_column in candidate for candidate in normalized_candidates):
                matched[key] = original_column
                break

    return matched


def remove_description_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    if df.empty:
        return df, 0

    normalized_first_row = {normalize_name(value) for value in df.iloc[0].tolist()}
    marker_count = sum(1 for marker in DESCRIPTION_MARKERS if normalize_name(marker) in normalized_first_row)

    if marker_count >= 2:
        return df.iloc[1:].copy(), 1

    return df.copy(), 0


def clean_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False).str.strip()
    cleaned = cleaned.str.extract(r"([-+]?\d*\.?\d+)")[0]
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)


def parse_datetime(series: pd.Series | None) -> pd.Series:
    if series is None:
        return pd.Series(dtype="datetime64[ns]")
    return pd.to_datetime(series, errors="coerce")


def hour_label(datetime_series: pd.Series, fallback_length: int) -> pd.Series:
    parsed = parse_datetime(datetime_series)
    if parsed.notna().any():
        return parsed.dt.hour.fillna(-1).astype(int).astype(str).replace("-1", "시간정보 없음")
    return pd.Series(["시간정보 없음"] * fallback_length)


def load_dataset(
    files: list[Path],
    candidates: dict[str, list[str]],
    numeric_keys: Iterable[str],
) -> tuple[pd.DataFrame, dict[str, str | None], list[str], int]:
    frames = []
    used_files = []
    removed_rows = 0
    matched_columns: dict[str, str | None] = {key: None for key in candidates}

    for path in files:
        df = read_data(path).dropna(how="all")
        df, removed = remove_description_rows(df)
        columns = match_columns(df.columns, candidates)

        for key, column in columns.items():
            if matched_columns.get(key) is None and column is not None:
                matched_columns[key] = column

        normalized = pd.DataFrame(index=df.index)
        for key in candidates:
            source_column = columns[key]
            normalized[key] = df[source_column] if source_column else pd.NA

        for key in numeric_keys:
            normalized[key] = clean_numeric(normalized[key])

        normalized["source_file"] = path.name
        frames.append(normalized)
        used_files.append(path.name)
        removed_rows += removed

    if not frames:
        return pd.DataFrame(), matched_columns, used_files, removed_rows

    return pd.concat(frames, ignore_index=True), matched_columns, used_files, removed_rows


def calculate_heat_risk_score(df: pd.DataFrame) -> pd.Series:
    if "heat_risk_score" in df and df["heat_risk_score"].fillna(0).gt(0).any():
        return df["heat_risk_score"].clip(0, 100)

    base_temperature = df["apparent_temperature"].where(
        df["apparent_temperature"].fillna(0).gt(0),
        df["temperature"],
    )
    humidity = df["humidity"]

    score = pd.Series(0.0, index=df.index)
    score += ((base_temperature - 27).clip(lower=0) * 8)
    score += (base_temperature >= 30).astype(int) * 10
    score += (base_temperature >= 33).astype(int) * 18
    score += (base_temperature >= 35).astype(int) * 15
    score += ((humidity - 60).clip(lower=0) * 0.7)
    score += (humidity >= 70).astype(int) * 8
    return score.clip(0, 100).round(1)


def calculate_air_risk_score(df: pd.DataFrame) -> pd.Series:
    if "air_risk_score" in df and df["air_risk_score"].fillna(0).gt(0).any():
        return df["air_risk_score"].clip(0, 100)

    score = pd.Series(0.0, index=df.index)
    score += (df["pm10"] / 150 * 25).clip(0, 25)
    score += (df["pm25"] / 75 * 30).clip(0, 30)
    score += (df["ozone"] / 0.15 * 25).clip(0, 25)
    score += (df["air_quality_index"] / 250 * 20).clip(0, 20)
    return score.clip(0, 100).round(1)


def configure_plot() -> None:
    plt.rcParams["axes.unicode_minus"] = False
    for font_name in ("Malgun Gothic", "AppleGothic", "NanumGothic", "DejaVu Sans"):
        plt.rcParams["font.family"] = font_name
        break


def save_line_chart(series: pd.Series, title: str, ylabel: str, filename: str) -> None:
    if series.empty:
        return

    configure_plot()
    plt.figure(figsize=(10, 5))
    series.plot(kind="line", marker="o", color="#2563eb")
    plt.title(title)
    plt.xlabel("시간대")
    plt.ylabel(ylabel)
    plt.grid(axis="y", alpha=0.25)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / filename, dpi=160)
    plt.close()


def save_bar_chart(series: pd.Series, title: str, ylabel: str, filename: str) -> None:
    if series.empty:
        return

    configure_plot()
    plt.figure(figsize=(10, 5))
    series.sort_values().plot(kind="barh", color="#16a34a")
    plt.title(title)
    plt.xlabel(ylabel)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / filename, dpi=160)
    plt.close()


def format_file_list(files: list[str]) -> str:
    return ", ".join(f"`{name}`" for name in files) if files else "없음"


def format_number(value: float | int | None, suffix: str = "") -> str:
    if value is None or pd.isna(value):
        return "분석 불가"
    return f"{value:,.1f}{suffix}"


def mapping_lines(columns: dict[str, str | None]) -> str:
    return "\n".join(f"- {key}: {value or '매칭 안 됨'}" for key, value in columns.items())


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    weather_files = find_data_files(WEATHER_FILE_KEYWORDS)
    air_files = find_data_files(AIR_FILE_KEYWORDS)

    if not weather_files and not air_files:
        print("data-analysis/raw 폴더에 기상 또는 대기질 실제 CSV/XLSX 파일을 넣어주세요.")
        return 0

    weather_df, weather_columns, weather_names, weather_removed_rows = load_dataset(
        weather_files,
        WEATHER_COLUMN_CANDIDATES,
        WEATHER_NUMERIC_KEYS,
    )
    air_df, air_columns, air_names, air_removed_rows = load_dataset(
        air_files,
        AIR_COLUMN_CANDIDATES,
        AIR_NUMERIC_KEYS,
    )

    if not weather_df.empty:
        weather_df["hour"] = hour_label(weather_df["datetime"], len(weather_df))
        weather_df["heat_risk_score"] = calculate_heat_risk_score(weather_df)

    if not air_df.empty:
        air_df["hour"] = hour_label(air_df["datetime"], len(air_df))
        air_df["air_risk_score"] = calculate_air_risk_score(air_df)

    hourly_temperature = (
        weather_df.groupby("hour")["temperature"].mean().sort_index()
        if not weather_df.empty
        else pd.Series(dtype="float64")
    )
    hourly_humidity = (
        weather_df.groupby("hour")["humidity"].mean().sort_index()
        if not weather_df.empty
        else pd.Series(dtype="float64")
    )
    hourly_heat_risk = (
        weather_df.groupby("hour")["heat_risk_score"].mean().sort_index()
        if not weather_df.empty
        else pd.Series(dtype="float64")
    )
    air_risk_by_hour = (
        air_df.groupby("hour")["air_risk_score"].mean().sort_index()
        if not air_df.empty
        else pd.Series(dtype="float64")
    )

    total_risk = pd.Series(dtype="float64")
    if not hourly_heat_risk.empty and not air_risk_by_hour.empty:
        total_risk = hourly_heat_risk.add(air_risk_by_hour, fill_value=0).clip(0, 200).sort_index()

    highest_heat_hour = hourly_heat_risk.idxmax() if not hourly_heat_risk.empty else "분석 불가"
    highest_air_hour = air_risk_by_hour.idxmax() if not air_risk_by_hour.empty else "분석 불가"
    highest_total_hour = total_risk.idxmax() if not total_risk.empty else highest_heat_hour

    save_line_chart(hourly_temperature, "시간대별 평균 기온", "기온(도)", "hourly_temperature.png")
    save_line_chart(hourly_heat_risk, "시간대별 폭염 위험도", "위험도(0-100)", "hourly_heat_risk.png")
    save_bar_chart(air_risk_by_hour, "시간대별 대기질 위험도", "위험도(0-100)", "air_quality_risk.png")
    save_line_chart(total_risk, "시간대별 종합 이동 위험도", "위험도(0-200)", "climate_air_total_risk.png")

    avg_temperature = weather_df["temperature"].mean() if not weather_df.empty else None
    avg_humidity = weather_df["humidity"].mean() if not weather_df.empty else None
    avg_pm10 = air_df["pm10"].mean() if not air_df.empty else None
    avg_pm25 = air_df["pm25"].mean() if not air_df.empty else None
    avg_ozone = air_df["ozone"].mean() if not air_df.empty else None

    summary = f"""# 기상 및 대기질 데이터 분석 요약

## 분석에 사용한 파일명

- 기상 데이터: {format_file_list(weather_names)}
- 대기질 데이터: {format_file_list(air_names)}

## 전처리

- 기상 데이터 설명 행 제거 수: {weather_removed_rows:,}개
- 대기질 데이터 설명 행 제거 수: {air_removed_rows:,}개
- 한글/영문 컬럼 후보를 자동 매칭하고 숫자 컬럼은 `pd.to_numeric(..., errors="coerce").fillna(0)` 방식으로 변환했습니다.

## 데이터 행 수

- 기상 데이터 행 수: {len(weather_df):,}개
- 대기질 데이터 행 수: {len(air_df):,}개

## 주요 평균값

- 평균 기온: {format_number(avg_temperature, "도")}
- 평균 습도: {format_number(avg_humidity, "%")}
- 평균 미세먼지: {format_number(avg_pm10)}
- 평균 초미세먼지: {format_number(avg_pm25)}
- 평균 오존: {format_number(avg_ozone)}

## 가장 위험한 시간대

- 폭염 위험도가 가장 높은 시간대: {highest_heat_hour}
- 대기질 위험도가 가장 높은 시간대: {highest_air_hour}
- 종합 이동 위험도가 가장 높은 시간대: {highest_total_hour}

## 폭염 위험도 분석 결과

기온 30도 이상, 33도 이상, 35도 이상 구간과 습도 70% 이상 조건을 반영해 `heat_risk_score`를 0~100점으로 계산했습니다. 체감온도 컬럼이 있는 경우 기온보다 체감온도를 우선 사용합니다.

## 대기질 위험도 분석 결과

미세먼지, 초미세먼지, 오존, 통합대기환경지수를 기준으로 `air_risk_score`를 0~100점으로 계산했습니다. 값이 높을수록 실외 이동 위험도가 높은 것으로 해석합니다.

## 휴숨 앱 추천 알고리즘에 반영할 수 있는 점

- 폭염 위험도가 높은 시간대에는 현재 위치에서 가까운 쉼터를 우선 추천해야 합니다.
- 대기질 위험도가 높은 시간대에는 이동 거리가 긴 쉼터보다 접근성이 좋은 쉼터를 우선 추천해야 합니다.
- 종합 이동 위험도(`climate_air_total_risk`)가 높은 시간대에는 에어컨과 선풍기 보유 수가 많고 이용가능인원이 충분한 쉼터에 가중치를 줄 수 있습니다.
- 지역별 기상/대기질 데이터가 확보되면 쉼터 위치와 결합해 지역 맞춤형 추천 점수 보정이 가능합니다.

## 분석에 사용한 컬럼 매핑

### 기상 데이터

{mapping_lines(weather_columns)}

### 대기질 데이터

{mapping_lines(air_columns)}

## 보고서에 넣을 수 있는 문장

기상 데이터와 대기질 데이터는 무더위쉼터 추천에서 이동 위험도를 판단하는 핵심 외부 변수로 활용할 수 있다. 폭염 위험도는 기온, 습도, 체감온도를 기반으로 계산하고, 대기질 위험도는 미세먼지, 초미세먼지, 오존, 통합대기환경지수를 기준으로 계산한다. 두 점수를 합산한 종합 이동 위험도가 높은 시간대에는 가까운 쉼터와 냉방 설비가 좋은 쉼터를 우선 추천하는 방식으로 휴숨 앱의 추천 알고리즘을 개선할 수 있다.
"""

    output_path = OUTPUT_DIR / "weather_air_quality_analysis_summary.md"
    output_path.write_text(summary, encoding="utf-8")

    print(f"분석 완료: {output_path}")
    print(f"기상 데이터 행 수: {len(weather_df):,}개")
    print(f"대기질 데이터 행 수: {len(air_df):,}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
