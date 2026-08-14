# NO FOOTBALL（NOF）— OFFICIAL FIELD GLOVES

サッカーチーム向けオリジナルフィールドグローブの
**公式LP + チーム専用注文ページ** です。

HTML / CSS / Vanilla JS のみで動作します（ビルド不要）。

---

## 1. ページ構成

| URL | 内容 |
|---|---|
| `/` （`index.html`） | NOF公式LP |
| `/team/<slug>` （`team.html`） | チーム専用販売ページ → 注文フォーム → 確認 → 完了 |

チーム専用ページは 1 ファイル（`team.html`）で、
URL の slug に応じてチーム名・ロゴ・価格・商品画像が切り替わります。

```
/team/grande      GRANDE      ¥2,000
/team/ala-serio   ALA SERIO   ¥2,200
/team/owl         OWL         ¥1,900
/team/gyosei      GYOSEI      ¥2,000
/team/sample-fc   SAMPLE FC   ¥2,200
```

ローカル確認など rewrite が無い環境では
`team.html?team=grande` の形式でも開けます。

---

## 2. ディレクトリ

```
index.html              NOF公式LP
team.html               チーム専用ページ（商品 / 注文 / 確認 / 完了）
assets/
  css/
    base.css            デザイントークン・共通UI・サイズモーダル
    lp.css              LP専用
    designer.css        デザインシミュレーター
    team.css            チーム専用ページ
  js/
    teams.js            ★ チーム設定（ここだけ触ればチームが増やせます）
    core.js             共通処理（slug解決 / 金額計算 / 注文送信 / スクロール演出）
    sizeguide.js        サイズ表モーダル（LP・チームページ共通）
    lp.js               LPの動き
    designer.js         ★ デザインシミュレーター（フォント・プリント位置の設定）
    team.js             注文フォームのロジック
  data/
    teams.json          teams.js と同内容（将来のAPI/管理画面用スキーマ）
  images/               商品画像・実物写真・サイズ画像（Web用に軽量化したもの）
_redirects              Netlify / Cloudflare Pages 用 rewrite
vercel.json             Vercel 用 rewrite
.htaccess               Apache 用 rewrite
```

---

## 3. チームを追加する

`assets/js/teams.js` の `NOF_TEAMS` に 1 ブロック足すだけです。
**キーがそのまま URL の slug になります。**

```js
"azul": {
  slug: "azul",
  teamName: "AZUL",                 // 大きく出るチーム名
  teamNameJa: "アズール",
  teamNote: "AZUL FOOTBALL CLUB",   // 小さく出るクラブ正式名（任意）
  productName: "OFFICIAL FIELD GLOVES",

  price: 2100,                      // ★ 選手・保護者に表示する販売価格（税込）
  wholesalePrice: 1600,             // ★ NOF卸価格（購入者には絶対に表示しない）

  status: "open",
  deadline: "2026-09-30",           // 注文締切（"9月30日 まで" と表示）
  printType: "logo-number",         // logo-number / name-number / name / logo

  description: "AZULオリジナル フィールドグローブ。\nチームロゴと背番号入り。",

  hero:   { src: "assets/images/azul.jpg", px: 50, py: 50, z: 1.02 },
  logo:   { src: "assets/images/azul-logo.png", px: 50, py: 50, z: 1, shape: "circle" },
  gallery: [
    { src: "assets/images/azul.jpg", px: 50, py: 50, z: 1.02, alt: "商品画像" }
  ]
}
```

これだけで `/team/azul` が有効になります。
存在しない slug を開いた場合は「TEAM NOT FOUND」画面が出ます。

### 価格について

- 購入者画面に出るのは `price` だけです。
- `wholesalePrice` は画面のどこにも表示されません。
- 差額（チーム側の取り分）は注文データの `internal` に入ります。

```json
"totals":   { "quantity": 3, "unitPrice": 2200, "subtotal": 6600 },
"internal": {
  "wholesaleUnitPrice": 1600,
  "wholesaleTotal":     4800,
  "teamMarginUnit":      600,
  "teamMarginTotal":    1800
}
```

「利益」「上乗せ」といった表現は購入者向け画面には一切ありません。

---

## 4. 画像の差し替え

`assets/images/` に置き換えるだけです。
拡大位置は設定値（`px` / `py` / `z`）で調整します。

| 値 | 意味 |
|---|---|
| `px` / `py` | 注目したい位置（画像左上を 0%、右下を 100% とした割合） |
| `z` | ズーム倍率（1 = 等倍。2 なら 2 倍に寄る） |

大きな画像をトリミングして使えるので、
ロゴ部分だけを切り出した画像ファイルを別途つくる必要はありません。

`shape` に `"circle"` を指定すると円形（エンブレム向き）、
`"rect"` + `ratio: "3 / 1"` のように指定すると横長ロゴ向きに表示されます。

### 現在使用している画像

| ファイル | 用途 |
|---|---|
| `glove-grande.jpg` | GRANDE 完成イメージ（ロゴ＋背番号） |
| `glove-alaserio.jpg` | ALA SERIO 完成イメージ |
| `glove-owl.jpg` | OWL 完成イメージ（チーム名＋背番号） |
| `glove-teamfc.jpg` | TEAM FC 完成イメージ（チーム名のみ） |
| `photo-gyosei.jpg` | 実物写真（GYOSEI INTERNATIONAL） |
| `size-s / m / l.jpg` | サイズ画像 |
| `size-chart.jpg` | サイズ比較（4分割） |
| `glove-blank.jpg` | 無地の甲側（デザインシミュレーターの土台） |

