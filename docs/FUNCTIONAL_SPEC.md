# 커플 일본 여행 플래너 웹앱 기능 명세서

## 1. 프로젝트 목표

연인 2명이 함께 일본 여행을 준비하고 현지에서도 사용할 수 있는 모바일 우선 웹앱을 구축한다.

이 앱 하나에서 다음을 모두 확인하고 관리할 수 있어야 한다.

- 로그인
- 여행 전체 일정
- 오늘 일정
- 장소 및 지도
- 이동수단 / 예상시간 / 교통비
- 후보 식당
- Google Maps 길찾기
- 여행 전 준비물
- 날짜별 준비물
- 일정별 준비물
- 체크리스트
- 항공 / 숙소 / 열차 / 셔틀 / 보험 등 예약정보
- 예약번호 / 예약 사이트 / 확인 링크 / 메모 / 첨부
- 예상 예산
- 실제 지출
- 2인 공동 정산
- 쇼핑 목록
- 긴급정보
- 여행 종료 후 회고

---

# 2. 사용자 / 로그인 정책

## 2.1 사용자 수

이 서비스는 현재 2명만 사용한다.

회원가입 기능을 제공하지 않는다.

공개 사용자 생성 기능도 제공하지 않는다.

관리자 화면에서 사용자를 생성하는 기능도 MVP에는 필요 없다.

## 2.2 로그인 방식

사전에 생성한 정확히 2개의 계정만 로그인할 수 있다.

로그인 화면 입력값:

- 아이디
- 비밀번호

예:

```text
아이디
[            ]

비밀번호
[            ]

[로그인]
```

### 구현 권장안

Supabase Auth를 사용하되 실제 UI에서는 `아이디 + 비밀번호` 형태로 제공한다.

방법 예:

- DB의 profile에 `username` 저장
- 서버에서 username을 인증용 email 또는 내부 auth user와 매핑
- 사용자는 email 주소를 알 필요 없음
- 두 계정은 개발/배포 시 미리 생성

또는 프로젝트 규모상 안전하게 구현 가능한 경우 별도 credential 테이블 + 서버 인증을 사용할 수 있으나, 평문 비밀번호 저장은 금지한다.

### 반드시 지킬 것

- 회원가입 페이지 없음
- 비밀번호 평문 저장 금지
- 클라이언트에 비밀번호 하드코딩 금지
- 로그인 실패 시 어떤 아이디가 존재하는지 노출하지 않음
- 인증되지 않은 사용자는 여행 데이터 접근 불가

### 선택 기능

- 로그아웃
- 로그인 유지
- 비밀번호 변경: MVP에서는 선택. 필요하지 않다면 비활성화 가능.

---

# 3. 권장 기술 스택

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Google Maps JavaScript API
- Google Places API (New)
- Google Maps URLs
- Vercel
- PWA 지원

---

# 4. 메인 네비게이션

모바일 하단 탭:

1. 오늘
2. 일정
3. 지도
4. 장소
5. 더보기

`더보기`:

- 준비물
- 예약
- 예산
- 지출/정산
- 쇼핑
- 긴급정보
- 여행정보
- 설정

---

# 5. 오늘 화면

현지에서 가장 자주 쓰는 화면이다.

표시:

- 날짜
- Day N
- 현재/다음 일정
- 다음 일정까지 남은 시간
- 다음 이동 카드
- 오늘 필요한 준비물
- 미완료 체크리스트
- 오늘 사용할 예약
- 오늘 예상 교통비
- 오늘 예상 총비용
- 오늘 실제 지출
- 오늘 식사 일정
- 후보 식당
- 오늘 숙소
- 날씨는 추후 기능

빠른 버튼:

- Google Maps
- 준비물
- 예약정보
- 후보식당
- 지출 추가

---

# 6. 일정 기능

## 일정 타입

- FLIGHT
- TRAIN
- TRANSIT
- HOTEL
- ATTRACTION
- MEAL
- SHOPPING
- WALK
- FREE_TIME
- OTHER

필드:

```text
id
trip_id
date
type
title
start_time
end_time
place_id
description
status
sort_order
is_fixed
reservation_id
estimated_cost_yen
note
```

status:

- planned
- confirmed
- completed
- skipped

## 일정 상세 화면

- 시간
- 장소
- 설명
- 지도
- 준비물
- 체크리스트
- 예약정보
- 이동정보
- 예상비용
- 사용자 메모
- Google Maps 버튼

---

# 7. 이동 기능

Transport Segment:

```text
id
trip_id
date
origin_place_id
destination_place_id
departure_time
arrival_time
transport_type
route_name
operator
boarding_point
alighting_point
estimated_duration_minutes
estimated_cost_yen
reservation_required
reservation_id
ticket_note
preparation_note
google_maps_url
is_fixed
```

