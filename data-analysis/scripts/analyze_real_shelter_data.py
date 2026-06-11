from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

try:
    import matplotlib.pyplot as plt
except ImportError as error:
    print("matplotlib 설치가 필요합니다: pip install matplotlib")
    raise SystemExit(1) from error


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data-analysis" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "data-analysis" / "output"

COLUMN_MAPPING = {
    "쉼터시설번호": "RSTR_FCLTY_NO",
    "연도": "YEAR",
    "지역코드": "ARCD",
    "시설구분": "FCLTY_TY",
    "쉼터명칭": "RSTR_NM",
    "상세주소": "DTL_ADRES",
    "도로명주소": "RN_DTL_ADRES",
    "면적": "AR",
    "이용가능인원": "USE_PSBL_NMPR",
    "선풍기 수": "COLR_HOLD_ELEFN",
    "에어컨 수": "COLR_HOLD_ARCNDTN",
    "위도": "LA",
    "경도": "LO",
    "평일운영시작시간": "WKDAY_OPER_BEGIN_TIME",
    "평일운영종료시간": "WKDAY_OPER_END_TIME",
    "주말휴일운영시작시간": "WKEND_HDAY_OPER_BEGIN_TIME",
    "주말휴일운영종료시간": "WKEND_HDAY_OPER_END_TIME",
    "시설유형 소분류": "FCLTY_SCLAS",
}

NUMERIC_COLUMNS = [
    "AR",
    "USE_PSBL_NMPR",
    "COLR_HOLD_ELEFN",
    "COLR_HOLD_ARCNDTN",
    "LA",
    "LO",
]

DESCRIPTION_ROW_MARKERS = {
    "RSTR_FCLTY_NO": "쉼터시설번호",
    "YEAR": "년도",
    "USE_PSBL_NMPR": "이용가능인원",
}


def find_data_file() -> Path | None:
    files = sorted([*RAW_DIR.glob("*.csv"), *RAW_DIR.glob("*.xlsx")])
    return files[0] if files else None


def read_data(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        for encoding in ("utf-8-sig", "cp949", "euc-kr", "utf-8"):
            try:
                return pd.read_csv(path, encoding=encoding)
            except UnicodeDecodeError:
                continue
        return pd.read_csv(path)

    return pd.read_excel(path)


def validate_required_columns(df: pd.DataFrame) -> None:
    required = sorted(set(COLUMN_MAPPING.values()))
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"원본 데이터에 필요한 컬럼이 없습니다: {', '.join(missing)}")


def remove_description_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    mask = pd.Series(False, index=df.index)
    for column, marker in DESCRIPTION_ROW_MARKERS.items():
        if column in df.columns:
            mask = mask | df[column].astype(str).str.strip().eq(marker)

    removed_count = int(mask.sum())
    return df.loc[~mask].copy(), removed_count


def convert_numeric_columns(df: pd.DataFrame) -> pd.DataFrame:
    for column in NUMERIC_COLUMNS:
        if column in df.columns:
            cleaned = df[column].astype(str).str.replace(",", "", regex=False).str.strip()
            df[column] = pd.to_numeric(cleaned, errors="coerce").fillna(0)
    return df


def extract_region_from_address(addresses: pd.Series) -> pd.Series:
    values = addresses.fillna("").astype(str).str.strip()
    first_two_parts = values.str.extract(
        r"^([가-힣]+(?:특별자치도|특별자치시|특별시|광역시|도|시))\s+([가-힣]+(?:시|군|구))"
    )
    region = first_two_parts[0] + " " + first_two_parts[1]
    first_part = values.str.extract(r"^([가-힣]+(?:특별자치도|특별자치시|특별시|광역시|도|시))")[0]
    return region.fillna(first_part).replace("", pd.NA)


def derive_region(df: pd.DataFrame) -> pd.Series:
    detail_region = extract_region_from_address(df["DTL_ADRES"])
    road_region = extract_region_from_address(df["RN_DTL_ADRES"])
    code_region = df["ARCD"].fillna("").astype(str).str.strip().str[:2]
    code_region = code_region.where(code_region.ne(""), "지역정보 없음")

    return detail_region.fillna(road_region).fillna(code_region).fillna("지역정보 없음")


def configure_plot() -> None:
    plt.rcParams["axes.unicode_minus"] = False
    for font_name in ("Malgun Gothic", "AppleGothic", "NanumGothic", "DejaVu Sans"):
        plt.rcParams["font.family"] = font_name
        break


def save_bar_chart(series: pd.Series, title: str, filename: str, top_n: int = 15) -> None:
    configure_plot()
    data = series.dropna().head(top_n)
    if data.empty:
        return

    plt.figure(figsize=(10, 6))
    data.sort_values().plot(kind="barh", color="#2563eb")
    plt.title(title)
    plt.xlabel("쉼터 수")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / filename, dpi=160)
    plt.close()


def save_top_chart(df: pd.DataFrame, value_column: str, title: str, filename: str) -> None:
    configure_plot()
    if df.empty:
        return

    data = df.set_index("name")[value_column].sort_values()
    plt.figure(figsize=(10, 6))
    data.plot(kind="barh", color="#16a34a")
    plt.title(title)
    plt.xlabel("수량")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / filename, dpi=160)
    plt.close()


def format_count_series(series: pd.Series, unit: str = "개", limit: int | None = None) -> str:
    data = series if limit is None else series.head(limit)
    if data.empty:
        return "- 분석 가능한 데이터가 없습니다."
    return "\n".join(f"- {index}: {int(value):,}{unit}" for index, value in data.items())


