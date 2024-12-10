> [!NOTE]
> 운영에 필요한 팁들을 기록합니다.

# 9c-rudolf 컨테이너 내부에서 PostgreSQL 접속하기

9c-rudolf 컨테이너를 띄울때 사용한 `DATABASE_URL` 환경변수를 활용하여 동일한 connection-string으로 PostgreSQL에 접속하려면 아래 스크립트를 실행할 수 있습니다.

```
apt-get update
apt-get install postgresql-client -y
psql $(printenv | grep DATABASE_URL= | sed s/DATABASE_URL=// | sed s/\?schema=public//)
```
