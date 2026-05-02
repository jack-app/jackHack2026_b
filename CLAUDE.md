# 【プロジェクト全体構成】陣取りアクションゲーム

## リポジトリ構成(Python 3.12 + Node 20)

```text
jackHack2026_b/
├── switch_game/            # フロントエンド (Next.js / TypeScript / Tailwind)
└── backend/                # バックエンド (FastAPI / python-socketio)
```

## 開発環境の起動
ターミナルを2つ開いて以下を実行する。

```bash
# ターミナル1 — バックエンド (port 8000)
cd backend
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000

# ターミナル2 — フロントエンド (port 3000)
cd switch_game
npm run dev
```

## 環境変数

| 変数名 | 設定場所 | 値 (Dev Container) |
|---|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | `devcontainer.json` → `remoteEnv` | `http://localhost:8000` |

フロントエンドの `useSocket.ts` では `process.env.NEXT_PUBLIC_SOCKET_URL` を参照。
未設定時は `http://localhost:8000` にフォールバックする実装を推奨。

---

# 【フロントエンド実装仕様書】陣取りアクションゲーム (Next.js / Socket.io)

## 1. プロジェクト概要と技術スタック
* **フレームワーク:** Next.js (React), App Router推奨
* **言語:** TypeScript (Strictモード有効)
* **スタイリング:** Tailwind CSS
* **通信:** `socket.io-client`
* **デザインテーマ:** 白黒ベース、無機質なサイバー風、角ばったUIフレーム。アクセントカラーとして赤（チームRed）と青（チームBlue）を使用。
* **アーキテクチャ方針:** サーバーを「正（Single Source of Truth）」とし、フロントエンドは「サーバーから送られてきた状態の描画」と「ユーザー入力の送信」に徹する。クライアントサイドでの先行予測（プレディクション）は行わない。

## 2. 型定義 ( `src/types/game.ts` )
以下のインターフェースを厳密に守って実装すること。

```typescript
// プレイヤー情報
export interface Player {
  team: "red" | "blue";
  x: number;
  y: number;
}

// ゲームの全体状態 (update_state イベントで受信)
export interface GameState {
  room_id: string;
  status: "waiting" | "playing" | "finished";
  host: string; // socket.id と一致する文字列
  players: Record<string, Player>; // キーは socket.id
  time_left: number;
  switches: Record<string, "red" | "blue" | null>;
  score: {
    red: number;
    blue: number;
  };
}

// マップ情報 (map イベントで受信)
export interface MapData {
  map: (number | string)[][]; // 0: 壁, 1: 床, "sXX": スイッチID
  switch_weights: Record<string, number>; // 各スイッチの得点
}
```

## 3. ディレクトリ・コンポーネント構成
以下の構成でコンポーネントを分割すること。

```text
src/
├── types/
│   └── game.ts          # 上記のインターフェース定義
├── hooks/
│   ├── useSocket.ts     # socket.ioの接続、イベント監視、送信メソッドをカプセル化
│   └── useGameInput.ts  # キーボード入力(WASD/矢印)の監視とmove送信 (100msスロットリング必須)
└── components/
    ├── Layout/
    │   ├── GameFrame.tsx    # 画面全体を囲む角ばった無機質なサイバー風の境界線
    │   └── TopHeader.tsx    # 画面上部固定のHUD（左:TIME LEFT, 中央:STATUS/ID, 右:SCORES）
    ├── Map/
    │   ├── Board.tsx        # MapDataに基づくグリッド描画基盤 (盤面の背景)
    │   ├── Tile.tsx         # 1マスの描画 (壁、床、スイッチ)
    │   └── Player.tsx       # プレイヤーアイコン (自身は濃く、他人は薄く描画)
    └── UI/
        ├── TitleMenu.tsx    # タイトル画面の中央メニュー (部屋作成ボタン、参加フォーム)
        ├── WaitingText.tsx  # 待機中画面の中央に大きく表示されるテキスト
        └── ResultModal.tsx  # 試合終了時のモーダル (最終スコア、勝敗表示、タイトルへ戻るボタン)
```

## 4. 画面状態ごとのレンダリングロジック（`app/page.tsx`）
ページ遷移（URL変更）は使用せず、トップレベルでの条件付きレンダリングで画面を切り替える。
全体を `GameFrame` で囲み、その直下に `TopHeader` を常に配置する。

* **状態A (タイトル):** `gameState === null` の場合。
  * `TopHeader` 表示。ただし「TIME LEFT」と「SCORES」の数値は非表示にし、中央のSTATUS（"MAIN MENU"等）のみ表示。レイアウト崩れを防ぐため左右のコンテナ枠自体は残すこと。
  * 中央に `TitleMenu` を表示。
