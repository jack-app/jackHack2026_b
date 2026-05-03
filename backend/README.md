### 起動コマンド
```bash
cd backend
python3 -m venv .venv  # 初回のみ
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```