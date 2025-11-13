# 🏆 코테 챌린지 시스템

Slack과 Google Sheets를 활용한 자동화된 코딩 테스트 챌린지 관리 시스템입니다.

매일 코딩 테스트 문제를 풀고 PR을 제출하여 챌린지를 완수하세요! 자동 집계와 알림으로 동기부여를 제공합니다.

---

## ✨ 주요 기능

### 📝 챌린지 관리
- **참여 신청** - Slack 명령어로 간편하게 챌린지 참여
- **진행 현황 조회** - 참여 일차와 개인 통계 확인
- **자동 집계** - 매일 자정 자동으로 제출 여부 집계
- **수동 집계** - 관리자가 특정 날짜 집계 수동 실행 가능

### 🔗 제출 관리
- **PR 링크 제출** - GitHub PR 링크로 제출 (하루 1회)
- **제출 수정** - 당일 제출한 링크 수정 가능
- **중복 방지** - 같은 PR 링크 재사용 불가

### ⚠️ 경고 시스템
- **자동 경고** - 미제출 시 경고 1회 자동 누적
- **퇴출 알림** - 경고 2회 초과 시 관리자에게 자동 알림
- **통계 추적** - 성공/실패 횟수 및 경고 횟수 실시간 추적

### 🔔 Slack 알림
- **일일 요약** - 매일 자정 전체 결과 요약 전송
- **관리자 알림** - 퇴출 대상자 발생 시 관리자 채널 알림

---

## 🛠️ 기술 스택

- **Google Apps Script** - 서버리스 백엔드
- **Google Sheets** - 데이터 저장소
- **Slack API** - 슬래시 커맨드 및 Webhook 알림

---

## 📂 프로젝트 구조

```
loop-coding-test-script/
├── code/
│   ├── main.gs                    # 메인 진입점 (명령어 라우팅)
│   ├── utils.gs                   # 유틸리티 함수
│   ├── messages.gs                # 메시지 템플릿
│   ├── sheet.gs                   # Google Sheets 관리
│   ├── slack.gs                   # Slack Webhook 통신
│   ├── handler/                   # 명령어 핸들러
│   │   ├── registerHandler.gs           # 챌린지 참여
│   │   ├── checkChallengerHandler.gs    # 참여 확인
│   │   ├── challengeStatusHandler.gs    # 챌린지 현황
│   │   ├── submitHandler.gs             # 제출
│   │   ├── updateSubmitHandler.gs       # 제출 수정
│   │   ├── checkSubmitHandler.gs        # 제출 확인
│   │   └── manualAggregationHandler.gs  # 수동 집계
│   └── scheduler/                 # 스케줄러
│       └── dailyAggregationScheduler.gs # 일일 집계
├── docs/
│   ├── command/                   # 명령어 가이드
│   │   └── README.md
│   ├── guide/                     # 설정 가이드
│   │   └── README.md
│   ├── scheduler/                 # 스케줄러 가이드
│   │   └── README.md
│   └── properties/                # 속성 설정 참고
│       └── README.md
└── CLAUDE.md                      # AI 개발 가이드
```

---

## 🚀 빠른 시작

### 1. 필요한 것들

- Google 계정
- Slack 워크스페이스 관리자 권한
- Slack Webhook URL 2개 (일반 채널, 관리자 채널)

### 2. 설치 및 설정

상세한 설정 방법은 **[설정 가이드](docs/guide/README.md)** 를 참고하세요.

**간단 요약:**

1. **Google Sheets 생성** - 4개 시트 생성 (challengers, daily-challenge, challenger-stats, aggregation)
2. **Apps Script 프로젝트 생성** - 코드 파일들 복사
3. **스크립트 속성 설정** - Webhook URL 설정
4. **웹 앱 배포** - 배포 URL 확인
5. **Slack 슬래시 커맨드 설정** - 8개 명령어 등록
6. **스케줄러 트리거 설정** - 매일 자정 자동 실행

### 3. 사용 방법

명령어 사용 방법은 **[명령어 가이드](docs/command/README.md)** 를 참고하세요.

---

## 📱 Slack 명령어

### 챌린지 관리
- `/코테챌린지참여` - 챌린지 참여 신청
- `/코테챌린지참여확인` - 참여 여부 및 진행 일차 확인
- `/코테챌린지현황` - 개인 성공 횟수 및 경고 횟수 조회

### 제출 관리
- `/코테제출 [PR 링크]` - 코테 PR 링크 제출
- `/코테제출수정 [PR 링크]` - 당일 제출한 링크 수정
- `/코테제출확인` - 오늘 제출 이력 확인

