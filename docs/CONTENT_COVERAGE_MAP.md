# 원문 내용 보존 대응표

## 1. 목적

원문에서 삭제된 요구사항이 없도록, 원문의 각 내용이 분리된 문서 중 어디에 반영되었는지 기록한다. 문법과 표현은 정리했지만 의미상 요구사항은 제거하지 않았다. 편집 전 원문 자체는 `_archive/ORIGINAL_ANDROID_WORKFLOW.md`에 그대로 보관한다.

## 2. 원문 → 분리 문서 대응표

| 원문 내용 | 반영 파일 | 반영 상태 |
| --- | --- | --- |
| 문서 목적: 기능 명세가 아닌 작업 방식 통일 문서 | `README.md`, `AGENTS.md` | 유지 |
| 화면, Trigger, 이동, 상태 변화, 데이터 계층 분리 | `AGENTS.md` | 유지·표현 정리 |
| 구현 전 프로젝트 구조 확인 | `AGENTS.md` | 유지 |
| Screen/Activity, Component, page_interactions, Repository/Data, 유사 기능 확인 | `AGENTS.md` | 유지 |
| 기존 구조와 충돌·중복 구현 방지 | `AGENTS.md` | 유지 |
| 작업 판단 순서 1~6 | `AGENTS.md` | 유지·문법 정리 |
| 새 화면 이동 기능 판단 기준 | `docs/rules/IMPLEMENTATION_DECISIONS.md` | 유지 |
| 새 화면 생성/이동 처리 방식 | `docs/rules/IMPLEMENTATION_DECISIONS.md` | 유지 |
| 새 화면 생성 시 page_interactions 기록 및 append 방식 | `docs/rules/IMPLEMENTATION_DECISIONS.md`, `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 유지 |
| 새 화면 이동 예시 3건 | `docs/examples/REFERENCE_EXAMPLES.md` | 유지 |
| 현재 화면 내부 상태 처리 기준 | `docs/rules/IMPLEMENTATION_DECISIONS.md` | 유지 |
| `remember`, `ViewModel` 사용 기준 | `docs/rules/IMPLEMENTATION_DECISIONS.md` | 유지 |
| 화면 내부 변경 예시 3건 | `docs/examples/REFERENCE_EXAMPLES.md` | 유지 |
| 페이지 상호작용 목록 기록 규칙 | `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 유지 |
| 기록 형식 | `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 유지 |
| 동작 유형 4종 | `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 유지 |
| 동작 유형 조합 가능 | `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 유지 |
| 유형을 enum처럼 제한하지 않음 및 새 유형 검토 후 규칙 문서에 추가 | `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 유지·명칭 정리 |
| 기능 흐름 기준으로 기술 | `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 유지·표현 정리 |
| Home/AIGuide/RentalDetail 기록 예시 | `docs/rules/PAGE_INTERACTIONS_GUIDE.md`, `docs/examples/REFERENCE_EXAMPLES.md` | 유지 |
| 파일 배치 규칙과 전체 트리 | `docs/PROJECT_STRUCTURE.md` | 유지 |
| 각 계층 역할 | `docs/PROJECT_STRUCTURE.md` | 유지 |
| 홈 화면 AI 추천 도서 클릭 파이프라인 | `docs/PROJECT_STRUCTURE.md`, `docs/examples/REFERENCE_EXAMPLES.md` | 유지 |
| Codex 작업 요청 원칙 | `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 유지 |
| 작업자가 전달할 최소 정보 3종 | `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 유지 |
| 신고 기능 요청 예시 | `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 유지 |
| 즉시 구현 금지 및 구현 전 분석 항목 | `AGENTS.md`, `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 유지 |
| 불명확한 부분 질문 확인 및 질문 예시 | `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 유지 |
| 계획 출력 후 사람 확인 뒤 구현 | `AGENTS.md`, `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 유지 |
| 신고 기능 작업 계획 예시 | `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 유지 |
| 금지 사항 8개 | `AGENTS.md` | 유지·내비게이션 표현 보완 |

## 3. 새로 보강한 지침

아래 항목은 원문의 내용을 삭제하거나 변경한 것이 아니라, 에이전트가 기존 프로젝트 구조를 잘못 덮어쓰는 위험을 낮추기 위해 추가한 행동 지침이다.

| 추가 항목 | 추가 위치 | 이유 |
| --- | --- | --- |
| 실제 프로젝트가 `ActivityNavigator` 외의 기존 내비게이션 구조를 사용하는지 먼저 확인 | `AGENTS.md`, `docs/PROJECT_STRUCTURE.md` | Compose 프로젝트에서 불필요한 Activity 생성 또는 구조 충돌 방지 |
| 예시보다 실제 프로젝트 구조와 현재 흐름 문서를 우선 적용 | `AGENTS.md` | 예시의 무비판적 복사 방지 |
| 구조 변경이 필요하면 이유와 영향 범위를 계획에 먼저 적음 | `docs/PROJECT_STRUCTURE.md` | 임의 대규모 리팩터링 방지 |
| 작업 계획의 `[확인이 필요한 사항]` 항목 | `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 불명확한 결정을 구현 전에 드러내기 위함 |
| `docs/page_interactions.md`가 없을 때 생성 필요 여부를 먼저 확인 | `AGENTS.md`, `README.md`, `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | 현재 프로젝트 상태와 기록 규칙의 충돌 방지 |
| `MainActivity`와 앱 루트 Composable의 책임 제한 | `AGENTS.md`, `docs/PROJECT_STRUCTURE.md` | 초기 프로토타입 코드가 한 파일에 집중되는 문제 방지 |
| 목(mock) 데이터 위치와 Repository 전달 기준 | `docs/PROJECT_STRUCTURE.md` | 화면과 데이터 계층 분리 강화 |
| 공통 컴포넌트 분리 기준 | `docs/PROJECT_STRUCTURE.md` | 화면 파일 비대화와 재사용성 저하 방지 |
| Repository 생성, ViewModel, DI 도입 판단 기준 | `docs/PROJECT_STRUCTURE.md` | 앱 규모 증가 시 상태·의존성 관리 기준 마련 |

## 4. 표현 정리 사항

- `ui 적 요소` → `UI 요소`
- `화면속` → `화면에서`
- `Trigger 하는` → `실행시키는 트리거(Trigger)`
- `state` → 문맥에 따라 `상태(state)`로 통일
- `mock data` → `목(mock) 데이터`로 표기하되 코드/기록 예시는 기존 표현 유지
- 강한 구어체 지시문은 의미를 유지한 절차형 문장으로 정리
