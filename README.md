# NO FOOTBALL（NOF）— 公式サイト / フィールドグローブ / オリジナルプリント

フットボールアパレルブランド NO FOOTBALL（NOF）の
**公式サイト + フィールドグローブLP + チーム専用注文ページ + オリジナルプリント** です。

HTML / CSS / Vanilla JS のみで動作します（ビルド不要）。

---

## 1. ページ構成

| URL | 内容 |
|---|---|
| `/` （`index.html`） | **公式サイト トップ**（メインビジュアル / NEWS帯 / 事業カテゴリー / チームオーダー / お知らせ / お問い合わせ） |
| `/about.html` | ブランド情報（理念・メッセージ・ブランド概要・取り組み） |
| `/products.html` | NOF ORIGINAL 商品一覧（BASE の商品へリンク） |
| `/gallery.html` | ギャラリー（アイテム / チームオーダー事例 / Instagram） |
| `/news.html` | お知らせ一覧 |
| `/contact.html` | お問い合わせフォーム |
| `/gloves.html` | フィールドグローブLP（旧 `index.html`） |
| `/team/<slug>` （`team.html`） | チーム専用販売ページ → 注文フォーム → 確認 → 完了 |
| `/オリジナルプリント/`（`オリジナルプリント/index.html`） | ORIGINAL PRINT LP（Tシャツ・パーカー等7商品） |
| `/オリジナルプリント/design.html` | デザインシミュレーター（素材・カラー・プリント位置・見積もり） |

### 公式サイト（`index.html` ほか）の編集ポイント

| 変更したいこと | 触るファイル |
|---|---|
| お知らせを追加する | `assets/js/news-data.js` の配列の先頭に1件足す（トップには最新3件、`news.html` には全件） |
| NOF ORIGINAL の商品を増やす・価格/在庫を直す | `assets/js/shop-items.js` を編集し、画像を `assets/images/hp/items/<id>.jpg`（正方形 640px）に置く |
| ショップ・Instagram のURL / 問い合わせメール / フォーム送信先 | `assets/js/site-config.js`（`shopUrl` / `instagramUrl` / `contactEmail` / `contactEndpoint`） |
| ヘッダー・フッターのメニュー | 各 HTML の `<nav class="hp-nav">`（全ページ共通なので同じ内容に揃えてください） |
| メインビジュアルの写真・コピー | `index.html` の `<section class="mv">`（画像は `assets/images/hp/hero-0X.jpg`） |
| 事業カテゴリー4枚のカード | `index.html` の `.cat-list`（画像は `assets/images/hp/cat-*.jpg`） |
| デザイン（色・余白） | `assets/css/hp.css`（公式サイト専用。LP側の `base.css` / `lp.css` とは独立） |

**お問い合わせフォーム**は `contactEndpoint`（Formspree 等のPOST先）が空のままだと送信せず、
メール（`contactEmail` 設定時）または BASE のお問い合わせフォームを案内します。
「送信しました」と偽って表示することはありません。

`about.html` と `tokusho.html` の **【要記入】** 箇所（所在地・運営者名・代表者名など）は公開前に埋めてください。

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
index.html              公式サイト トップ
about.html / products.html / gallery.html / news.html / contact.html
                        公式サイト 下層ページ