transport_type:

- WALK
- TRAIN
- SUBWAY
- BUS
- SHINKANSEN
- AIRPORT_EXPRESS
- FLIGHT
- SHUTTLE
- TAXI
- OTHER

## 표시 예

```text
🚄 Hayabusa 26

센다이역 → 도쿄역
15:57 → 17:32

약 1시간 35분
약 ¥11,000~11,500 / 1인

지정석
예약 확인 필요

[예약정보]
[Google Maps]
```

---

# 8. Google Places / 장소

## Place 저장

DB에는 최소한 다음을 저장:

```text
id
trip_id
google_place_id
custom_name
category
memo
created_by
created_at
```

Google에서 필요 시 조회:

- 이름
- 주소
- 좌표
- 평점
- 리뷰 수
- 가격 수준
- 가격 범위
- 영업시간
- 사진
- 전화번호
- 홈페이지

## 장소 카테고리

- RESTAURANT
- CAFE
- ATTRACTION
- HOTEL
- SHOPPING
- STATION
- AIRPORT
- OTHER

---

# 9. 후보 식당

후보 식당은 사용자가 직접 추가한다.

앱 자체 자동 추천은 MVP 요구사항이 아니다.

흐름:

1. 후보 식당 추가
2. 이름 검색
3. Google Places 결과 표시
4. 정확한 지점 선택
5. Google Place ID 저장
6. 장소정보 자동 표시
7. 태그 / 메모 / 우선순위 설정
8. 식사 일정에 연결

직접 저장:

- memo
- priority
- tags
- favorite
- meal_schedule_id optional

Google 표시:

- 이름
- 주소
- 평점
- 리뷰 수
- 가격대
- 영업시간
- 사진
- 전화번호
- 웹사이트

메뉴 전체와 개별 메뉴 가격은 항상 제공된다고 가정하지 않는다.

---

# 10. 준비물 시스템

준비물은 3단계로 구분한다.

## 10.1 여행 전체 준비물

출국 전 한 번 준비하는 항목.

예:

- 여권
- eSIM
- 보험
- 신용카드
- 현금
- 보조배터리
- 겨울 의류

## 10.2 날짜별 준비물

특정 날짜에 필요한 준비물.

예:

12/25:
- 면세 쇼핑용 여권
- 쇼핑 목록
- 보조배터리

## 10.3 일정별 준비물

특정 일정에 연결.

예:

아키우 대폭포:
- 방한복
- 장갑
- 미끄럽지 않은 신발
- IC카드/현금

## Packing Item 필드

```text
id
trip_id
date nullable
schedule_item_id nullable
label
category
owner
checked
required
note
sort_order
```

owner:

- USER_A
- USER_B
- SHARED

category 예:

- DOCUMENT
- MONEY
- ELECTRONICS
- CLOTHING
- HEALTH
- TRANSPORT
- RESERVATION
- SHOPPING
- OTHER

---

# 11. 체크리스트

준비물과 별개로 행동 확인용 체크리스트를 제공한다.

예:

- 사칸 셔틀 예약하기
- Hayabusa 좌석 확인
- 아키우 버스 시간 캡처
- 호텔 객실 물건 확인
- 마지막 날 수하물 무게 확인

필드:

```text
id
trip_id
date nullable
schedule_item_id nullable
title
description
owner
status
due_at nullable
priority
```

status:

- TODO
- DONE

---

# 12. 예약 시스템

가장 중요한 기능 중 하나.

지원 유형:

- FLIGHT
- HOTEL
- TRAIN
- BUS
- SHUTTLE
- ATTRACTION
- RESTAURANT
- INSURANCE
- OTHER

## 예약 필드

```text
id
trip_id
type
title
provider
reservation_number
booker_name
start_at
end_at
website_url
booking_url
confirmation_url
contact_phone
contact_email
status
note
created_by
```

status:

- PLANNED
- BOOKED
- CONFIRMED
- USED
- CANCELLED

## 사용자가 직접 입력 가능한 것

- 예약번호
- 예약자명
- 예약 사이트 이름
- 예약 사이트 URL
- 예약 상세 링크
- 확인 페이지 링크
- 전화번호
- 이메일
- 좌석번호
- 차량번호
- 항공편 번호
- 객실정보
- 티켓 수령 방법
- QR 관련 메모
- 자유 메모

## 첨부파일

Supabase Storage 사용.

허용 예:

- 예약 확인 PDF
- QR 이미지
- 항공권 캡처
- 호텔 확인서 이미지
- 여행자보험 증권
- 열차 예약 캡처

Reservation Attachment:

