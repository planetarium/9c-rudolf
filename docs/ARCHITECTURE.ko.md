> [!NOTE]
> `ARCHITECTURE.md`가 대신 적절한 파일명이 있다면 수정 부탁드립니다.

## 개요

9c-rudolf는 2023년 3분기, 대량의 나인크로니클 모바일 사전예약 아이템을 Mead 계약의 한계 내에서 빠르고 확실히 전달하기 위해 제작되었습니다. 그리고 플라네타리움 내부에서 사용되는 백오피스에서 이벤트 기능을 제공하기 위해, 추가로 기능이 추가되기도 하였습니다.

## 데이터베이스

2024년 12월 10일 기준, 아래와 같은 테이블(개념)으로 구성되어있습니다 ([Prisma ORM 코드](../prisma/schema.prisma)):

 - `Job`: 재화(currency, 아이템)를 지급하기 위한 기본 작업 단위입니다. `/jobs/*` API를 통해 요청하는 것들은 모두 이 테이블에 저장됩니다. ([관련 구현 코드](../src/job))
 - `Transaction`: `Job`들을 모아 블록에 포함될 수 있는 실제 트랜잭션입니다. `Job`이 실제로 동작하기 위해서는 이 `Transaction` 형태로 묶여야 합니다. 주기적으로 이 트랜잭션들은 스테이징되고 트랜잭션 상태 (TxResult)가 업데이트 됩니다. ([관련 구현 코드](../src/transaction/))
 - `JobExecution`: `Job`이 어떤 `Transaction`에 담겼는지를 판단하기 위한 값입니다. `jobId=JOB_ID,transactionId=TX_ID` 같은 값이 있다면, JOB_ID `Job` 은 `TX_ID` 트랜잭션에 포함되었다는 의미입니다. 외에 `retries` 라는 필드가 있는데 `Job` 몇 번이나 `Transaction`에 담겼는지 기록하기 위함입니다. 트랜잭션은 재화 잔고 부족이나 기타 사유로 실패할 수 있기에 실패한 `Job` 들은 다시 모아 다음 `Transaction`에 포함될 수 있도록 합니다. 다만 무한히 `Transaction` 을 찍어서는 안 되니 최대 5회 재시도 까지 허용합니다. 이 값은 [`queue.service`](../src/queue/queue.service.ts) 에서 `JOB_RETRY_LIMIT` 값을 수정하여 조절할 수 있습니다.
 - `AuthToken`: 인증이 필요한 API들에 필요한 인증 토큰을 저장합니다.
 - `TickerWhitelist` (deprecated): 의도하지 않은 티커의 재화를 실수로 넣지 않게 하기 위해서 저장하는 값이었으나, 계속 다른 티커들이 생기기에 사용되지 않습니다.

### ? 트랜잭션을 데이터베이스에 기록하는 이유

저자가 이전에 서명을 하는 앱을 만들때는 요청이 올 때마다 트랜잭션을 서명하고, 곧바로 스테이징 한 뒤 잊어버리는 구조로 작성했었습니다. 하지만 이 방식은 아래와 같은 문제가 있었습니다:

- 트랜잭션을 기록하지 않고 그때그때 서명하게 되면 헤드리스 네트워크 연결 및 지연 상태에 영향을 받아 논스가 부정확해집니다. 한 논스에 대해 두 번 서명하게 되면 두 트랜잭션과 중 어떤 트랜잭션이 블록에 들어갈지 모르는 의도하지 않은 상황이 발생합니다.
- 헤드리스 노드가 내려갔다 올라오면 헤드리즈 트랜잭션 풀이 초기화 되기 때문에 트랜잭션이 유실되는 경우가 발생합니다. 하지만 유실되었다는 것이 사라져서 블록에 포함될 수 없다는 이야기가 아니기 때문에, 의도하지 않은 상황을 필히 고려해야하는 상황이 발생합니다.

