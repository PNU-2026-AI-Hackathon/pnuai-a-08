# 서로서가 Android 에이전트 작업 문서

이 문서 묶음은 **기능 명세서가 아니라, Android 구현 작업을 요청하고 검토하는 방식의 기준**이다.
기존의 단일 문서에 섞여 있던 규칙, 구조, 기록 방식, 요청 템플릿, 예시를 역할별로 분리했다.

## 문서 구성

| 파일 | 목적 | 사용 시점 |
| --- | --- | --- |
| `AGENTS.md` | Codex가 구현 전후에 반드시 지켜야 하는 핵심 행동 강령 | 매 작업 시작 시 우선 읽기 |
| `docs/rules/IMPLEMENTATION_DECISIONS.md` | 새 화면 생성, 현재 화면 상태 처리, 계층 분리 기준 | 구현 계획 수립 시 |
| `docs/PROJECT_STRUCTURE.md` | 파일 배치 기준과 데이터/이동 흐름 | 파일 생성·수정 범위 판단 시 |
| `docs/rules/PAGE_INTERACTIONS_GUIDE.md` | `docs/page_interactions.md` 기록 규칙 | 화면 이동 흐름이 추가·변경될 때 |
| `docs/templates/CODEX_REQUEST_TEMPLATE.md` | 작업자가 요청할 최소 정보와 Codex 계획 출력 형식 | 새 기능 요청 시 |
| `docs/examples/REFERENCE_EXAMPLES.md` | 원문에 있던 화면별 판단 및 흐름 예시 | 판단 기준이 애매할 때 참고 |
| `docs/domain_modeling.md` | `Book`, `RentalBook` 등 도메인 객체 구분 기준 | 데이터 모델 추가·수정 시 |
| `docs/local_json_db.md` | Firebase 전 단계의 앱 내부 JSON DB 저장 기준 | local 저장 기능 구현 시 |
| `docs/rental_flow_plan.md` | 대여 요청, 채팅, 합의 완료 흐름 계획 | 대여 요청 이후 기능 구현 시 |
| `docs/CONTENT_COVERAGE_MAP.md` | 원문의 모든 내용이 어디로 이동했는지 확인하는 대응표 | 누락 검토 시 |
| `_archive/ORIGINAL_ANDROID_WORKFLOW.md` | 편집 전 원문 보관본 | 원문 대조 시 |

## 읽는 순서

1. `AGENTS.md`
2. `docs/rules/IMPLEMENTATION_DECISIONS.md`
3. `docs/PROJECT_STRUCTURE.md`
4. 필요 시 `docs/rules/PAGE_INTERACTIONS_GUIDE.md`
5. 새 작업 요청 시 `docs/templates/CODEX_REQUEST_TEMPLATE.md`

## 문서 적용 원칙

- 실제 기능 목록과 UI 명세는 이 문서 묶음의 대상이 아니다.
- 이 문서들은 **어떻게 구현을 판단하고 수정할지**를 통일한다.
- 기존 프로젝트 구조와 충돌하는 경우, 에이전트는 임의로 구조를 바꾸지 않고 먼저 충돌 내용을 보고한다.
- 실제 화면 이동 목록은 기존 `docs/page_interactions.md`를 유지하며, 필요한 경우 해당 파일에 추가 기록한다.
- `docs/page_interactions.md`가 아직 없다면, 새 화면 생성 또는 화면 이동 흐름 변경 작업 시 생성 필요 여부를 먼저 확인한다.
