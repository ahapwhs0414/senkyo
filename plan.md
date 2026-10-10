# plan.md — 2026 일본 여행 실행 계획

계획 버전: 2026-10-10-r4 · 기준: 2026-10-10 사용자 첨부 전체 일정
기간: 2026-12-22(화)~12-27(일), 5박 6일 · 2명 · Asia/Tokyo

## 0. 적용 원칙

- 이 파일이 여행 데이터의 단일 원본이다. 일정 변경은 먼저 이 파일에 기록하고 importer로 웹 데이터와 migration을 생성한다.
- 이전 r3 원문은 docs/archives/TRIP_PLAN_R3.md에 보존한다. 적용한 001~006 migration은 수정하지 않는다.
- 아래 시각은 사용자의 계획값이며 운행 검증·예약 완료가 아니다. 빈 시간에 별도 일정·이동·식당을 만들어 넣지 않는다.
- 같은 방문이 다른 날짜로 옮겨도 안정 키는 유지한다. 키의 d4/d5 접두어는 현재 날짜가 아닌 최초 식별자다. 표시 날짜는 표의 날짜를 따른다.
- N’EX에서 Skyliner로, 기존 호수가 적힌 열차에서 우에노 출도착 열차로 바뀐 예약은 새 슬롯을 만들고 옛 예약·첨부는 보관한다. 자동 이관하지 않는다.
- 예약번호·좌석·QR·개인자료는 문서에 넣지 않는다. 지출·정산·계획 편집·후보 식당 기능을 복원하지 않는다.

## 1. 항공 및 숙박

| 구분 | 날짜 | 대상 | 사용자 제공 시간 / 숙박 |
|---|---|---|---|
| 출국 | 12/22 | 대구 → 나리타 | 11:10~13:20 |
| 귀국 | 12/27 | 나리타 → 대구 | 14:20~16:50 |
| 숙소 | 12/22 | APA 호텔 TKP 센다이 에키기타 | 1박, 12/23 체크아웃 |
| 숙소 | 12/23 | 호텔 사칸 | 1박, 12/24 체크아웃 |
| 숙소 | 12/24~26 | APA Hotel Ueno Ekikita | 3박, 12/27 체크아웃 |

## 2. 확인이 필요한 계획값

- 요시노야: 1일차 아침의 날짜·지점 미정. 일본 도착은 13:20이므로 임의 지점을 표시하지 않는다.
- 코메다·돈키호테·SOU・SOU·GU·유니클로: 지점 미정. 쇼핑 이름은 보존하되 임의 지점/좌표 없음.
- Skyliner 왕복 및 우에노↔센다이 열차: 이용일 운행·좌석·승강장·터미널 확인. 열차 호수는 새 첨부에 없어 만들지 않는다.
- 사칸 셔틀·아키우 폭포 버스: 실제 예약 안내와 겨울 운행표 확인. 장소 핀은 승차장 확인을 대신하지 않는다.
- 2일차 점심 대기, 3일차 폭포 복귀·라이라이쿄→카이치 이동 및 식당 영업 확인.
- 5일차 신바시/다케시바 경유 교통편은 미정. 17:00 전후 일몰 감상은 계획값이며 실제 일몰 시간은 별도 확인.
- 스시로 유라쿠초 토요일 10:30 영업은 사용자가 첨부한 안내. 여행일 영업·주소 재확인 필요.
- 귀국 T2는 사용자가 지정한 계획. 실제 항공편의 터미널과 수속 여유를 확인한다.
- 2026 센다이·롯폰기·마루노우치 행사 개최/점등시간은 미확정이다.

## 3. 장소 및 Google Maps 연결표

Google Maps 검색 링크는 API 키 없이 이용한다. 내장 지도는 이 검색어로 Google의 실제 응답 위치를 조회하고 검색 결과임을 표시한다. 검색 결과를 검증된 지점으로 DB에 저장하지 않는다. Place ID/좌표를 만들지 않는다.