gloves.html             フィールドグローブLP
team.html               チーム専用ページ（商品 / 注文 / 確認 / 完了）
assets/
  css/
    hp.css              公式サイト専用（ヘッダー / MV / 帯 / カード / 下層ページ）
    base.css            デザイントークン・共通UI・サイズモーダル
    lp.css              LP専用
    designer.css        デザインシミュレーター
    team.css            チーム専用ページ
  js/
    hp.js               公式サイトの動き（固定ヘッダー / スライダー / お知らせ描画 / フォーム）
    news-data.js        ★ お知らせデータ
    shop-items.js       ★ NOF ORIGINAL 商品一覧データ
    site-config.js      公開用の共通設定（URL・メール・フォーム送信先）
    teams.js            ★ チーム設定（ここだけ触ればチームが増やせます）
    core.js             共通処理（slug解決 / 金額計算 / 注文送信 / ★プリント仕様 NOF.print）
    sizeguide.js        サイズ表モーダル（LP・チームページ共通）
    lp.js               LPの動き
    designer.js         デザインシミュレーターの操作
    team.js             注文フォームのロジック
  images/               商品画像・実物写真・サイズ画像（Web用に軽量化したもの）
  images/hp/            公式サイト用（ロゴ / メインビジュアル / カテゴリー / 商品サムネイル items/）
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
| `glove-blank.png` | 無地の甲側・背景透過（デザインシミュレーターの土台） |

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
| チーム名 | 16文字まで（自動で大文字に） |
| チーム名のフォント | 9種（下記） |
| 背番号のフォント | 4種（BLOCK / CONDENSED / SQUARE / SPEED）から選択 |
| プリント色 | ホワイトのみ |
| 大きさ | S / M / L |

長いチーム名はプリント範囲に収まるよう自動で縮小されます。

### 用意しているフォント

プリントは**カッティング（切り文字）**のため、線が細い書体・
ステンシル・装飾の多い書体は入れていません。すべて塗りが太く単純な書体です。

| 表示 | 書体 | 用途イメージ | 背番号 |
|---|---|---|---|
| BLOCK | Anton | 太い定番 | ○ |
| CONDENSED | Bebas Neue | 縦長・ユニフォーム系 | ○ |
| GOTHIC | Archivo Black | 太ゴシック | |
| SQUARE | Teko | 角ばった書体 | ○ |
| TECH | Russo One | スクエア系・メカニカル | |
| COLLEGE | Graduate | カレッジ・大学スポーツ系 | |
| SLAB | Alfa Slab One | 極太スラブ | |
| HEAVY | Bowlby One | 極太ブロック | |
| SPEED | Racing Sans One | イタリック・スピード感 | ○ |

フォントを増やすときは `assets/js/designer.js` の `FONTS` に1行足し、
同ファイル内 `loadFonts()` の Google Fonts URL にファミリーを追記します。
背番号にも使えるようにする場合は `NUMBER_FONT_IDS` に id を追加します。

### プリント位置の調整（LP・チームページ共通）

**シミュレーターとチーム専用ページのプレビューは同じ仕組みで描いています。**
書体・プリント位置・色は `assets/js/core.js` の `NOF.print` に集約してあるので、
**片方だけ表示がズレることはありません。**

```js
POS: {
  name:   { x: 0.510, y: 0.535, maxW: 0.45 },  // 甲のチーム名
  number: { x: 0.520, y: 0.855, maxW: 0.27 },  // カフの背番号
  logo:   { x: 0.510, y: 0.520, maxW: 0.30 }   // 甲のチームロゴ
}
```

土台の画像は `assets/images/glove-blank.png`（無地の甲側・**背景透過**）です。
サイズ画像 `size-m.jpg` から採寸用の赤い矢印を除去し、背景を切り抜いて作成しました。
実写の無地グローブ写真をご用意いただければ差し替え可能で、
その場合は `POS` の値だけ合わせ直せば両方の画面に反映されます。

### チームごとの書体（任意）

`teams.js` の各チームに `print` を足すと、プレビューがそのチームの実物に近づきます。
省略した場合は BLOCK（Anton）・中サイズになります。

```js
print: { font: "archivo", numberFont: "anton", scale: "m" },
printName: "GRANDE"   // 実際に切る文字がチーム名と違う場合のみ
```

### プリント内容（printType）の扱い

`printType` は `logo-number` / `logo` / `name-number` / `name` / `number` の5種類で、
`core.js` の `TYPES` が唯一の定義です。

