### 起動コマンド
```bash
cd backend
python3 -m venv .venv  # 初回のみ
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

### 環境変数

`.env.example` を `.env` にコピーして設定してください。

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis 接続 URL。本番は `rediss://` を使用 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | CORS 許可オリジン（カンマ区切りで複数指定可） |
| `TICK_CONCURRENCY` | `8` | 同時ティック数の上限（1 以上の正整数）。大きくするとルームが多い時の tick レイテンシが下がるが Redis 負荷が増す |