### 관리자 기능
- `/코테집계` - 오늘 집계 조회 (관리자 채널 전용)
- `/코테집계 [날짜]` - 특정 날짜 집계 실행 (관리자 채널 전용)

---

## 📊 데이터 구조

### Google Sheets

#### `challengers`
챌린저 명단 관리
```
| 사용자명 | Slack ID | 등록일시 |
```

#### `daily-challenge`
일일 제출 기록
```
| 날짜 | 사용자명 | PR 링크 | 시간 |
```

#### `challenger-stats`
챌린저별 누적 통계
```
| 챌린저명 | 총 제출 성공 | 총 미제출 | 누적 경고 | 상태 | 마지막 업데이트 |
```

#### `aggregation`
일일 전체 집계
```
| 날짜 | 챌린저 수 | 제출 성공 | 미제출 | 성공률(%) |
```

---

## 🔄 자동화 프로세스

### 일일 집계 (매일 자정)

1. **전날 제출 확인** - 모든 챌린저의 제출 여부 확인
2. **통계 업데이트** - 성공/실패 횟수, 경고 누적
3. **관리자 알림** - 경고 2회 초과 시 관리자 채널 알림
4. **전체 알림** - 일반 채널에 결과 요약 전송

```
오늘 하루도 고생하셨습니다. 8명 챌린지 완료 ✅, 2명 챌린지 실패 ❌
```

---

## ⚙️ 설정

### 스크립트 속성

Apps Script 프로젝트 설정에서 다음 속성을 설정해야 합니다:

| 속성 | 설명 |
|------|------|
| `SLACK_WEBHOOK_URL` | 일반 채널 Webhook URL (결과 요약 전송) |
| `SLACK_MANAGE_WEBHOOK_URL` | 관리자 채널 Webhook URL (퇴출 알림) |
| `ADMIN_CHANNEL_ID` | 관리자 채널 ID (수동 집계 권한 검증용) |

### 경고 임계값

`code/scheduler/dailyAggregationScheduler.gs` 파일에서 설정:

```javascript
const MAX_WARNINGS = 2;  // 경고 2회 초과 시 퇴출 대상
```

---

## 📖 문서

- **[명령어 가이드](docs/command/README.md)** - 모든 Slack 명령어 사용법
- **[설정 가이드](docs/guide/README.md)** - Google Apps Script 설정 방법
- **[스케줄러 가이드](docs/scheduler/README.md)** - 일일 집계 스케줄러 설정
- **[CLAUDE.md](CLAUDE.md)** - AI 개발자를 위한 아키텍처 가이드

---

## 🎯 정책

### 제출 정책
- **하루 1회 제출** - 당일 중복 제출 불가
- **PR 링크 필수** - `https://github.com/{owner}/{repo}/pull/{number}` 형식
- **중복 링크 금지** - 과거 제출한 PR 링크 재사용 불가
- **당일 수정 가능** - `/코테제출수정` 명령어로 수정

### 경고 정책
- **미제출 시 경고 +1** - 자동으로 경고 누적
- **경고 2회 초과 시** - 관리자 채널에 퇴출 알림
- **수동 퇴출** - 관리자가 직접 조치

---

## 🤝 기여

이 프로젝트는 루퍼스 팀의 코딩 테스트 챌린지를 위해 만들어졌습니다.

### 개선 아이디어
- 주말/휴일 예외 처리
- 리마인더 기능 (제출 전 알림)
- 랭킹 시스템
- 통계 대시보드

---

## 📝 라이선스

이 프로젝트는 내부용으로 제작되었습니다.

---

## 🆘 문제 해결

### 자주 묻는 질문

**Q: 명령어가 작동하지 않아요**  
A: 웹 앱 배포가 올바르게 되었는지, Slack 슬래시 커맨드 URL이 정확한지 확인하세요.

**Q: 스케줄러가 실행되지 않아요**  
A: Apps Script 트리거가 올바르게 설정되었는지 확인하세요. (트리거 메뉴에서 확인 가능)

**Q: Slack 알림이 오지 않아요**  
A: 스크립트 속성에 Webhook URL이 올바르게 설정되었는지 확인하세요.

더 많은 질문은 **[명령어 가이드 FAQ](docs/command/README.md#faq)** 참고

---

## 📞 문의

프로젝트 관련 문의는 팀 관리자에게 연락해주세요.

---

**Made with ❤️ for Loopers Team**