**ロゴ指定なのに `logo` が未設定のチームは、自動で文字表示に切り替わります。**
仕様欄の表示も切り替え後の内容から生成するため、
「仕様欄はロゴなのにプレビューは文字」といった食い違いは起きません。

---

## 6. 動作するもの

- チームごとの価格切替（slug から `teamConfig` を読み込み）
- サイズ選択（S / M / L の大きなボタン）
- サイズモーダル（「サイズを見る」）
- 背番号入力 → 完成イメージのリアルタイム反映
- 数量変更（− / ＋ / 直接入力）
- リアルタイム金額計算（明細・合計・画面下固定CTA）
- 「＋もう1人追加」による複数選手注文
- 注文者情報・お受け取り方法
- 入力チェック → 注文確認画面 → 注文完了画面（注文番号発行）
- デザインシミュレーター（チーム名／背番号のフォント選択・その場でイメージ作成・PNG保存）

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

> **注意:** これはグローブ（team.html）の注文の話です。ORIGINAL PRINT の見積もりフォームは
> `teams.js` を読み込まず（卸価格が入っているため）、`assets/js/site-config.js` の
> `printInquiryEndpoint` を使います。→ [11. 見積もり依頼の送信](#見積もり依頼の送信)

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

### 公開してはいけないもの

静的ホスティングはリポジトリ内のファイルがそのまま URL で取れるため、
内部資料は `.gitignore`（Git に入れない）と `.vercelignore`（Vercel に送らない）の両方で除外しています。

| 除外しているもの | 理由 |
|---|---|
| `素材/`、ルート直下の `*.png` `*.jpg` `*.pdf` | 仕入先の商品写真原本・お客様名入りの支給素材・仕入価格表 |
| `tools/` | `build_catalog.py` に仕入価格と掛け率が書かれている |
| `README.md`、`.claude/` | 内部ドキュメント・開発用設定 |

`assets/js/teams.js` の `wholesalePrice` は画面には出しませんが、JS ファイル自体は
誰でも読めるため厳密には「非公開」ではありません。公開後に問題になるようなら、
`price` だけをJSに残し、卸価格は手元の管理表に移すことを検討してください。

### 公開前チェックリスト

1. `assets/js/site-config.js` に `contactEmail`（公開用メール）と `printInquiryEndpoint`（Formspree のフォームURL）を入れる
2. `tokusho.html` の `【要記入】`（事業者名・代表者・所在地・電話・メール・支払方法・納期）をすべて埋める（`class="todo"` の黄色いハイライトが目印）
3. 本番ドメインが決まったら、`site-config.js` の `siteUrl` を入れ、各HTMLの `og:image` を `https://ドメイン/assets/images/...` の絶対URLに直す（SNS・LINE のリンクプレビューは相対パスを解決できない）
4. `python -m http.server 5180` で `index.html` → `オリジナルプリント/` → `design.html` の導線と、フォームからテスト送信してメールが届くことを確認する
5. `git status` で `素材/` `tools/` `*.pdf` が出てこないことを確認してから push する

---

## 10. 今後の拡張ポイント

すでに受け口だけ用意してある箇所です。

- **管理画面** — チーム情報は `NOF_TEAMS` に集約済み。`core.js` の `getTeam()` を API 呼び出しに差し替えるだけで移行できます。
- **決済** — `submitOrder()` の返り値に決済 URL を返して遷移させる想定。
- **配送方法** — `NOF_CONFIG.deliveryMethods` に追加すれば選択ボタンが自動で出ます（現在は1つなので選択UIなし）。
- **受付停止** — チームの `status` は受け口だけ用意した未使用フィールドです。締切は表示のみで注文は止めません。
- **注文集計** — 注文 JSON にチーム slug・サイズ・背番号・内部差額まで入っているので、そのまま集計に使えます。

---

## 11. ORIGINAL PRINT（LP + デザインシミュレーター）

`オリジナルプリント/` は、グローブとは別ラインの「Tシャツ・パーカーへのオリジナルプリント」を紹介するLPと、
見積もりシミュレーターの2ページ構成です。`base.css` / `lp.css` / `designer.css` を再利用しているため、
見た目はグローブのLPと共通です。

| URL | 内容 |
|---|---|
| `オリジナルプリント/index.html` | LP（商品紹介・実績ギャラリー・シミュレーターへの導線） |
| `オリジナルプリント/design.html` | デザインシミュレーター本体（素材・カラー・プリント位置・画像配置・見積もり） |

```
オリジナルプリント/
  index.html               ORIGINAL PRINT LP
  design.html               デザインシミュレーター(専用ページ)
tokusho.html                特定商取引法に基づく表記(サイト共通・要記入箇所あり)
privacy.html                プライバシーポリシー(サイト共通)
素材/                       ★ 商品写真の原本(前面/背面)。ここに追加してビルドスクリプトを実行するだけ(Git管理外)
tools/build_catalog.py      ★ 素材/ → assets/images/catalog/ + print-catalog.js を生成するスクリプト(Git管理外)
assets/
  css/print.css             シミュレーター専用のスタイル(アコーディオン・位置プリセット等)
  css/legal.css             法務ページのスタイル
  js/site-config.js         ★ 公開用設定(問い合わせメール・フォーム送信先・本番URL)
  js/print-catalog.js       自動生成: 商品・カラー・プリント位置プリセット・写真パスの一覧(手で編集しない)
  js/design.js               シミュレーターのロジック(価格計算・背景自動削除・PNG保存・送信)
  images/catalog/            自動生成: 軽量化した商品写真
  images/print-*.jpg         LP側(ヒーロー・実績ギャラリー等)で使う実績写真
```

### 商品・カラーを追加する（写真ベース）

1. `素材/` に商品フォルダを追加し、`{商品コード6桁}-{カラーコード}-{タグ2桁}-front/back....jpg` の命名で前面・背面の写真を入れる
   （現状 7商品・133色が登録済み。仕入先カタログの命名規則にそのまま対応しています）
2. 新しい商品コードの場合は `tools/build_catalog.py` の `PRODUCT_META` / `KIND_BY_PRODUCT` に1行追加
   （商品名・本体価格・生地系統(tee/hoodie)を指定）
3. `python tools/build_catalog.py` を実行する

これだけで、写真の軽量化・カラー(色名は写真から自動推定)・`print-catalog.js` の再生成まで自動で行われます。
**`assets/js/print-catalog.js` は自動生成ファイルなので直接編集しないでください**（再実行で上書きされます）。

カラー名は写真から近似的に自動推定したものです（スウォッチの色そのものは実写から正確にサンプリングしているので見た目は正確です）。
正式なカラー名の対応表がある場合は、`print-catalog.js` 生成後に該当箇所の `name` を直接書き換えても問題ありません（次回ビルドまでは保持されます）。

### プリント位置プリセット

左胸・右胸・胸中央・背中中央の4種類（`tools/build_catalog.py` の `POS_BY_KIND`）。
サイズは 左胸/右胸=10×10cm、胸中央/背中中央=35.5×40cm を基準にしています。
選んだプリセットは配置の出発点で、プレビュー上で自由にドラッグして動かせます（サイズはプリセットの100%が上限）。

**生地の系統(kind)ごとに位置が違います**（`POS_BY_KIND` に `tee` / `sweat` / `hoodie` の3系統）。
パーカーは写真上部の約35%をフードが占めるため、Tシャツ・スウェットよりプリント位置をかなり下げています。
新しい商品を追加したときに位置がズレる場合は、対象商品の実写を見て `KIND_BY_PRODUCT` の割り当て（またはどの系統にも当てはまらなければ新しい系統）を見直してください。

### NOFロゴを入れる

「③ NOFロゴを入れる」で、公式ロゴをテンプレート的に配置できます。

- 前面は右胸/左胸のいずれか一方のみ、背面は背中中央のみ（`assets/js/design.js` の `NOF_FRONT_POSITIONS` / `NOF_BACK_POSITION`）
- 生地の色(tone)に応じて `assets/images/nof-logo-black.png` / `nof-logo-white.png` を自動で切り替え
- 位置はカスタムデザインと同様にプレビュー上でドラッグして調整でき、サイズも基準値の±25%(`assets/js/design.js` の `NOF_SCALE_RANGE`)の範囲でスライダー調整できます（「位置をリセット」で `POS_BY_KIND` の既定位置に戻せます）。通常のプリントと同様に数量帯・複数箇所割引の対象になります
- NOFロゴを置いた位置は、④のプリント位置選択では「使用中」表示になり、カスタムデザインを重ねて置けないようにしています

ロゴ画像を差し替える場合は `assets/images/nof-logo-black.png` / `nof-logo-white.png` を同名で上書きしてください。

### 価格の変更

- **数量帯・複数箇所割引・プリント単価** → `assets/js/design.js` 先頭の `PRICING` を編集
  - 1〜19枚（配列の先頭3要素）は少量対応の手間を見込んで 20枚以降より高めに設定してあります
- **本体価格(商品代)** → `tools/build_catalog.py` の `PRODUCT_META[].base` を編集して再実行
  - 7商品すべて、ユナイテッドアスレの仕入価格表（2026年8月版）を基準に決めた確定価格です（`baseSource: "real"`）
  - 掛け率の考え方は `build_catalog.py` のコメントにあります。仕入価格が改定されたら該当行を直して再実行するだけです
  - 素材フォルダ `半袖ドライ5900-01` の写真ファイル名は `508801-…` ですが、これはファイル名の入力ミスで、実際の仕入品番は 5900-01 です（スクリプト内のキーはファイル名に合わせて `508801` のままにしてあります）

### 背景の自動削除

デザイン画像をアップロードすると、`design.html` が読み込んでいるブラウザ内AI
（[`@imgly/background-removal`](https://github.com/imgly/background-removal-js)、CDN配信・無料・サーバー不要）で背景を自動的に透明化します。
初回は数秒〜十数秒かかります（モデルのダウンロードと推論のため）。うまく動かない・重い場合に備えて、
白/単色背景向けの簡易フラッドフィル処理に自動でフォールバックする作りになっています。
各プリント位置に「背景を自動で削除」のチェックがあり、外せば元画像のまま使えます。

### 見積もり依頼の送信

「この内容で問い合わせる」は `assets/js/site-config.js` の `printInquiryEndpoint` に JSON を POST します
（[Formspree](https://formspree.io/) のフォームURL `https://formspree.io/f/xxxxxxxx` を想定。
入力内容は「受付番号／お名前／連絡先／商品／カラー／数量／プリント位置／概算／ご要望」の読める形で送られ、
連絡先がメールアドレスなら返信先(`_replyto`)にも入ります）。

`printInquiryEndpoint` が空の間は **送信せず**、「準備中なのでメールで相談してください」と表示します
（以前のように `localStorage` に保存して「送信しました」と出すことはしません）。
`contactEmail` を入れておくと、フォーム下に「メールで相談する」ボタンと、フッターに連絡先が出ます。
このボタンは押した時点の見積もり内容を本文に入れた `mailto:` を開くので、Formspree を使わない運用でも成立します。

送信先を Formspree 以外（自前API等）にする場合は、`design.js` の `postInquiry()` を差し替えてください。

### PNG保存

「この画像を保存」は `designer.js` と同じ考え方で、Canvas 上に商品写真＋アップロード画像(背景削除後)を合成してPNG書き出しします。
保存した画像を、見積もりフォームでのお問い合わせ時に担当者へ送ってもらう想定です（画像そのものはサーバーに送信していません）。
