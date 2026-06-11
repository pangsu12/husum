# 휴숨 MVP

Expo React Native TypeScript 기반의 휴숨 MVP입니다.

## 환경변수 설정

프로젝트 루트에서 `.env.example`을 참고해 `.env` 파일을 만듭니다.

```env
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here
EXPO_PUBLIC_SHELTER_API_KEY=your_public_data_service_key_here
```

`EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`는 Expo Web에서 네이버 지도 JavaScript SDK를 불러오기 위한 Client ID입니다.

`EXPO_PUBLIC_SHELTER_API_KEY`는 행정안전부 통합대피소 API 호출 구조에 사용하는 공공데이터 서비스 키입니다. 키가 없거나 API 호출이 실패하면 앱은 기존 `mockShelters` 데이터를 fallback으로 사용합니다.

네이버 지도 애플리케이션의 서비스 URL에는 로컬 실행 주소를 등록합니다.

```text
http://localhost
http://localhost:8090
```

Client Secret은 프론트엔드 코드나 `.env`에 넣지 않습니다.

## 실행 방법

```bash
npm install
npx expo start --web
```

기본 포트인 `8081`이 이미 사용 중이면 `8090` 포트로 실행합니다.

```bash
npx expo start --web --port 8090 -c
```

## API 키 보안

Expo Web에서 `EXPO_PUBLIC_` 접두사가 붙은 환경변수는 브라우저 번들에 포함될 수 있습니다. MVP에서는 `.env`로 관리하지만, 실제 서비스에서는 공공데이터 API 키를 서버나 프록시를 통해 보호해야 합니다.

실제 API 키를 소스 코드, README, 커밋 기록에 남기지 마세요.

추후 API 연동 예정 변수는 `.env.example`에 주석으로만 남겨 둡니다.

```env
# EXPO_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here
# EXPO_PUBLIC_SPECIAL_WEATHER_API_KEY=your_special_weather_api_key_here
# EXPO_PUBLIC_KOSIS_API_KEY=your_kosis_api_key_here
```

## 검증 명령어

```bash
npm run typecheck
npx expo export --platform web
```