```text
id
reservation_id
file_name
storage_path
mime_type
created_at
```

민감한 자료이므로 인증 사용자만 접근 가능.

---

# 13. 예약 허브 화면

날짜순 / 유형별로 예약을 확인한다.

예:

```text
12/22
✈️ 대구 → 나리타
예약번호: ******
[예약 사이트]
[확인서 보기]

🚄 Hayabusa 33
16:20 → 17:51
5호차 8A / 8B
[예약 정보]

🏨 APA 호텔
예약번호: ******
체크인 18:00 전후
[호텔 정보]
```

빠른 복사:

- 예약번호
- 전화번호

단, 보안상 민감정보 노출 방식은 주의한다.

---

# 14. 예약정보와 일정 연결

하나의 예약은 여러 일정과 연결될 수 있다.

예:

항공 예약 하나가:
- 공항 체크인 일정
- 항공편 일정

에 연결될 수 있다.

junction table 권장:

```text
reservation_schedule_items
reservation_id
schedule_item_id
```

---

# 15. 예산

카테고리:

- 항공
- 숙박
- 교통
- 음식
- 관광
- 쇼핑
- 보험
- 기타

예상비용과 실제비용을 분리한다.

```text
budget_items
id
trip_id
category
title
estimated_amount_yen
actual_amount_yen nullable
note
```

---

# 16. 지출 / 공동 정산

Expense:

```text
id
trip_id
date
category
title
amount
currency
payer_user_id
note
place_id nullable
created_at
```

split 방식:

- 50/50
- USER_A_ONLY
- USER_B_ONLY
- CUSTOM

최종 화면:

- 각자 결제 총액
- 각자 부담해야 할 금액
- 상대에게 보내야 할 금액

---

# 17. 쇼핑 목록

별도 기능 제공.

필드:

```text
id
trip_id
name
category
target_place_id nullable
planned_budget_yen nullable
actual_cost_yen nullable
buyer
purchased
note
```

예:

- 일본 한정 상품
- 선물
- 돈키호테 구매품
- 시부야 쇼핑

---

# 18. 긴급정보

사용자 직접 입력.

항목:

- 한국 긴급연락처
- 일본 긴급연락처
- 여행자보험
- 카드사
- 항공사
- 호텔
- 대사관 / 영사관
- 여권 분실 대응 메모

필드:

```text
id
trip_id
category
title
phone
url
note
```

홈에서 `긴급정보` 버튼을 빠르게 접근 가능하게 한다.

---

# 19. 여행정보 화면

상시 참고용.

- 항공편
- 숙소
- 여행 기간
- 여행자 2명
- 기본 통화
- 시간대
- 보험
- 주요 예약상태
- 교통 패스 / IC카드 메모

---

# 20. 지도

## 전체 지도

저장한 장소 전체 표시.

## 날짜 필터

해당 날짜의 장소만 표시.

## 카테고리 필터

- 숙소
- 식당
- 관광
- 쇼핑
- 교통

## 상세 카드

- 이름
- 사진
- 평점
- 영업시간
- 주소
- 메모
- 연결 일정
- Google Maps

---

# 21. Google Maps 길찾기

자체 내비게이션은 구현하지 않는다.

Google Maps URL 사용.

가능하면:

- origin
- destination
- travelmode

전달.

일정에 확정된 열차 / 버스 / 셔틀 시간이 있으면 그 값은 앱 데이터가 source of truth다.

Google 경로 결과가 확정 예약 시간을 자동으로 변경해서는 안 된다.

---

# 22. 홈 체크 요약

홈 상단에 다음 요약을 제공한다.

```text
오늘 해야 할 것 3
준비물 미완료 2
확인 필요한 예약 1
오늘 예상 교통비 ¥1,200
오늘 실제 지출 ¥0
```

---

# 23. 실시간 공동 편집

두 사용자 모두 수정 가능.

Realtime 적용:

- 일정
- 식당 후보
- 체크리스트
- 준비물
- 예약정보
- 예산
- 지출
- 쇼핑목록
- 메모

충돌이 발생할 수 있는 폼은 최신 데이터 갱신 또는 updated_at 비교를 고려한다.

---

# 24. DB 권장 구조

```text
profiles

trips
trip_members
trip_days

schedule_items
transport_segments

places
meal_candidates

packing_items
checklist_items

reservations
reservation_attachments
reservation_schedule_items

budget_items
expenses
expense_splits

shopping_items

emergency_contacts
notes
```

---

# 25. 권한 / RLS

현재 사용자 2명만 존재한다.

두 사용자 모두 여행 EDITOR 이상 권한.

모든 여행 데이터는 인증된 두 계정만 읽기/쓰기 가능.

Storage의 예약 첨부파일도 동일.