* **状態B (待機):** `gameState.status === "waiting"` かつ `mapData` が存在する場合。
  * 背景に `Board` を表示（プレイヤーは整列状態）。
  * `TopHeader` の左右要素は非表示。中央にGAME IDとSTATUS("WAITING")を表示。
  * 画面中央手前に `WaitingText` と、ホストのみ押下可能な開始ボタンをオーバーレイ表示。
* **状態C (プレイ):** `gameState.status === "playing"` の場合。
  * 背景に `Board` を表示。
  * `TopHeader` の左右要素（残り時間、スコア）を表示。
  * `useGameInput` を有効化。
* **状態D (リザルト):** `gameState.status === "finished"` の場合。
  * 状態Cの画面を背景に残したまま、手前に `ResultModal` をオーバーレイ表示。

## 5. Socket通信インターフェース

### 【受信】サーバーからクライアントへ ( `socket.on` )
1. `update_state`: ゲーム状態変化時や定期チックで送信される。Reactの `gameState` を丸ごと上書きする。
2. `map`: 部屋作成時、または参加時に送信される。Reactの `mapData` を上書きする。
3. `error`: 部屋が存在しない等のエラー時。 `{ reason: string }` が送られるため、`alert()` 等で表示してタイトル画面（状態A）へ戻す。

### 【送信】クライアントからサーバーへ ( `socket.emit` )
1. `create_room`: 引数なし `{}`。
2. `join_room`: `{ room_id: string }`。
3. `start_game`: 引数なし `{}`。待機中にホストのみが送信。
4. `move`: `{ direction: "up" | "down" | "left" | "right" }`。プレイ中に送信。自身のIDをペイロードに含める必要はない。

## 6. 実装上の厳密な制約事項（必ず遵守すること）
1. **補間移動の強制:** 通信ラグをごまかすため、`Player.tsx` の位置更新には必ずCSSトランジションを使用すること（例: Tailwindの `transition-all duration-150`）。クライアント側での独自の位置計算は**絶対に実装してはいけない**。
2. **自己識別:** クライアント自身の判別は `socket.id` を用いる。
3. **キーボード連打対策:** `useGameInput` 内で、`move` 要求の送信には最低 100ms のスロットリング処理を実装し、サーバーへの過剰なリクエストを防ぐこと。
4. **再戦機能の排除とクリーンアップ:** 「タイトルへ戻る」処理を実行する際は、Reactのローカルステート (`gameState`, `mapData`) を `null` に戻し、`socket.disconnect()` を実行して接続を完全に破棄すること。再戦機能は実装しない。


# 【バックエンド実装仕様書】陣取りアクションゲーム (FastAPI / python-socketio)

## 1. プロジェクト概要と技術スタック
* **フレームワーク:** FastAPI
* **サーバー/ASGI:** Uvicorn
* **リアルタイム通信:** `python-socketio` (ASGIApp)
* **言語:** Python 3.10+
* **アーキテクチャ方針:**
    * サーバーを「正（Single Source of Truth）」とする。
    * 全てのゲーム計算（移動可否、衝突判定、スコア計算、タイマー）はサーバーサイドで行う。
    * 状態が更新されるたびに、該当ルームの全クライアントへ `update_state` をブロードキャストする。

## 2. データ構造定義 ( TypedDict )

```python
from typing import TypedDict, Dict, List, Optional, Union, Literal

class Player(TypedDict):
    team: Literal["red", "blue"]
    x: int
    y: int

class GameState(TypedDict):
    room_id: str
    status: Literal["waiting", "playing", "finished"]
    host: str  # ホストのsid
    players: Dict[str, Player]  # key: sid
    time_left: int
    switches: Dict[str, Optional[Literal["red", "blue"]]]  # key: スイッチID
    score: Dict[str, int]  # {"red": 0, "blue": 0}

class MapData(TypedDict):
    map: List[List[Union[int, str]]]  # 0:床, 1:壁, "s01":スイッチID
    switch_weights: Dict[str, int]   # {"s01": 2, ...}

class GameError(Exception):
    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)
```

`GameError` はゲームロジックの例外をすべてこのクラスで統一する。`main.py` のハンドラで `except GameError as e` でキャッチし、`{"reason": e.reason}` を `error` イベントで送信する。

