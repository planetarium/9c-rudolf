# 기여 가이드

9c-rudolf 프로젝트 기여에 관심을 가져주셔서 감사합니다! 이 문서에서는 기여할 때 알아야 하는 내용과 기여하는 법을 설명합니다.

## 버그 리포트

만약 9c-rudolf 에서 버그를 찾으셨다면, 우선 GitHub 이슈 트래커에서 이미 다른 기여자가 올려놓은 이슈가 없는지 검색하여 확인해주세요. 관련된 파일 명이나 API 엔드포인트 등으로 검색해볼 수 있습니다. 만약 아직 발견되지 않은 이슈라면 아래 내용들을 포함하여 새로 이슈를 열어주세요:

- 사용 중인 9c-rudolf 버전.
- 사용 중인 데이터베이스 (i.e., PostgreSQL) 버전.
- 실행 중인 운영체제 (e.g., Linux) 버전.
- 기대한 동작.
- 현재 동작.
- 해당 버그를 재현하기 위한 방법.

## 기능 요청하기

만약 9c-rudolf 에 요청하고 싶은 기능이 있다면, 우선 GitHub 이슈 트래커에서 이미 요청된 기능인지 검색하여 확인해주세요. 만약 아직 요청되지 않았다면 아래 내용들을 포함하여 새로 이슈를 열어주세요:

## 풀 리퀘스트

직접 내용을 작성하고 풀 리퀘스트를 만들어 기여할 수도 있습니다. 아래에서는 실제 코드를 작성하는 과정에서 알아야 할 내용들을 설명합니다.

### 라이센스

9c-rudolf 프로젝트는 [AGPL-3.0][agpl-3.0] 라이센스를 따릅니다. 9c-rudolf 저장소에 풀 리퀘스트를 연다는 것은 이 라이센스에 동의하는 것입니다. 만약 이 라이센스에 동의하지 않는다면 풀 리퀘스트를 열지마세요.

또한 법적 분쟁을 피하기 위해 [CLA][CLA] 서명을 받고 있습니다. 상세한 내용은 CLA에 서명하기 전 내용을 읽어보세요.

[agpl-3.0]: https://www.gnu.org/licenses/agpl-3.0.en.html
[CLA]: https://en.wikipedia.org/wiki/Contributor_License_Agreement

### 버그 수정

만약 버그를 수정하고자 한다면, 우선 GitHub 이슈 트래커에서 해당 버그가 이미 제보 되었는지 확인해주세요. 만약 아직 제보되지 않은 버그라면 이슈를 새로 열어 정말 버그인지, 어떻게 고쳐야 할지 논의해주세요.

그리고 풀 리퀘스트를 열때는 해결하는 버그의 이슈 넘버를 함께 첨부해주세요.

### 기능 구현

만약 기능을 구현하여 기여하고자 한다면, 우선 GitHub 이슈 트래커에 이슈를 만들고 만들고 싶은 기능에 대해 논의해주세요. 만약 그 제안이 받아들여진다면 그 때부터 작업을 시작하시면 됩니다. 

풀 리퀘스트를 열 때는 아래 내용들을 포함해 주세요:

 - 관련된 이슈 넘버.
 - 변경에 대한 설명.
 - 이 변경이 왜 필요한지에 대한 설명.
 - 변경 사항을 테스트 하기 위한 방법.

풀 리퀘스트의 변경 사항은 아래 항목을 포함해야 합니다:

 - 기능에 대한 유닛 테스트.
 - 기능에 대한 구현.
 - 기존 기능을 변경한 경우, 관련 문서 업데이트.
 - 문서 등에 위치한 예제 코드의 동작 여부.

## 빌드

### 개발환경

9c-rudolf 개발을 하기 위해서는 아래와 같은 항목들이 준비되어야 합니다.

 - Node.js 22 이상
 - [yarn]
 - AWS KMS 인스턴스. (Asymmetric, ECC_SECG_P256K1)
 - PostgreSQL 인스턴스.
   - macOS의 경우 Homebrew로 설치할 수 있습니다.
 - [NineChronicles.Headless][9c-headless] GraphQL API 엔드포인트.
   - 송금 테스트까지 진행하고자 한다면 위 AWS KMS 인스턴스 주소에 재화가 들어있어야 합니다.
   - 때문에 로컬 헤드리스를 띄울 수 있다면 띄워서 테스트 하는 것도 방법이고, 별도의 테스트넷을 상시 띄워놓고 어드민 권한으로 재화를 발행하거나, 송금하여 사용할 수도 있습니다.

