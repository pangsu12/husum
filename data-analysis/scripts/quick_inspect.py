import pandas as pd
from pathlib import Path

raw_dir = Path("data-analysis/raw")
files = list(raw_dir.glob("*.csv")) + list(raw_dir.glob("*.xlsx"))

print("파일 목록:")
for f in files:
    print("-", f)

if not files:
    print("raw 폴더에 csv 또는 xlsx 파일이 없습니다.")
    raise SystemExit

file = files[0]
print("\n분석 파일:", file)

if file.suffix.lower() == ".csv":
    encodings = ["utf-8-sig", "cp949", "euc-kr", "utf-8"]
    last_error = None
    for enc in encodings:
        try:
            df = pd.read_csv(file, encoding=enc)
            print("사용 인코딩:", enc)
            break
        except Exception as e:
            last_error = e
    else:
        raise last_error
else:
    df = pd.read_excel(file)

print("\n행 개수:", len(df))
print("\n컬럼 목록:")
for col in df.columns:
    print("-", col)

print("\n앞 5행:")
print(df.head())

output_dir = Path("data-analysis/output")
output_dir.mkdir(parents=True, exist_ok=True)

with open(output_dir / "raw_data_inspection.md", "w", encoding="utf-8") as f:
    f.write("# 원본 데이터 점검 결과\n\n")
    f.write(f"## 파일명\n\n- {file.name}\n\n")
    f.write(f"## 행 개수\n\n- {len(df)}개\n\n")
    f.write("## 컬럼 목록\n\n")
    for col in df.columns:
        f.write(f"- {col}\n")
    f.write("\n## 앞 5행\n\n")
    f.write(df.head().to_markdown(index=False))

print("\n저장 완료: data-analysis/output/raw_data_inspection.md")