## 3. ディレクトリ・モジュール構成

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI/Socket.io初期化・イベントハンドラ・_countdown_tasks管理
│   ├── game_manager.py  # ルーム状態管理 (sioを持たない純粋な状態機械)
│   ├── game_logic.py    # 移動計算・判定・スコア更新の純粋関数
│   ├── map_generator.py # マップ定義・スイッチ配置・スポーン座標
│   └── models.py        # 型定義 + GameError
├── requirements.txt
└── .env
```

## 4. Socket.io イベント実装仕様

### 【受信: Client → Server】

1. **`create_room`**: ホスト(sid)で `waiting` ルームを作成。送信者に `map` と `update_state` を返す。
2. **`join_room`** (`{ room_id: str }`): ルーム存在・`waiting` 状態を確認。チームバランスで割り振り。参加者に `map`、ルーム全員に `update_state` を送信。
3. **`start_game`**: 送信者が `host` か確認。`playing` に変更し `_run_countdown` タスクを起動。ルーム全員に `update_state`。
4. **`move`** (`{ direction: str }`): 移動先を計算し壁判定。通過可能なら位置更新。スイッチ踏み込み時は所有権・スコアを更新。ルーム全員に `update_state`（状態変化なしはブロードキャストしない）。

### 【送信: Server → Client】

1. **`update_state`**: 状態変化時にルーム全員へブロードキャスト。
2. **`map`**: 入室・作成時に参加者本人にのみ送信（1回限り）。
3. **`error`** (`{ reason: str }`): 不正操作・存在しない部屋など。

## 5. GameManager 設計

### 内部状態

```python
class GameManager:
    _rooms: dict[str, GameState]
    _map_data: dict[str, MapData]
    _locks: dict[str, asyncio.Lock]   # per-roomロック
    _sid_to_room: dict[str, str]      # sid → room_id の逆引き
```

`_sid_to_room` により `move` ・ `disconnect` ハンドラが `room_id` を意識しなくて済む。

### 公開メソッドとエラー仕様

| メソッド | シグネチャ | raises GameError |
|---|---|---|
| `create_room` | `(sid) → (room_id, GameState, MapData)` | なし |
| `join_room` | `(sid, room_id) → (GameState, MapData)` | `"room_not_found"` / `"room_not_waiting"` |
| `start_game` | `(sid, room_id) → GameState` | `"room_not_found"` / `"not_host"` / `"game_already_started"` |
| `move_player` | `(sid, direction) → (room_id, GameState) \| None` | なし (Noneで無変化を表現) |
| `tick` | `(room_id) → GameState \| None` | なし |
| `disconnect` | `(sid) → (room_id \| None, GameState \| None)` | なし |
| `get_room_id` | `(sid) → str \| None` | なし |

### ロック規則

* `join_room` / `start_game` / `move_player` / `tick` / `disconnect` はすべて該当ルームの `asyncio.Lock` を取得してから状態を変更する。
* `disconnect` はプレイヤーを `players` から削除し、空になった場合は `_rooms` / `_map_data` を削除する。`_locks` 自体の削除はロック解放後に行う（保持中に削除しない）。

## 6. カウントダウンタスク (`main.py` が所有)

```python
_countdown_tasks: dict[str, asyncio.Task] = {}

async def _run_countdown(room_id: str) -> None:
    try:
        while True:
            await asyncio.sleep(1)
            state = await gm.tick(room_id)
            if state is None:
                break
            await sio.emit("update_state", state, room=room_id)
            if state["status"] == "finished":
                break
    finally:
        _countdown_tasks.pop(room_id, None)  # キャンセル・例外・正常終了すべてでクリーンアップ
```

* `start_game` ハンドラで `asyncio.create_task(_run_countdown(room_id))` を起動し `_countdown_tasks[room_id]` に格納する。
* `disconnect` ハンドラで `_countdown_tasks.pop(room_id, None)` し、取得できた場合は `task.cancel()` する。タスク側の `finally` との二重削除は `pop` のデフォルト値 `None` で安全に吸収される。

## 7. ルームのメモリ削除タイミング

`status="finished"` になってもルームはメモリに残る（クライアントがリザルト画面を表示中のため）。**最後のプレイヤーが disconnect したとき**に `_rooms` / `_map_data` / `_locks` を削除する。これにより TTL タイマーが不要になる。

## 8. マップ仕様

* **サイズ:** 15×15
* **セル値:** `0`=床, `1`=壁, `"s01"`〜`"s07"`=スイッチ
* **スイッチ数:** 7個、重みは 2〜5点（総計 17点）
* **スポーン:**
    * Red: `(x=1, y=1)`, `(x=1, y=13)` — マップ左端
    * Blue: `(x=13, y=1)`, `(x=13, y=13)` — マップ右端
* **座標系:** `x`=列, `y`=行, `map[y][x]` でアクセス
* **移動方向:** `up`→y-1, `down`→y+1, `left`→x-1, `right`→x+1

## 9. 実装上の制約事項

1. **ステートレスなハンドラ:** Socket.io ハンドラは `GameManager` を呼ぶだけ。重い計算をハンドラに書かない。
2. **排他制御:** `GameManager` の状態変更メソッドは必ず per-room `asyncio.Lock` を取得する。
3. **チームバランス:** `join_room` で red/blue の人数を比較し少ない方に割り振る。
4. **再戦非対応:** 「タイトルへ戻る」時にクライアントが `socket.disconnect()` を実行する。サーバー側はルームの残存プレイヤーに `update_state` を送り、全員退室でルームを削除する。
5. **起動コマンド:** `uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000`（`backend/` ディレクトリから実行）