준비가 되었다면 먼저 `yarn install --immutable` 명령어로 의존성을 설치해주세요.

이제 `.env` 파일을 구성해야 합니다.

 - `AWS_KMS_KEY_ID` 에는 위에서 준비한 AWS KMS 인스턴스의 key-id를 넣어주세요.
 - `AWS_KMS_PUBLIC_KEY` 에는 `AWS_KMS_KEY_ID` 에 해당하는 AWS KMS 인스턴스의 공개키를 넣어주세요. `uncompressed` 포맷으로 넣어야 합니다.
 - `NC_GRAPHQL_ENDPOINT` 에는 위에서 준비한 [NineChronicles.Headelss][9c-headless] GraphQL 엔드포인트를 준비해주세요. (e.g., `https://9c-main-full-state.nine-chronicles.com/graphql`)
 - `DATABASE_URL` 에는 위에서 준비한 PostgreSQL 인스턴스에 접속할 수 있는 connection-string을 넣어주세요. 읽기/쓰기 권한 모두 필요합니다.
 - `NCG_MINTER` 값은 9c-rudolf가 바라보는 네트워크에서 사용하는 NCG 형태에 따라 달라집니다. 2024-12-10 09:00 KST 기준, heimdall 같은 확장용 네트워크의 경우 `minters` 속성 값을 `null`로 가진 NCG를 사용중입니다. 이 경우 `NCG_MINTER` 를 정의하지 마세요. 그 외의 경우에는 NCG의 `minters` 속성 값을 확인 후 넣어주세요.
 - `GENESIS_BLOCK_HASH` 값은 9c-rudolf가 바라보는 네트워크의 제네시스 블록의 해시입니다. 이 값이 다르다면 네트워크에 맞지 않은 트랜잭션을 만들게 되고, 변경 된다면 데이터베이스를 오염시킬 수 있습니다.
 - `DEFAULT_START_NONCE` 값은 선택적입니다. 이미 사용하던이 계정이거나, 사전 작업을 진행하며 트랜잭션을 서명하였다면 9c-rudolf가 사용할 논스를 지정해줘야 합니다. 예를 들어 nonce 0, 1, 2에 해당하는 트랜잭션을 서명하여 네트워크에 포함시킨 계정이라면, `3` 을 값으로 지정해야 합니다.

`yarn prisma migrate dev` 명령어로 데이터베이스에 스키마를 적용하고, `yarn start:dev` 명령어로 실행해볼 수 있습니다. 자세한 스크립트 목록과 내용은 [package.json](./package.json)을 참고하세요.

### 빌드

`yarn build` 명령어로 빌드할 수 있습니다.

### 도커 빌드

Dockerfile이 정의되어 있으므로 `docker build` 같은 명령어로 컨테이너 이미지를 만들수 있습니다.

여러 플랫폼을 타겟해야 한다면 `docker buildx build` 명령어를 활용할 수 있습니다.

## 팁

### AWS KMS에서 공개키와 주소 얻는 방법

AWS KMS 인스턴스를 만들고 나서 사용하기 위해서는 공개키가 필요하고, 재화를 채워넣기 위해서는 주소가 필요합니다. 아래 스크립트로 간단히 얻을 수 있습니다.

```typescript
import { AwsKmsKeyStore, KMSClient } from "npm:@planetarium/account-aws-kms";

const keyStore = new AwsKmsKeyStore(new KMSClient());
const response = await keyStore.get("<KEY-ID>");
if (response.result === "success") {
    const account = response.account;
    const publicKey = await account.getPublicKey();
    const address = await account.getAddress();

    console.log("publicKey", publicKey.toHex("uncompressed"));
    console.log("address", address.toString());
} else {
    console.error("Failed to read key information.", response);
}
```

위 스크립트를 위해 필요한 권한은 [@planetarium/account-aws-kms의 README](https://github.com/planetarium/libplanet/tree/7513c9b730177484b01decf553b978af8175f0a3/%40planetarium/account-aws-kms#required-permissions)를 참고하세요.

[yarn]: https://yarnpkg.com/
[9c-headless]: https://github.com/planetarium/NineChronicles.Headless
