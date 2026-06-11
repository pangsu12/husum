# 휴숨 MVP

Expo React Native TypeScript 기반 휴숨 MVP입니다.

## 환경변수 설정

프로젝트 루트에서 `.env.example`을 참고해 `.env` 파일을 만듭니다.

```env
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here
EXPO_PUBLIC_SHELTER_API_KEY=your_public_data_service_key_here
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here
EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY=your_special_weather_api_key_here
```

- `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`: Expo Web에서 네이버 지도 JavaScript SDK를 불러오기 위한 Client ID입니다.
- `EXPO_PUBLIC_SHELTER_API_KEY`: 통합대피소 API 호출에 사용하는 공공데이터 서비스 키입니다.
- `EXPO_PUBLIC_WEATHER_API_KEY`: 홈 화면의 현재 날씨, 기온, 체감온도, 습도 표시를 위한 기상 API 키입니다.
- `EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY`: 폭염주의보/폭염경보 안내를 위한 기상특보 API 키입니다.

API 키가 없거나 호출에 실패하면 앱은 기본 날씨/위험도와 기본 쉼터 데이터를 사용합니다. 사용자 화면에는 실패 사유를 표시하지 않습니다.

Expo Web에서 `EXPO_PUBLIC_` 접두사가 붙은 환경변수는 브라우저 번들에 포함될 수 있습니다. MVP에서는 `.env`로 관리하지만, 실제 서비스에서는 공공데이터 API 키를 서버 또는 프록시 뒤에 두어 보호해야 합니다. 실제 API 키를 소스 코드, README, 커밋 기록에 남기지 마세요.

## 실행 방법

```bash
npm install
npx expo start --web
```

기본 포트가 이미 사용 중이면 8090 포트로 실행합니다.

```bash
npx expo start --web --port 8090 -c
```

## 검증 명령

```bash
npm run typecheck
npx expo export --platform web
```

## 데이터와 API

현재 앱은 통합대피소 API, 네이버 지도 API, 기상 API, 기상특보 API를 안전한 실패 처리와 함께 사용합니다.

KOSIS OpenAPI는 이번 MVP 앱에서 직접 호출하지 않습니다. 현재 분석 탭은 CSV/XLSX 기반 분석 결과를 사용하며, KOSIS 통계 자동 갱신은 실서비스 확장 항목으로 유지합니다.