| place_key | 장소 | 종류 | 지도 |
|---|---|---|---|
| `daegu-airport` | 대구공항 | AIRPORT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%EB%8C%80%EA%B5%AC%EA%B5%AD%EC%A0%9C%EA%B3%B5%ED%95%AD) |
| `narita-airport` | 나리타공항 | AIRPORT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%88%90%E7%94%B0%E5%9B%BD%E9%9A%9B%E7%A9%BA%E6%B8%AF) |
| `tokyo-station` | 도쿄역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E9%A7%85) |
| `sendai-station` | 센다이역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BB%99%E5%8F%B0%E9%A7%85) |
| `apa-sendai` | APA 호텔 TKP 센다이 에키기타 | HOTEL | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%91%E3%83%9B%E3%83%86%E3%83%AB+TKP%E4%BB%99%E5%8F%B0%E9%A7%85%E5%8C%97) |
| `sakan` | 호텔 사칸 | HOTEL | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BC%9D%E6%89%BF%E5%8D%83%E5%B9%B4%E3%81%AE%E5%AE%BF+%E4%BD%90%E5%8B%98+%E7%A7%8B%E4%BF%9D) |
| `apa-ueno` | APA Hotel Ueno Ekikita | HOTEL | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%91%E3%83%9B%E3%83%86%E3%83%AB+%E4%B8%8A%E9%87%8E%E9%A7%85%E5%8C%97) |
| `umami-tasuke` | 우마미 타스케 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A8%E5%91%B3%E5%A4%AA%E5%8A%A9+%E4%BB%99%E5%8F%B0) |
| `jozenji` | 조젠지도리 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%AE%9A%E7%A6%85%E5%AF%BA%E9%80%9A+%E4%BB%99%E5%8F%B0) |
| `ichibancho` | 이치반초 | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%80%E7%95%AA%E7%94%BA+%E4%BB%99%E5%8F%B0) |
| `nakanosakae` | 나카노사카에역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%AD%E9%87%8E%E6%A0%84%E9%A7%85) |
| `aquarium` | 센다이 우미노모리 수족관 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BB%99%E5%8F%B0%E3%81%86%E3%81%BF%E3%81%AE%E6%9D%9C%E6%B0%B4%E6%97%8F%E9%A4%A8) |
| `oyama-sendai` | 하카타 모츠나베 오오야마 센다이점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%8D%9A%E5%A4%9A%E3%82%82%E3%81%A4%E9%8D%8B%E3%81%8A%E3%81%8A%E3%82%84%E3%81%BE+%E4%BB%99%E5%8F%B0%E5%BA%97) |
| `akiu-sato` | 아키우·사토센터 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%A7%8B%E4%BF%9D+%E9%87%8C%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC) |
| `akiu-falls` | 아키우 대폭포 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%A7%8B%E4%BF%9D%E5%A4%A7%E6%BB%9D) |
| `rairaikyo` | 라이라이쿄 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%A3%8A%E3%80%85%E5%B3%A1) |
| `kaichi-honten` | 仙台中華そば 銘店嘉一 本店 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BB%99%E5%8F%B0%E4%B8%AD%E8%8F%AF%E3%81%9D%E3%81%B0+%E9%8A%98%E5%BA%97%E5%98%89%E4%B8%80+%E6%9C%AC%E5%BA%97+%E7%A7%8B%E4%BF%9D) |
| `ueno-station` | 우에노역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E9%87%8E%E9%A7%85) |
| `ark-hills` | 아크 힐즈 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%BC%E3%82%AF%E3%83%92%E3%83%AB%E3%82%BA) |
| `tsujihan-ark` | 츠지한 아크 힐즈점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A5%E6%9C%AC%E6%A9%8B%E6%B5%B7%E9%AE%AE%E4%B8%BC+%E3%81%A4%E3%81%98%E5%8D%8A+%E3%82%A2%E3%83%BC%E3%82%AF%E3%83%92%E3%83%AB%E3%82%BA%E5%BA%97) |
| `roppongi-hills` | 롯폰기 힐즈 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%85%AD%E6%9C%AC%E6%9C%A8%E3%83%92%E3%83%AB%E3%82%BA) |
| `keyakizaka` | 게야키자카 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%85%AD%E6%9C%AC%E6%9C%A8%E3%81%91%E3%82%84%E3%81%8D%E5%9D%82%E9%80%9A%E3%82%8A) |
| `shiba-park` | 시바공원 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E8%8A%9D%E5%85%AC%E5%9C%92+%E6%9D%B1%E4%BA%AC) |
| `tokyo-tower` | 도쿄타워 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E3%82%BF%E3%83%AF%E3%83%BC) |
| `shibuya` | 시부야 | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%8B%E8%B0%B7+%E6%9D%B1%E4%BA%AC) |
| `shibuya-parco` | 시부야 PARCO | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%8B%E8%B0%B7PARCO) |
| `hachiko` | 하치코 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%BF%A0%E7%8A%AC%E3%83%8F%E3%83%81%E5%85%AC%E5%83%8F) |
| `scramble` | 시부야 스크램블 교차로 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%B8%8B%E8%B0%B7%E3%82%B9%E3%82%AF%E3%83%A9%E3%83%B3%E3%83%96%E3%83%AB%E4%BA%A4%E5%B7%AE%E7%82%B9) |
| `nihonbashi` | 니혼바시 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A5%E6%9C%AC%E6%A9%8B+%E6%9D%B1%E4%BA%AC) |
| `hajime` | 니혼바시 돈카츠 하지메 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%97%A5%E6%9C%AC%E6%A9%8B+%E3%81%A8%E3%82%93%E3%81%8B%E3%81%A4+%E4%B8%80+HAJIME) |
| `marunouchi` | 마루노우치 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%B8%E3%81%AE%E5%86%85+%E4%BB%B2%E9%80%9A%E3%82%8A+%E6%9D%B1%E4%BA%AC) |
| `ueno-park` | 우에노공원 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%B8%8A%E9%87%8E%E6%81%A9%E8%B3%9C%E5%85%AC%E5%9C%92) |
| `ameyoko` | 아메요코 | SHOPPING | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%A2%E3%83%A1%E6%A8%AA+%E6%9D%B1%E4%BA%AC) |
| `unatoto-ueno` | 나다이 우나토토 우에노점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E5%90%8D%E4%BB%A3+%E5%AE%87%E5%A5%88%E3%81%A8%E3%81%A8+%E4%B8%8A%E9%87%8E%E5%BA%97) |
| `odaiba` | 오다이바 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%81%8A%E5%8F%B0%E5%A0%B4+%E6%9D%B1%E4%BA%AC) |
| `moheji-ueno` | 츠키시마 몬자 모헤지 우에노점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9C%88%E5%B3%B6%E3%82%82%E3%82%93%E3%81%98%E3%82%83+%E3%82%82%E3%81%B8%E3%81%98+%E4%B8%8A%E9%87%8E%E5%BA%97) |
| `kokyo` | 고쿄 외원 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%9A%87%E5%B1%85%E5%A4%96%E8%8B%91) |
| `nijubashi` | 니주바시 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E7%9A%87%E5%B1%85+%E4%BA%8C%E9%87%8D%E6%A9%8B) |
| `keisei-ueno` | 게이세이 우에노역 | STATION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E4%BA%AC%E6%88%90%E4%B8%8A%E9%87%8E%E9%A7%85) |
| `narita-t2` | 나리타공항 제2터미널 | AIRPORT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%88%90%E7%94%B0%E7%A9%BA%E6%B8%AF%20%E7%AC%AC2%E3%82%BF%E3%83%BC%E3%83%9F%E3%83%8A%E3%83%AB) |
| `yurakucho` | 유라쿠초 | ATTRACTION | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E6%9C%89%E6%A5%BD%E7%94%BA%20%E6%9D%B1%E4%BA%AC) |
| `sushiro-yurakucho` | 스시로 aune 유라쿠초점 | RESTAURANT | [지도 검색](https://www.google.com/maps/search/?api=1&query=%E3%82%B9%E3%82%B7%E3%83%AD%E3%83%BC%20aune%E6%9C%89%E6%A5%BD%E7%94%BA%E5%BA%97%20%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8D%83%E4%BB%A3%E7%94%B0%E5%8C%BA%E6%9C%89%E6%A5%BD%E7%94%BA2%E4%B8%81%E7%9B%AE3-5) |

## 4. 6일 전체 일정

첨부의 모든 시간 행을 반영한다. 시부야 쇼핑 하위 상점은 별도 시간이 없어 쇼핑 메모로 둔다.

### 1일차 · 2026-12-22 · 대구 → 나리타 → 우에노 → 센다이

숙소: APA 호텔 TKP 센다이 에키기타

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d1-yoshinoya` | 아침·시간 미정 | MEAL | 요시노야 | — | 아침 계획 보존 · 일본 도착 전이므로 날짜·방문 지점 확인 필요 |
| `d1-arrive-airport` | 08:50 | OTHER | 대구공항 도착 | daegu-airport | — |
| `d1-checkin-flight` | 08:50~10:30 | OTHER | 체크인·출국수속 | daegu-airport | — |
| `d1-flight-out` | 11:10~13:20 | FLIGHT | 대구 → 나리타 | daegu-airport,narita-airport | — |
| `d1-immigration` | 13:20~14:20 | OTHER | 입국심사·수하물 수령 | narita-airport | — |
| `d1-skyliner-platform` | 14:20~14:35 | OTHER | 스카이라이너 승강장 이동 | narita-airport | — |
| `d1-skyliner-out` | 14:42~15:23 | TRAIN | 나리타공항 → 게이세이 우에노 / Skyliner | narita-airport,keisei-ueno | 사용자 계획값 · 출발 터미널·이용일 운행·좌석 확인 |
| `d1-jr-ueno-transfer` | 15:23~15:40 | TRANSIT | JR 우에노역 이동 | keisei-ueno,ueno-station | — |
| `d1-shinkansen-platform` | 15:40~15:55 | OTHER | 신칸센 승강장 이동 | ueno-station | — |
| `d1-shinkansen-out` | 16:06~18:06 | TRAIN | 우에노 → 센다이 | ueno-station,sendai-station | 사용자 계획값 · 열차명·호수·좌석은 미확정 |
| `d1-hotel-transfer` | 18:06~18:20 | TRANSIT | 호텔 이동 | sendai-station,apa-sendai | — |
| `d1-hotel-checkin` | 18:20~18:35 | HOTEL | 체크인 | apa-sendai | — |
| `d1-meal-transfer` | 18:35~18:50 | TRANSIT | 우마미 타스케 이동 | apa-sendai,umami-tasuke | — |
| `d1-dinner` | 18:50~19:40 | MEAL | 우마미 타스케 | umami-tasuke | — |
| `d1-lights-transfer` | 19:40~19:55 | TRANSIT | 조젠지도리 이동 | umami-tasuke,jozenji | — |
| `d1-pageant` | 19:55~21:00 | ATTRACTION | 센다이 빛의 페이전트 | jozenji | 2026 행사 개최일·점등시간 별도 확인 |
| `d1-walk` | 21:00~21:30 | WALK | 이치반초 산책 | ichibancho | — |
| `d1-hotel-return` | 21:30~22:00 | TRANSIT | 호텔 복귀 | ichibancho,apa-sendai | — |

### 2일차 · 2026-12-23 · 우미노모리 수족관 → 모츠나베 → 사칸

숙소: 호텔 사칸

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d2-breakfast` | 07:30~08:15 | MEAL | 호텔 조식 또는 편의점 | — | — |
| `d2-checkout` | 08:15~08:30 | HOTEL | 체크아웃·짐 보관 | apa-sendai | — |
| `d2-station-transfer` | 08:30~08:45 | TRANSIT | 센다이역 이동 | apa-sendai,sendai-station | — |
| `d2-train-aquarium` | 08:45~09:10 | TRAIN | 센다이 → 나카노사카에 | sendai-station,nakanosakae | — |
| `d2-walk-aquarium` | 09:10~09:30 | TRANSIT | 수족관 이동 | nakanosakae,aquarium | — |
| `d2-entry` | 09:30~10:00 | OTHER | 입장 준비 | aquarium | — |
| `d2-aquarium` | 10:00~13:00 | ATTRACTION | 센다이 우미노모리 수족관 | aquarium | — |
| `d2-walk-station` | 13:00~13:20 | TRANSIT | 나카노사카에역 이동 | aquarium,nakanosakae | — |
| `d2-train-sendai` | 13:20~13:45 | TRAIN | 센다이역 복귀 | nakanosakae,sendai-station | — |
| `d2-lunch` | 13:45~14:35 | MEAL | 하카타 모츠나베 오오야마 센다이점 | oyama-sendai | 대기 포함 50분 식사 가능 여부·15:30 셔틀 연결 확인 |
| `d2-hotel-transfer` | 14:35~14:55 | TRANSIT | 호텔 이동·짐 수령 | oyama-sendai,apa-sendai | — |
| `d2-shuttle-transfer` | 14:55~15:10 | TRANSIT | 센다이역 동쪽 출구 이동 | apa-sendai,sendai-station | 센다이역 핀은 정확한 셔틀 승차장을 대신하지 않음 |
| `d2-shuttle-wait` | 15:10~15:25 | OTHER | 셔틀 대기 | sendai-station | — |
| `d2-shuttle` | 15:30~16:15 | SHUTTLE | 센다이 → 사칸 | sendai-station,sakan | 예약자료에서 실제 승차장·출발시각 확인 |
| `d2-hotel-checkin` | 16:15~16:40 | HOTEL | 체크인 | sakan | — |
| `d2-walk` | 16:40~17:30 | WALK | 아키우 온천마을 | sakan | — |
| `d2-onsen` | 17:30~18:30 | OTHER | 온천 | sakan | — |
| `d2-dinner` | 18:30~20:00 | MEAL | 사칸 석식 | sakan | — |
| `d2-rest` | 20:00~22:00 | FREE_TIME | 휴식·야간 온천 | sakan | — |

### 3일차 · 2026-12-24 · 아키우 대폭포 → 라이라이쿄 → 카이치 → 우에노 → 롯폰기

숙소: APA Hotel Ueno Ekikita

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d3-breakfast` | 07:00~08:00 | MEAL | 사칸 조식 | sakan | — |
| `d3-packing` | 08:00~08:35 | OTHER | 객실 정리 | sakan | — |
| `d3-checkout` | 08:35~08:50 | HOTEL | 체크아웃·짐 보관 | sakan | — |
| `d3-sato-transfer` | 08:50~09:10 | TRANSIT | 사토센터 이동 | sakan,akiu-sato | — |
| `d3-bus-falls` | 09:20 전후 | BUS | 아키우 대폭포 이동 | akiu-sato,akiu-falls | 겨울 평일 버스 운행·정류장 확인 · 도착시각을 임의 생성하지 않음 |
| `d3-falls` | 09:45~10:20 | ATTRACTION | 아키우 대폭포 | akiu-falls | 10:23 버스 전 정류장 복귀 · 결빙 시 관람 범위 확인 |
| `d3-bus-return` | 10:23 | BUS | 아키우 온천 복귀 버스 | akiu-falls,akiu-sato | 사용자가 제공한 출발 10:23 · 운행 재확인 |
| `d3-sato-arrival` | 10:50 전후 | OTHER | 사토센터 | akiu-sato | — |
| `d3-rairaikyo` | 10:50~11:30 | WALK | 라이라이쿄 | rairaikyo | — |
| `d3-lunch` | 11:40~12:40 | MEAL | 仙台中華そば 銘店嘉一 本店 | kaichi-honten | 아키우 본점 · 영업 및 라이라이쿄에서 이동 가능 여부 확인 |
| `d3-village` | 12:40~13:25 | WALK | 온천마을·기념품 | akiu-sato | — |
| `d3-sakan-transfer` | 13:25~14:00 | TRANSIT | 사칸 이동·짐 수령 | akiu-sato,sakan | — |
| `d3-shuttle-wait` | 14:00~14:20 | OTHER | 셔틀 준비 | sakan | — |
| `d3-shuttle` | 14:30~15:15 | SHUTTLE | 사칸 → 센다이역 | sakan,sendai-station | — |
| `d3-train-transfer` | 15:15~15:35 | OTHER | 신칸센 이동 | sendai-station | — |
| `d3-shinkansen-return` | 15:44~17:42 | TRAIN | 센다이 → 우에노 | sendai-station,ueno-station | 사용자 계획값 · 열차명·호수·좌석은 미확정 |
| `d3-hotel-transfer` | 17:42~18:00 | TRANSIT | 호텔 이동 | ueno-station,apa-ueno | — |
| `d3-hotel-checkin` | 18:00~18:20 | HOTEL | 체크인 | apa-ueno | — |
| `d3-ark-transfer` | 18:50~19:30 | TRANSIT | 아크 힐즈 이동 | apa-ueno,ark-hills | — |
| `d3-dinner` | 19:30~20:30 | MEAL | 츠지한 아크 힐즈점 | tsujihan-ark | — |
| `d3-lights` | 20:50~22:00 | ATTRACTION | 롯폰기·게야키자카 | roppongi-hills,keyakizaka | 2026 개최·점등 종료시간 확인 |
| `d3-hotel-return` | 22:00~22:40 | TRANSIT | 호텔 복귀 | roppongi-hills,apa-ueno | — |

### 4일차 · 2026-12-25 · 늦은 시작 → 아메요코 → 우나토토 → 시부야 → 니혼바시 → 마루노우치

숙소: APA Hotel Ueno Ekikita

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d4-wakeup` | 08:30 | OTHER | 기상 | apa-ueno | — |
| `d4-ready` | 08:30~09:00 | OTHER | 준비 | apa-ueno | — |
| `d4-breakfast` | 09:00~10:00 | MEAL | KOMEDA'S Coffee 아침 | — | 방문 지점 미정 · 09:00 방문 가능 여부 확인 |
| `d4-ameyoko-transfer` | 10:00~10:25 | TRANSIT | 아메요코 이동·주변 산책 | ameyoko | — |
| `d5-ameyoko` | 10:30~11:30 | SHOPPING | 아메요코 상점가 | ameyoko | — |
| `d5-meal-transfer` | 11:30~11:40 | TRANSIT | 우나토토 이동 | ameyoko,unatoto-ueno | — |
| `d5-lunch` | 11:40~12:40 | MEAL | 나다이 우나토토 우에노점 | unatoto-ueno | — |
| `d4-shibuya-transfer` | 12:40~13:20 | TRANSIT | 우에노 → 시부야 | ueno-station,shibuya | — |
| `d4-shopping` | 13:20~17:00 | SHOPPING | 시부야 쇼핑 | shibuya,shibuya-parco | PARCO · SOU・SOU · GU · 유니클로 등. PARCO 외 정확한 지점은 미정 |
| `d4-scramble` | 17:00~17:30 | ATTRACTION | 하치코·스크램블 교차로 | hachiko,scramble | — |
| `d4-nihonbashi-transfer` | 17:30~18:10 | TRANSIT | 니혼바시 이동 | shibuya,nihonbashi | — |
| `d4-dinner` | 18:10~19:10 | MEAL | 니혼바시 돈카츠 하지메 | hajime | — |
| `d4-marunouchi-transfer` | 19:10~19:30 | TRANSIT | 마루노우치 이동 | nihonbashi,marunouchi | — |
| `d4-lights` | 19:30~21:00 | ATTRACTION | 도쿄역·마루노우치 야경·크리스마스 분위기 | tokyo-station,marunouchi | 2026 행사·점등시간 별도 확인 |
| `d4-hotel-return` | 21:00~21:30 | TRANSIT | 호텔 복귀 | marunouchi,apa-ueno | — |

### 5일차 · 2026-12-26 · 도쿄역 → 고쿄 → 유라쿠초 → 시바공원·도쿄타워 → 오다이바

숙소: APA Hotel Ueno Ekikita

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d5-breakfast` | 07:00~07:40 | MEAL | 숙소/편의점에서 간단한 아침 | — | — |
| `d5-ready` | 07:40~08:00 | OTHER | 준비 | apa-ueno | — |
| `d5-tokyo-transfer` | 08:00~08:20 | TRAIN | 우에노 → 도쿄역 | ueno-station,tokyo-station | — |
| `d5-tokyo-walk` | 08:20~09:00 | WALK | 도쿄역 마루노우치 주변 산책 | tokyo-station,marunouchi | — |
| `d6-kokyo-transfer` | 09:00~09:15 | TRANSIT | 고쿄 외원 이동 | tokyo-station,kokyo | — |
| `d6-kokyo` | 09:15~10:15 | ATTRACTION | 고쿄 외원·니주바시 | kokyo,nijubashi | — |
| `d5-yurakucho-transfer` | 10:15~10:30 | TRANSIT | 유라쿠초 방향 이동 | kokyo,yurakucho | — |
| `d5-sushiro-entry` | 10:30~10:45 | OTHER | 식당 이동·입장 | sushiro-yurakucho | — |
| `d5-sushiro-lunch` | 10:45~11:45 | MEAL | 스시로 aune 유라쿠초점 | sushiro-yurakucho | 〒100-0006 東京都千代田区有楽町2丁目3-5 aune有楽町 2階 · 첨부문서의 토요일 10:30 영업 안내는 12/26 방문 전 재확인 |
| `d5-shiba-transfer` | 11:45~12:15 | TRANSIT | 유라쿠초 → 시바공원 이동 | yurakucho,shiba-park | — |
| `d5-shiba-walk` | 12:15~13:15 | WALK | 시바공원 산책 | shiba-park | — |
| `d5-tower-transfer` | 13:15~13:30 | TRANSIT | 도쿄타워 이동 | shiba-park,tokyo-tower | — |
| `d4-tower` | 13:30~15:00 | ATTRACTION | 도쿄타워 관광 | tokyo-tower | — |
| `d5-bay-transfer` | 15:00~15:20 | TRANSIT | 도쿄타워 → 신바시/다케시바 방향 이동 | tokyo-tower | 신바시/다케시바 방향 중 실제 경로 미정 · 임의 승차장 핀 없음 |
| `d5-odaiba-transfer` | 15:20~16:00 | TRANSIT | 오다이바 이동 | odaiba | 실제 노선·승차장 미정 · 출발지를 임의 지정하지 않음 |
| `d5-odaiba` | 16:00~18:00 | ATTRACTION | 오다이바 관광 | odaiba | — |
| `d5-nightview` | 17:00 전후 | ATTRACTION | 도쿄만 일몰 감상 | odaiba | 오다이바 관광 중 포함된 감상 계획 · 17:00은 사용자 계획값이며 실제 일몰 시각 아님 |
| `d5-ueno-return` | 18:00~18:50 | TRANSIT | 오다이바 → 우에노 | odaiba,ueno-station | — |
| `d5-dinner` | 19:00~20:15 | MEAL | 츠키시마 몬자 모헤지 우에노점 | moheji-ueno | — |
| `d5-shopping` | 20:15~21:30 | SHOPPING | 돈키호테·기념품 쇼핑 | — | 돈키호테 방문 지점 미정 |
| `d5-hotel-return` | 21:30~21:50 | TRANSIT | 호텔 복귀 | apa-ueno | 출발 쇼핑점 미정 · 숙소 목적지만 연결 |
| `d5-packing` | 21:50~22:30 | OTHER | 짐 정리·귀국 준비 | apa-ueno | — |

### 6일차 · 2026-12-27 · 우에노 공원 → Skyliner → 나리타 T2 → 대구

숙소: 귀국 · 숙박 없음

| 일정 키 | 시간 | 종류 | 일정 | 연결 장소 키 | 확인·비고 |
|---|---|---|---|---|---|
| `d6-breakfast` | 06:45~07:15 | MEAL | 기상·간단한 아침 | — | — |
| `d6-packing` | 07:15~07:40 | OTHER | 짐 최종 정리 | apa-ueno | — |
| `d6-checkout` | 07:40~07:55 | HOTEL | 체크아웃·호텔에 짐 보관 | apa-ueno | — |
| `d5-park-transfer` | 07:55~08:10 | TRANSIT | 우에노 공원 이동 | apa-ueno,ueno-park | — |
| `d5-park` | 08:10~09:20 | ATTRACTION | 우에노 공원 산책 | ueno-park | — |
| `d6-hotel-return` | 09:20~09:35 | TRANSIT | 호텔 복귀 | ueno-park,apa-ueno | — |
| `d6-hotel-luggage` | 09:35~09:45 | OTHER | 캐리어 수령 | apa-ueno | — |
| `d6-keisei-transfer` | 09:45~10:00 | TRANSIT | 게이세이 우에노역 이동 | apa-ueno,keisei-ueno | — |
| `d6-skyliner-platform` | 10:00~10:25 | OTHER | 스카이라이너 승차 준비 | keisei-ueno | — |
| `d6-skyliner-return` | 10:37~11:25 | TRAIN | 게이세이 우에노 → 나리타공항 제2터미널 | keisei-ueno,narita-t2 | 사용자 계획 10:37~11:25 · 나리타 T2 도착 및 실제 운행 재확인 |
| `d6-departure-floor` | 11:25~11:40 | OTHER | 출국층 이동 | narita-t2 | — |
| `d6-checkin-flight` | 11:40~12:20 | OTHER | 체크인·수하물 위탁 | narita-t2 | — |
| `d6-lunch` | 12:20~12:45 | MEAL | 간단한 점심 | — | — |
| `d6-security` | 12:45~13:25 | OTHER | 출국심사·면세점 | narita-t2 | — |
| `d6-gate` | 13:25~14:00 | OTHER | 탑승구 이동·대기 | narita-t2 | — |
| `d6-flight-return` | 14:20~16:50 | FLIGHT | 나리타 → 대구 | narita-t2,daegu-airport | T2는 사용자 지정 계획 · 항공사·편명·실제 터미널 확인 |
| `d6-arrival` | 16:50~ | OTHER | 귀국 | daegu-airport | — |

## 5. 일정별 준비물과 할 일

준비 제안이며 예약 완료를 뜻하지 않는다. 물건은 준비물, 행동은 할 일로 구분한다.

| 일정 키 | 준비물 | 할 일 |
|---|---|---|
| `d1-yoshinoya` | — | 식사 날짜 또는 장소 확정 전 실행 일정으로 안내하지 않기 |
| `d1-arrive-airport` | 공통 준비물 | 해당 일정 내용 확인 |
| `d1-checkin-flight` | 여권·항공권 | 출국 수속·위탁 수하물 처리 |
| `d1-flight-out` | 여권·탑승권·휴대 수하물 | 항공편·터미널·탑승 마감·수하물 확인 |
| `d1-immigration` | 여권·입국 관련 자료 | 수하물 수령·통신 작동·JR 이동 확인 |
| `d1-skyliner-platform` | Skyliner 자료·캐리어 | 이용일 운행·터미널·승강장·차량·좌석 확인 |
| `d1-skyliner-out` | Skyliner 자료·캐리어 | 이용일 운행·터미널·승강장·차량·좌석 확인 |
| `d1-jr-ueno-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d1-shinkansen-platform` | 신칸센 자료·캐리어 | 열차명·출발시각·승강장·차량·좌석 확인 |
| `d1-shinkansen-out` | 신칸센 자료·캐리어 | 열차명·출발시각·승강장·차량·좌석 확인 |
| `d1-hotel-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d1-hotel-checkin` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d1-meal-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d1-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d1-lights-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d1-pageant` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d1-walk` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d1-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-breakfast` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d2-checkout` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d2-station-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-train-aquarium` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d2-walk-aquarium` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-entry` | 공통 준비물 | 해당 일정 내용 확인 |
| `d2-aquarium` | 수족관 티켓·휴대전화 | 입장권 종류·공연시간·13:00 퇴장 확인 |
| `d2-walk-station` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-train-sendai` | 교통카드 또는 해당 열차 티켓 | 출발시각·승강장·방향 확인 |
| `d2-lunch` | 결제수단 | 입장 시 14:35 식사 종료 가능 여부 확인 |
| `d2-hotel-transfer` | 휴대전화·짐 보관증 | 호텔에서 짐 전부 수령 후 셔틀 승차장 이동 |
| `d2-shuttle-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d2-shuttle-wait` | 셔틀 확인자료 | 두 명 탑승 장소 도착·예약자 확인 |
| `d2-shuttle` | 셔틀 확인자료·캐리어 | 예약 인원·탑승 위치·출발시각 확인 |
| `d2-hotel-checkin` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d2-walk` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d2-onsen` | 공통 준비물 | 해당 일정 내용 확인 |
| `d2-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d2-rest` | — | — |
| `d3-breakfast` | 결제수단 | 지정 지점·대기시간 확인 |
| `d3-packing` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-checkout` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d3-sato-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-bus-falls` | 교통카드 또는 현금·시각표 | 정류장·방향·복귀편 확인 |
| `d3-falls` | 미끄럽지 않은 신발·장갑·시각표 | 10:23 버스 전 정류장 복귀; 결빙 시 관람 범위 축소 |
| `d3-bus-return` | 교통카드 또는 현금·시각표 | 정류장·방향·복귀편 확인 |
| `d3-sato-arrival` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-rairaikyo` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d3-lunch` | 결제수단 | 아키우 본점 여부·영업 여부·셔틀 전 복귀 확인 |
| `d3-village` | 방한용품·편한 신발 | 복귀 시각·길 상태 확인 |
| `d3-sakan-transfer` | 휴대전화·짐 보관증 | 사칸에서 짐 전부 수령 후 셔틀 준비 |
| `d3-shuttle-wait` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-shuttle` | 셔틀 확인자료·캐리어 | 예약 인원·탑승 위치·출발시각 확인 |
| `d3-train-transfer` | 공통 준비물 | 해당 일정 내용 확인 |
| `d3-shinkansen-return` | 신칸센 자료·캐리어 | 열차명·출발시각·승강장·차량·좌석 확인 |
| `d3-hotel-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d3-hotel-checkin` | 여권·APA 우에노역북 3박 예약자료 | 호텔 지점명·숙박일·인원 확인 |
| `d3-ark-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d3-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d3-lights` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d3-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-wakeup` | 공통 준비물 | 해당 일정 내용 확인 |
| `d4-ready` | 공통 준비물 | 해당 일정 내용 확인 |
| `d4-breakfast` | 결제수단 | 코메다 방문 지점·09:00 영업 확인 |
| `d4-ameyoko-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d5-ameyoko` | 결제수단·장바구니·필요시 여권 | 구매 목록·다음 일정 확인 |
| `d5-meal-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-lunch` | 결제수단 | 지정 지점·대기시간 확인 |
| `d4-shibuya-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-shopping` | 결제수단·장바구니·필요시 여권 | 구매 목록·다음 일정 확인 |
| `d4-scramble` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d4-nihonbashi-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d4-marunouchi-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d4-lights` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d4-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-breakfast` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d5-ready` | 공통 준비물 | 해당 일정 내용 확인 |
| `d5-tokyo-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d5-tokyo-walk` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d6-kokyo-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d6-kokyo` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d5-yurakucho-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d5-sushiro-entry` | 공통 준비물 | 해당 일정 내용 확인 |
| `d5-sushiro-lunch` | 결제수단 | 지정 지점·영업·대기시간 확인 |
| `d5-shiba-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d5-shiba-walk` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d5-tower-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d4-tower` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d5-bay-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d5-odaiba-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d5-odaiba` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d5-nightview` | 휴대전화·방한용품 | 실제 일몰 시각·기상 확인 |
| `d5-ueno-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-dinner` | 결제수단 | 지정 지점·대기시간 확인 |
| `d5-shopping` | 결제수단·장바구니·필요시 여권 | 구매 목록·다음 일정 확인 |
| `d5-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-packing` | 캐리어·충전기·귀국 항공 및 Skyliner 자료 | 객실 물품·수하물 규정·다음날 터미널 확인 |
| `d6-breakfast` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d6-packing` | 공통 준비물 | 해당 일정 내용 확인 |
| `d6-checkout` | 여권·숙소 예약자료·캐리어 | 체크인/아웃 및 짐 보관 확인 |
| `d5-park-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·도착 예상시각 확인 |
| `d5-park` | 휴대전화·방한용품 | 관람 범위·운영시간·다음 이동 확인 |
| `d6-hotel-return` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d6-hotel-luggage` | 짐 보관증·캐리어 | 호텔 보관 짐 전부 수령 |
| `d6-keisei-transfer` | 휴대전화·필요시 교통카드 | 목적지·이동수단·출발시각 확인 |
| `d6-skyliner-platform` | Skyliner 자료·캐리어 | 이용일 운행·터미널·승강장·차량·좌석 확인 |
| `d6-skyliner-return` | Skyliner 자료·캐리어 | 이용일 운행·터미널·승강장·차량·좌석 확인 |
| `d6-departure-floor` | 공통 준비물 | 해당 일정 내용 확인 |
| `d6-checkin-flight` | 공통 준비물 | 해당 일정 내용 확인 |
| `d6-lunch` | 결제수단 | 다음 일정 전 간단히 식사 |
| `d6-security` | 여권·탑승권 | 보안검색·출국심사 완료 후 게이트 확인 |
| `d6-gate` | 여권·탑승권·기내 수하물 | 탑승 마감 전 게이트 도착 |
| `d6-flight-return` | 여권·탑승권·휴대 수하물 | 항공편·터미널·탑승 마감·수하물 확인 |
| `d6-arrival` | 공통 준비물 | 해당 일정 내용 확인 |

## 6. 여행 전 체크리스트와 공통 준비물

PRE_TRIP은 여행 전체에서 1회 완료하는 할 일이다. 기한 입력은 사용하지 않는다. 확인 시점 안내는 메모이며 예약 오픈일을 의미하지 않는다. 담당자는 SHARED가 기본이며 실제 분담은 두 사용자가 설정한다.

| item_key | 확인 시점 메모 | 할 일 |
|---|---|---|
| pre-passport | 필요 시 확인 | 여권·필요한 입국 서류 확인 |
| pre-flights | 필요 시 확인 | 왕복 항공권·편명·실제 터미널·수하물 조건 확인 |
| pre-hotels | 필요 시 확인 | 세 숙소 예약일·인원·조식/석식 포함 여부 확인 |
| pre-shuttles | 필요 시 확인 | 사칸 왕복 셔틀 예약 절차·운행·승차장 확인 |
| pre-trains | 필요 시 확인 | Skyliner·우에노↔센다이 신칸센 이용일 운행과 판매/예약 가능 시점 확인 |
| pre-food | 필요 시 확인 | 코메다 지점, 요시노야 일정 충돌, 각 식당 지점·영업 확인 |
| pre-aquarium | 필요 시 확인 | 수족관 12/23 영업·티켓·공연·역에서 접근 확인 |
| pre-akiu | 필요 시 확인 | 폭포 왕복 버스·관람 동선·카이치 점심 이동 확인 |
| pre-events | 필요 시 확인 | 센다이·롯폰기·마루노우치 행사 개최/운영 확인 |
| pre-network | 필요 시 확인 | 통신 수단 준비 및 설치 안내 저장 |
| pre-payment | 필요 시 확인 | 해외결제 수단·교통카드·현금 준비 |
| pre-insurance | 필요 시 확인 | 보험 필요사항 결정·가입 시 증권/연락처 저장 |
| pre-documents | 필요 시 확인 | 예약 텍스트·필요한 파일을 일정에 연결 |
| pre-test | 필요 시 확인 | 두 계정 로그인·지도 링크·예약 파일 열림 확인 |
| pre-download | 필요 시 확인 | 필요한 티켓·예약자료를 휴대전화에 별도 다운로드 |
| pre-weather | 필요 시 확인 | 기상·교통 운행·관람 가능 여부 확인 |
| pre-luggage | 필요 시 확인 | 항공사 안내에 따라 짐·배터리·액체류 분류 |
| pre-conflicts | 필요 시 확인 | 미확정 항목과 이동 연결 최종 확인 |

공통 준비물 정의:

| item_key | 준비물 | 담당/상태 기준 | 적용 |
|---|---|---|---|
| pack-passport | 여권 | 개인별 | 출입국·숙박·필요시 구매 |
| pack-phone | 휴대전화 | 개인별, 일별 | 여행 전일 |
| pack-wallet | 결제카드·현금 | 개인별, 일별 | 여행 전일 |
| pack-ic | 교통 IC카드 또는 사용 수단 | 개인별, 일별 | 대중교통 |
| pack-battery | 보조배터리 | 개인 또는 공동 지정, 일별 | 여행 전일 |
| pack-cable | 충전기·케이블·필요한 어댑터 | 개인 또는 공동 지정 | 짐 싸기·숙소 이동 |
| pack-coat | 외투·장갑·목도리 | 개인별, 일별 | 야외 일정 |
| pack-shoes | 편한 신발·필요시 미끄럼 대응 | 개인별 | 산책·폭포 |
| pack-umbrella | 우산 | 개인 또는 공동, 날씨 조건 | 필요한 날짜 |
| pack-medicine | 개인 복용약·개인용품 | 개인별 | 필요한 날짜 |
| pack-bag | 작은 가방·장바구니 | 개인 또는 공동 | 외출·쇼핑 |
| pack-luggage | 캐리어·보관증 | 개인별 | 숙소 이동·호텔 짐 보관 |

‘오늘’은 공통 일별 준비물 + 해당 날짜 모든 일정의 준비물/할 일을 합산한다. PRE_TRIP은 별도 영역에 표시하고 모든 날짜에 반복 복제하지 않는다. 요시노야 미확정 항목은 출발 전 확인 과제로 안내하며 당일 실행 체크리스트와 구분한다.

## 7. 예약·첨부 연결표

자료 입력 슬롯이며 실제 예약은 아니다. 지정되지 않은 열차명·호수·좌석은 입력하지 않는다. 옛 N’EX·Hayabusa 예약은 새 열차로 자동 옮기지 않는다.

| reservation_key | 대상 | 연결 schedule_key | 자료 |
|---|---|---|---|
| res-flight-out | 출국 항공 | d1-checkin-flight, d1-flight-out | 항공사·편명·예약자료 |
| res-flight-return | 귀국 항공 | d6-checkin-flight, d6-security, d6-gate, d6-flight-return | 항공사·편명·실제 터미널 |
| res-hotel-sendai | APA 센다이 | d1-hotel-checkin, d2-checkout, d2-hotel-transfer | 숙박·짐 보관 안내 |
| res-hotel-sakan | 사칸 | d2-hotel-checkin, d2-dinner, d3-breakfast, d3-checkout, d3-sakan-transfer | 숙박·식사·짐 보관 안내 |
| res-hotel-ueno | APA 우에노역북 3박 | d3-hotel-checkin, d6-checkout, d6-hotel-luggage | 숙박·짐 보관 안내 |
| res-skyliner-out | Skyliner 나리타 → 게이세이 우에노 | d1-skyliner-platform, d1-skyliner-out | 운행·차량·좌석·티켓 |
| res-shinkansen-out | 신칸센 우에노 → 센다이 | d1-shinkansen-platform, d1-shinkansen-out | 열차명·호수 미정 |
| res-shuttle-out | 사칸행 셔틀 | d2-shuttle-wait, d2-shuttle | 예약자·승차장·시간 |
| res-shuttle-return | 센다이행 셔틀 | d3-shuttle-wait, d3-shuttle | 예약자·승차장·시간 |
| res-shinkansen-return | 신칸센 센다이 → 우에노 | d3-train-transfer, d3-shinkansen-return | 열차명·호수 미정 |
| res-skyliner-return | Skyliner 게이세이 우에노 → 나리타 T2 | d6-skyliner-platform, d6-skyliner-return | 운행·터미널·차량·좌석 |
| res-aquarium | 수족관 | d2-entry, d2-aquarium | 구매 시 입장 안내 |

## 8. 개발 반영 계약

1. plan_version은 2026-10-10-r4. plan.md만 여행 데이터 원본으로 편집한다.
2. `node scripts/import-plan.mjs`는 명시적 표·안정 키로 seed와 008 migration을 생성한다. 적용한 001~007은 덮어쓰지 않는다.
3. 일정 날짜·순서·본문은 계획 소유 필드. 기존 예약·첨부·준비물 이름/담당자/메모·체크 상태는 보존한다.
4. 날짜가 옮겨진 일정의 준비물/할 일 날짜도 맞춘다. 사용자가 수정한 본문은 덮어쓰지 않고, 기존 seed 문구와 같은 경우에만 새 준비 안내로 갱신한다.
5. 제거된 일정·장소·옛 열차 자료는 보관하고 활성 화면에서 제외한다. 참조 자료를 cascade 삭제하지 않는다.
6. 시간 없는 요시노야는 현재/다음 자동 판정에서 제외한다. 시간 없는 이동을 만들어 빈 구간을 채우지 않는다.
7. 같은 버전 재적용에서 중복·체크 초기화·삭제한 예약 슬롯 재생성이 없어야 한다.
8. 운영 DB를 자동 변경하거나 자동 배포하지 않는다. 검토 가능한 migration과 실행 검증 기록을 남긴다.

## 9. 확인 근거와 검증 기준

출처는 2026-10-10 사용자가 첨부한 전체 일정이다. 링크에 대한 문구는 첨부 내용이며 이 작업에서 운영시간을 실시간 검증한 것으로 보지 않는다.

- 스시로 aune 유라쿠초점: https://www.akindo-sushiro.co.jp/shop/detail.php?id=2785
- 고쿄 외원 안내(사용자 첨부): https://sankan.kunaicho.go.jp/english/guide/koukyo.html
- 4일차 아메요코 10:30~11:30, 우나토토 11:40~12:40, 시부야 쇼핑 13:20~17:00.
- 5일차 고쿄 09:15~10:15, 스시로 유라쿠초 10:45~11:45, 시바공원·도쿄타워, 오다이바 16:00~18:00.
- 6일차 우에노 공원 08:10~09:20, 호텔 짐 수령 후 Skyliner 10:37~11:25 및 나리타 T2.
- 1일차 Skyliner 14:42~15:23·우에노→센다이 16:06~18:06, 3일차 센다이→우에노 15:44~17:42.
- 전체 6일의 113개 시간 행과 장소·준비물·예약 연결이 앱에서 동일해야 한다. 미정 지점·호수를 만들지 않는다.
