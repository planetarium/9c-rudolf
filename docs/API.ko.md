> [!NOTE]
> Planetarium 내부 노션에 있던 API 문서를 옮겨와 첨삭하였습니다.

# POST /jobs/claim-items

### Request

> [!NOTE]
> `item.ticker` 항목은 `FAV__`, `Item_T_`, `Item_NT_` 중 하나로 시작해야 합니다.

`ClaimItems` 액션으로 묶을 `Job`을 추가합니다. 아이템 및 크리스탈을 지급할 때 사용할 수 있습니다.

```json
{
	"id": "2023_coupon_0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"avatarAddress": "0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"item": {
		"ticker": "Item_NT_400000",
		"amount": "10"
	}
}
```

### Response

```json
{
	"id": "2023_coupon_0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"jobSequence": 120
}
```

# POST /jobs/transfer-assets

`TransferAssets` 액션으로 묶을 `Job`을 추가합니다.

### Request (Transfer to agent)

```json
{
	"id": "2023_coupon_0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"agentAddress": "0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"item": {
		"ticker": "NCG",
		"amount": "10"
	}
}
```

### Request (Transfer to avatar)

```json
{
	"id": "2023_coupon_0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"avatarAddress": "0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"item": {
		"ticker": "CRYSTAL",
		"amount": "1"
	}
}
```

### Response

```json
{
	"id": "2023_coupon_0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"jobSequence": 120
}
```

# GET /jobs/{id}

### enum: result

> [!WARNING]
> **PENDING**, **PROCESSING** 단계에서는 TX가 생성되지 않았음으로 transactionId 또한 response에 포함되지 않습니다.

- **PENDING**: 내부 큐에 대기 상태로 등록, TX 생성 전.
- **PROCESSING**: 내부 큐에서 처리 대상이 되어 작업이 진행중인 상태. 아직 TX는 스테이지 되지 않은 것으로 처리
- **STAGED**: TX 생성 후 TX 스테이지 완료된 상태.
- **SUCCESS**: TX가 블럭에 Append되어 액션 실행 완료된 상태.
- **FAILED**: TX가 블럭에 Append되었지만 TxResult가 FAILED인 상태.

### Response

```json
{
	"id": "2023_coupon_0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"actionType": "CLAIM_ITEMS",
	"avatarAddress": "0x06ded5c93ab3f2b9ccbdc53a726df823eb1bfa27",
	"status": "STAGED",
	"transactionId": "0506f3100d1c3f53ad332500454019ebcebb179624335dab02c80934ac174e10",
	"item": {
		"ticker": "Item_NT_400101",
		"amount": "10"
	},
	"jobSequence": 100
}
```

# GET /transactions/{txId}

### Response

```json
{
	"actionType": "CLAIM_ITEMS",
	"transactionId": "0506f3100d1c3f53ad332500454019ebcebb179624335dab02c80934ac174e10",
	"status": "SUCCESS",
	"jobIds": [
		"2023_coupon_0x68344d0c4e3a9642873aa90891c5caba",
		"2023_coupon_0xe95159499aa16b44b1b6058ce7a4f1d6",
		"2023_coupon_0x52ac495fe312724fa9336dda23da0def",
		"2023_coupon_0x3ce93fbec57d2447bf317fa7977cfad7",
		"2023_coupon_0xd736c4e37df4d54db2fbf43d4e96095c"
	]
}
```

# `POST /jobs/events`

`eventId`로 구분되는 `Job` 묶음을 추가합니다. `Job`이 많아 한번에 벌크로 추가하고 싶을때 사용할 수 있습니다.

### Request

```json
{
	"eventId": "0122_01_event",
	"items": [
		{
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "1000000000000"
		},
		{
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "2000000000000"
		},
		{
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "1200000000000"
		},
		{
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "1030000000000"
		},
		{
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "1004000000000"
		},
		{
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "1000005000000"
		}
	]
}
```

# `GET /jobs/events/{eventId}`

### Response

```json
{
	"id": "0122_01_event",
	"jobs": [
		{
			"id": "ead9b701-43a9-4dee-8bb4-b64a646821e8",
			"actionType": "CLAIM_ITEMS",
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "1000000000000",
			"transactionId": "26670f2fbcff36f237098866887055904f46c476f606442cd57681ce7cd4fffb",
			"status": "INVALID",
			"retries": 0
		},
		{
			"id": "4f08a750-c920-4c1d-bce3-4be7b406e63c",
			"actionType": "CLAIM_ITEMS",
			"avatarAddress": "0xaC31881dB9CAf1EAfE8c068A9b6cA8e7a2656741",
			"ticker": "FAV__CRYSTAL",
			"amount": "2000000000000",
			"transactionId": "26670f2fbcff36f237098866887055904f46c476f606442cd57681ce7cd4fffb",
			"status": "INVALID",
			"retries": 0
		}
	]
}
```