비로그인 접근:

- 로그인 화면 외 차단.

---

# 26. 초기 Seed

`TRIP_PLAN.md`에서 다음을 Seed 한다.

- 6일 전체 일정
- 이동구간
- 숙소
- 확정 관광지
- 우마미 타스케
- 예상 교통비
- 준비물
- 날짜별 체크리스트
- 예약정보 placeholder
- 예약 필요 플래그

예약번호나 실제 확인 링크는 사용자 제공 전에는 빈 값으로 둔다.

가짜 예약번호를 생성하지 않는다.

---

# 27. 검색 / 필터

검색 대상:

- 일정
- 장소
- 식당
- 예약
- 준비물
- 쇼핑

필터:

- 날짜
- 카테고리
- 완료 여부
- 예약 상태
- 담당자

---

# 28. 알림 성격 UI

외부 푸시 알림은 MVP 필수가 아니다.

대신 앱 내부에 중요 배지를 표시.

예:

- 예약 필요
- 시간표 재확인 필요
- 준비물 미완료
- 출발 임박
- 체크아웃 임박

---

# 29. 오프라인 / PWA

PWA 지원.

오프라인에서 최소한 다음은 확인 가능하도록 고려:

- 오늘 일정
- 숙소 이름 / 주소
- 예약번호
- 열차 정보
- 준비물
- 긴급연락처

Google 지도 / Places 최신정보는 온라인 필요.

민감 첨부파일의 오프라인 캐시는 기본적으로 피한다.

---

# 30. 보안

- 비밀번호 평문 저장 금지
- API 키 Git 커밋 금지
- Supabase Service Role Key 브라우저 노출 금지
- Google 브라우저 키 HTTP referrer 제한
- RLS 필수
- Storage 정책 필수
- 예약 첨부파일 public bucket 금지
- 사용자 입력 URL은 안전하게 처리
- 위험한 HTML 렌더링 금지

---

# 31. MVP 범위

## 인증

- [ ] 2개 사전 생성 계정
- [ ] 아이디/비밀번호 로그인
- [ ] 회원가입 없음
- [ ] 로그아웃

## 여행

- [ ] 여행 홈
- [ ] 오늘 화면
- [ ] 6일 일정 Seed
- [ ] 일정 상세
- [ ] 이동 카드

## Places

- [ ] Google Places 검색
- [ ] 장소 저장
- [ ] 상세정보
- [ ] 지도
- [ ] Google Maps 링크

## 식당

- [ ] 후보 식당 추가
- [ ] 식사 일정 연결
- [ ] 태그
- [ ] 메모
- [ ] 실제 방문 식당 선택

## 준비

- [ ] 여행 전체 준비물
- [ ] 날짜별 준비물
- [ ] 일정별 준비물
- [ ] 체크리스트
- [ ] 담당자
- [ ] 완료 처리

## 예약

- [ ] 예약 생성
- [ ] 예약번호
- [ ] 예약 사이트
- [ ] 확인 링크
- [ ] 좌석/객실/티켓 메모
- [ ] 일정 연결
- [ ] 첨부파일

## 비용

- [ ] 예산
- [ ] 실제 지출
- [ ] 결제자
- [ ] 2인 정산

## 기타

- [ ] 쇼핑목록
- [ ] 긴급정보
- [ ] 모바일 반응형
- [ ] Vercel 배포

---

# 32. 완료 조건

1. 사전 생성한 두 계정만 로그인할 수 있다.
2. 회원가입 경로가 없다.
3. 두 명 모두 같은 여행을 공동 편집할 수 있다.
4. 6일 전체 일정이 Seed 되어 있다.
5. 오늘 화면에서 당일 필요한 핵심 정보가 보인다.
6. 이동시간/방법/비용/승하차 위치를 확인할 수 있다.
7. Google Maps를 바로 열 수 있다.
8. 후보 식당을 Google Places에서 직접 추가할 수 있다.
9. 여행 전체/날짜별/일정별 준비물을 체크할 수 있다.
10. 행동 체크리스트를 관리할 수 있다.
11. 항공/호텔/열차/셔틀/보험 예약 정보를 저장할 수 있다.
12. 사용자가 예약번호와 링크를 직접 추가/수정할 수 있다.
13. 예약 확인 PDF/이미지를 첨부할 수 있다.
14. 예산과 실제 지출을 비교할 수 있다.
15. 두 사람 간 정산액이 계산된다.
16. 쇼핑목록을 사용할 수 있다.
17. 긴급정보를 빠르게 볼 수 있다.
18. 모바일에서 핵심 기능이 정상 작동한다.
19. RLS/Storage 권한이 적용된다.
20. Production build와 Vercel 배포가 성공한다.