위 같은 문제 때문에 트랜잭션 서명 및 보관 과정과, 스테이징 관련을 분리하였습니다. 논스는 데이터베이스에 의존하여 가져옵니다. 때문에 **9c-rudolf가 사용하는 AWS KMS 계정을 9c-rudolf가 아닌 다른 객체가 사용하는 것을 허용하지 않습니다. 만약 그리 사용한다면 9c-rudolf에서 가정한 상황들이 깨져 의도치 않은 동작들이 발생할 수 있습니다.** 만약 재화를 옮기는 것이 필요할 경우 `/jobs/transfer-assets`를 사용하여 옮기는 것을 권장합니다.

## 인증

9c-rudolf는 `/jobs/transfer-assets`, `/jobs/claim-items`, `/jobs/events` 같은 쓰기 API에서는 인증을 요구하고 있습니다. 전체를 확인하기 위해서는 소스코드에서 `@RequireAuthToken` decorator가 달린 API들을 검색하여 확인할 수 있습니다.

9c-rudolf는 `Bearer` 토큰 방식으로 인증합니다. 플라네타리움 내부에서 사용되기를 기대하고 만들어졌던 프로젝트이기에 사용자가 [포탈](https://nine-chronicles.com) 하나로 제한 되어 있었기에 Bearer 방식만으로 충분했기 때문입니다. 만약 사용자가 많아져 인증을 검사하는데 비용이 비싸지게 된다면, JWT 처럼 인증 서버가 필요없는 방식으로 교체를 고려해볼 필요가 있습니다.

## OpenTelemetry

9c-rudolf는 `/metrics` 엔드포인트를 통해 여러 메트릭을 제공합니다. 이 메트릭은 [Prometheus]에서 이해할 수 형태이기에, Prometheus에서 스크래핑하게 만들어 [Grafana] 같은 대시보드에서 모니터링할수 있습니다. 아래는 9c-rudolf에서 제공하는 메트릭 목록 입니다:

 - `node_http_request_count_total` (Counter): HTTP 요청 메트릭
   - labels
     - `method`: HTTP Request Method (e.g., `GET`, `POST`)
     - `url`: [Express Request.baseUrl](https://expressjs.com/en/api.html#req.baseUrl)
 - `node_http_response_count_total` (Counter): HTTP 응답 메트릭
   - labels
     - `method`: HTTP Request Method (e.g., `GET`, `POST`)
     - `url`: [Express Request.baseUrl](https://expressjs.com/en/api.html#req.baseUrl)
     - `status_code`: HTTP Response StatusCode (e.g., `200`, `500`)
 - `rudolf_total_jobs` (Gauge): 전체 `Job` 개수
 - `rudolf_remaining_jobs` (Gauge): 아직 처리 중인 `Job` 개수
 - `rudolf_failed_jobs` (Gauge): 실패한 `Job` 개수

[Prometheus]: https://prometheus.io/
[Grafana]: https://grafana.com/grafana/

## 프로젝트 구조

 - `/src`
    - `/queue`: `Job`들을 묶어 `Transaction`으로 만드는 처리를 합니다.
    - `/tx`: 트랜잭션 생성 및 스테이징과 관련된 로직을 제공합니다.
    - `/transaction`: `Transaction` 과 관련된 요청을 처리합니다.
    - `/job`: `Job` 과 관련된 요청을 처리합니다.
    - `/prisma`: Prisma 클라이언트를 NestJS 컨벤션에 맞게 래핑해놓은 모듈 및 서비스를 제공합니다.
    - `/common`
      - `/decorators`: 공통으로 사용하는 [데코레이터][nestjs-decorator]들을 모아둡니다.
      - `/guards`: 공통으로 사용하는 [가드][nestjs-guard]들을 모아둡니다.
 - `/k6`: 스트레스 테스트를 위한 코드를 모아둡니다.
 - `/docs`: README.md, CONTRIBUTING.md를 제외한 기타 문서들을 모아둡니다.

[nestjs-guard]: https://docs.nestjs.com/guards
[nestjs-decorator]: https://docs.nestjs.com/custom-decorators
