
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