`assets/images/` の画像は、ご提供いただいた原本（プロジェクト直下の
`グランデ.png` `アラセリオ様.png` `アウル様手袋完成イメージ.png` `デザイン5.png` 等）を
長辺 1800px の JPEG に変換して読み込みを軽くしたものです。原本はそのまま残しています。

---

## 5. デザインシミュレーター

LP の CUSTOM DESIGN セクション内（`#designer`、ナビの **DESIGN**）にあります。
チーム名・背番号を入れてフォントを選ぶと、その場で完成イメージができ、
**PNG画像として保存**できます。保存した画像をそのまま NOF へ送れば制作を進められる想定です。

| 項目 | 内容 |
|---|---|
| プリント内容 | チーム名＋背番号 / チーム名のみ / 背番号のみ |
| チーム名 | 16文字まで（欧文フォント選択時は自動で大文字に） |
| フォント | 9種（下記） |
| プリント色 | ホワイト / イエロー / ライム |
| 大きさ | S / M / L |

長いチーム名はプリント範囲に収まるよう自動で縮小されます。

### 用意しているフォント

| 表示 | 書体 | 用途イメージ |
|---|---|---|
| BLOCK | Anton | 太い定番 |
| CONDENSED | Bebas Neue | 縦長・ユニフォーム系 |
| GOTHIC | Archivo Black | 太ゴシック |
| SQUARE | Teko | 角ばった書体 |
| COLLEGE | Graduate | カレッジ・大学スポーツ系 |
| SLAB | Alfa Slab One | 極太スラブ |
| STENCIL | Saira Stencil One | ステンシル |
| SPEED | Racing Sans One | イタリック・スピード感 |
| 日本語 | Noto Sans JP 900 | 日本語チーム名用 |

フォントを増やすときは `assets/js/designer.js` の `FONTS` に1行足し、
同ファイル内 `loadFonts()` の Google Fonts URL にファミリーを追記します。

### プリント位置の調整

`assets/js/designer.js` の `POS` で、グローブ画像に対する比率で指定しています。

```js
var POS = {
  name:   { x: 0.43, y: 0.485, maxW: 0.46 },  // 甲のチーム名
  number: { x: 0.40, y: 0.805, maxW: 0.26 }   // カフの背番号
};
```

土台の画像は `assets/images/glove-blank.jpg`（無地の甲側）です。
これはサイズ画像 `size-m.jpg` から採寸用の赤い矢印を除去して作成したものです。
実写の無地グローブ写真をご用意いただければ差し替え可能で、
その場合は `POS` の値だけ合わせ直してください。

---

## 6. 動作するもの

- チームごとの価格切替（slug から `teamConfig` を読み込み）
- サイズ選択（S / M / L の大きなボタン）
- サイズモーダル（「サイズを見る」）
- 背番号入力 → 完成イメージのリアルタイム反映
- 数量変更（− / ＋ / 直接入力）
- リアルタイム金額計算（明細・合計・画面下固定CTA）
- 「＋もう1人追加」による複数選手注文
- 注文者情報・お受け取り方法（チームまとめ配送 / 個人配送）
- 入力チェック → 注文確認画面 → 注文完了画面（注文番号発行）
- デザインシミュレーター（フォント選択・その場でイメージ作成・PNG保存）

決済は含みません。注文内容は下記に保存されます。

---

## 7. 注文データの送信先を変える

`assets/js/teams.js` の `orderEndpoint` を設定すると、
確定時に JSON を POST します。

```js
window.NOF_CONFIG = {
  orderEndpoint: "https://api.example.com/orders",
  ...
}
```

`null` のままだとデモモードとして
ブラウザの `localStorage`（キー `nof.orders`）に保存します。
送信処理は `assets/js/core.js` の `submitOrder()` に集約してあるので、
管理画面や決済を足すときはここだけ差し替えれば画面側の変更は不要です。

---

## 8. ローカルで確認する

ファイルを直接開く場合は `team.html?team=grande` の形式で開きます。
`/team/grande` の形も確認したい場合は簡易サーバーを起動してください。

```bash
python -m http.server 5180
```

`http://localhost:5180/` を開きます。

---

## 9. 公開する

静的ファイルをそのままアップロードするだけです。
`/team/<slug>` を有効にするため、サーバーに応じて次のいずれかを配置します
（このリポジトリには 3 種類とも入っています）。

| サーバー | ファイル |
|---|---|
| Netlify / Cloudflare Pages | `_redirects` |
| Vercel | `vercel.json` |
| Apache（さくら・エックスサーバー等） | `.htaccess` |

rewrite を置けない環境では、共有する URL を
`https://example.com/team.html?team=grande` にすれば同じように動きます。

---

## 10. 今後の拡張ポイント

すでに受け口だけ用意してある箇所です。

- **管理画面** — チーム情報は `NOF_TEAMS` に集約済み。`core.js` の `getTeam()` を API 呼び出しに差し替えるだけで移行できます。
- **決済** — `submitOrder()` の返り値に決済 URL を返して遷移させる想定。
- **配送方法** — `NOF_CONFIG.deliveryMethods` に追加すればボタンが増えます。個人配送を選ぶと住所欄が出ます。
- **受付停止** — チームの `status` を `"open"` 以外にしたときの表示を足す想定。
- **注文集計** — 注文 JSON にチーム slug・サイズ・背番号・内部差額まで入っているので、そのまま集計に使えます。