def format_top_table(df: pd.DataFrame, value_column: str, unit: str) -> str:
    if df.empty:
        return "- 분석 가능한 데이터가 없습니다."

    lines = []
    for rank, (_, row) in enumerate(df.iterrows(), start=1):
        address = row["address"] if row["address"] else "주소 정보 없음"
        lines.append(f"{rank}. {row['name']} ({address}): {int(row[value_column]):,}{unit}")
    return "\n".join(lines)


def format_mapping_summary() -> str:
    return "\n".join(f"- {label}: {column}" for label, column in COLUMN_MAPPING.items())


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    data_file = find_data_file()
    if data_file is None:
        print("data-analysis/raw 폴더에 실제 무더위쉼터 CSV 또는 XLSX 파일을 넣어주세요.")
        return 0

    df = read_data(data_file).dropna(how="all")
    validate_required_columns(df)
    df, removed_description_rows = remove_description_rows(df)
    df = convert_numeric_columns(df)

    total_shelters = len(df)
    facility_counts = df["FCLTY_TY"].fillna("미상").astype(str).str.strip().replace("", "미상").value_counts()
    region_counts = derive_region(df).astype(str).value_counts()

    avg_capacity = float(df["USE_PSBL_NMPR"].mean()) if total_shelters else 0.0
    total_capacity = int(df["USE_PSBL_NMPR"].sum())
    total_aircon = int(df["COLR_HOLD_ARCNDTN"].sum())
    total_fan = int(df["COLR_HOLD_ELEFN"].sum())

    capacity_top10 = (
        pd.DataFrame(
            {
                "name": df["RSTR_NM"].fillna("이름 없음").astype(str),
                "address": df["RN_DTL_ADRES"].fillna(df["DTL_ADRES"]).fillna("").astype(str),
                "capacity": df["USE_PSBL_NMPR"],
            }
        )
        .sort_values("capacity", ascending=False)
        .head(10)
    )

    aircon_top10 = (
        pd.DataFrame(
            {
                "name": df["RSTR_NM"].fillna("이름 없음").astype(str),
                "address": df["RN_DTL_ADRES"].fillna(df["DTL_ADRES"]).fillna("").astype(str),
                "aircon": df["COLR_HOLD_ARCNDTN"],
            }
        )
        .sort_values("aircon", ascending=False)
        .head(10)
    )

    save_bar_chart(facility_counts, "시설구분별 쉼터 수", "facility_type_count.png")
    save_bar_chart(region_counts, "지역별 쉼터 수", "region_shelter_count.png")
    save_top_chart(capacity_top10, "capacity", "이용가능인원 상위 10개 쉼터", "capacity_top10.png")
    save_top_chart(aircon_top10, "aircon", "에어컨 수 상위 10개 쉼터", "air_conditioner_top10.png")

    summary = f"""# 실제 무더위쉼터 데이터 분석 요약

## 분석에 사용한 원본 데이터 파일

- `{data_file.name}`

## 전처리

- 첫 번째 한글 설명 행 제거 여부: {"예" if removed_description_rows else "아니오"}
- 제거된 설명 행 수: {removed_description_rows:,}개
- 숫자 변환 컬럼: {", ".join(NUMERIC_COLUMNS)}
- 시설구분 코드 기준 분석: `FCLTY_TY` 값을 코드 그대로 집계했습니다.
- 지역 분석 기준: 1순위 `DTL_ADRES`, 2순위 `RN_DTL_ADRES`, 3순위 `ARCD` 앞자리

## 전체 쉼터 수

- {total_shelters:,}개

## 시설구분별 쉼터 수

{format_count_series(facility_counts)}

## 지역별 쉼터 수

{format_count_series(region_counts)}

## 이용가능인원 분석

- 평균 이용가능인원: {avg_capacity:,.1f}명
- 총 이용가능인원: {total_capacity:,}명

## 냉방기 보유 분석

- 총 에어컨 수: {total_aircon:,}대
- 총 선풍기 수: {total_fan:,}대

## 이용가능인원 상위 10개 쉼터

{format_top_table(capacity_top10, "capacity", "명")}

## 에어컨 수 상위 10개 쉼터

{format_top_table(aircon_top10, "aircon", "대")}

## 분석에 사용한 원본 컬럼 매핑

{format_mapping_summary()}

## 보고서에 넣을 수 있는 문장

행정안전부 무더위쉼터 원본 CSV는 영문 코드 컬럼으로 구성되어 있으며, 첫 번째 행에는 실제 데이터가 아닌 한글 컬럼 설명이 포함되어 있다. 본 분석에서는 해당 설명 행을 제거한 뒤 쉼터명칭, 상세주소, 이용가능인원, 에어컨 수, 선풍기 수 등 주요 항목을 실제 영문 컬럼에 명시적으로 매핑하여 집계했다.

시설구분은 `FCLTY_TY` 코드 기준으로 분석했으며, 지역은 상세주소와 도로명주소에서 우선 추출하고 주소 정보가 부족한 경우 지역코드 앞자리를 보조 기준으로 사용했다. 이를 통해 전체 쉼터 수, 시설구분별 분포, 지역별 분포, 수용 가능 인원과 냉방기 보유 현황을 보고서 지표로 활용할 수 있다.
"""

    (OUTPUT_DIR / "real_data_analysis_summary.md").write_text(summary, encoding="utf-8")
    print(f"분석 완료: {OUTPUT_DIR}")
    print(f"설명 행 제거: {removed_description_rows}개")
    print(f"전체 쉼터 수: {total_shelters:,}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
