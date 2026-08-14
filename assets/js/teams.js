/* ==========================================================================
   NOF — Team Configuration (single source of truth)
   --------------------------------------------------------------------------
   新しいチームを追加するときは NOF_TEAMS に 1 ブロック足すだけです。
   キー（= slug）がそのまま販売ページの URL になります。

     NOF_TEAMS["grande"]  ->  /team/grande   （または team.html?team=grande）

   price          … 選手・保護者に表示する販売価格（税込）
   wholesalePrice … NOF 卸価格。購入者画面には絶対に表示しません。
                    販売価格 - 卸価格 = チーム側の差額（内部計算のみ）

   このファイルは assets/data/teams.json と同じ構造です。
   将来 API / 管理画面へ移行する場合は NOF.loadTeams() の実装だけ
   差し替えれば、画面側のコードは変更不要です。
   ========================================================================== */

window.NOF_CONFIG = {
  brand: {
    name: "NO FOOTBALL",
    short: "NOF",
    tagline: "OFFICIAL FIELD GLOVES",
    contactEmail: "order@nofootball.jp",
    contactLine: "@nofootball"
  },

  /* 全チーム共通の商品情報 */
  product: {
    name: "OFFICIAL FIELD GLOVES",
    nameJa: "オリジナル フィールドグローブ",
    material: "ポリエステル / スパンデックス",
    feature: "手のひら側 滑り止め加工",
    defaultWholesalePrice: 1600,
    sizes: [
      { id: "S", label: "S", height: 18,   width: 8,   image: "assets/images/size-s.jpg", hint: "小学校 中学年〜" },
      { id: "M", label: "M", height: 19,   width: 8.5, image: "assets/images/size-m.jpg", hint: "小学校 高学年〜中学生" },
      { id: "L", label: "L", height: 19.5, width: 9,   image: "assets/images/size-l.jpg", hint: "中学生〜大人" }
    ],
    sizeChart: "assets/images/size-chart.jpg"
  },

  /* 配送方法（将来の拡張ポイント） */
  deliveryMethods: [
    { id: "team",       label: "チームまとめ配送", note: "チーム代表者へまとめて発送します。" },
    { id: "individual", label: "個人配送",       note: "ご入力の住所へ個別に発送します。" }
  ],

  /* 注文送信先。null の場合はブラウザ内に保存するデモモードで動作します。 */
  orderEndpoint: null,

  /* true にするとチームページのリンクが /team/<slug> 形式になります。
     サーバー側に rewrite（_redirects / vercel.json / .htaccess）が
     入っている環境で true にしてください。 */
  prettyUrls: false,

  /* 注文番号の接頭辞 */
  orderPrefix: "NOF"
};

window.NOF_TEAMS = {
  /* ---------------------------------------------------------------- GRANDE */
  "grande": {
    slug: "grande",
    teamName: "GRANDE",
    teamNameJa: "グランデ",
    teamNote: "YATSUGATAKE FUTEBOL CLUBE 2001",
    productName: "OFFICIAL FIELD GLOVES",
    price: 2000,
    wholesalePrice: 1600,
    status: "open",
    deadline: "2026-09-30",
    printType: "logo-number",
    print: { font: "anton", numberFont: "anton", scale: "m" },
    description:
      "GRANDEオリジナル フィールドグローブ。\nチームエンブレムと背番号入り。\nトレーニングから試合前まで使えるチーム専用アイテムです。",
    hero: { src: "assets/images/glove-grande.jpg", px: 50, py: 50, z: 1.02 },
    logo: { src: "assets/images/glove-grande.jpg", px: 77.9, py: 54.4, z: 7.2, shape: "circle" },
    gallery: [
      { src: "assets/images/glove-grande.jpg", px: 50,   py: 50,   z: 1.02, alt: "GRANDE オリジナル フィールドグローブ" },
      { src: "assets/images/glove-grande.jpg", px: 92.1, py: 82.5, z: 2.33, alt: "チームエンブレムと背番号" },
      { src: "assets/images/glove-grande.jpg", px: 8.8,  py: 43.9, z: 2.33, alt: "手のひら側 滑り止め加工" },
      { src: "assets/images/photo-gyosei.jpg", px: 50,   py: 50,   z: 1.02, alt: "実物のフィールドグローブ" }
    ]
  },

  /* ------------------------------------------------------------- ALA SERIO */
  "ala-serio": {
    slug: "ala-serio",
    teamName: "ALA SERIO",
    teamNameJa: "アラセリオ",
    teamNote: "MINAMI ALPS · SINCE 2019",
    productName: "OFFICIAL FIELD GLOVES",
    price: 2200,
    wholesalePrice: 1600,
    status: "open",
    deadline: "2026-09-30",
    printType: "logo-number",
    print: { font: "anton", numberFont: "anton", scale: "m" },
    description:
      "ALA SERIOオリジナル フィールドグローブ。\nチームエンブレムと背番号入り。\n練習・ウォーミングアップ・試合前に。",
    hero: { src: "assets/images/glove-alaserio.jpg", px: 100, py: 80.6, z: 2.63 },
    logo: null,
    gallery: [
      { src: "assets/images/glove-alaserio.jpg", px: 100, py: 80.6, z: 2.63, alt: "ALA SERIO エンブレムと背番号" },
      { src: "assets/images/glove-alaserio.jpg", px: 4.8, py: 40.3, z: 2.63, alt: "手のひら側 滑り止め加工" }
    ]
  },

  /* ---------------------------------------------------------------- OWL FC */
  "owl": {
    slug: "owl",
    teamName: "OWL",
    teamNameJa: "アウル",
    teamNote: "OWL FOOTBALL CLUB",
    productName: "OFFICIAL FIELD GLOVES",
    price: 1900,
    wholesalePrice: 1600,
    status: "open",
    deadline: "2026-09-30",
    printType: "name-number",
    print: { font: "archivo", numberFont: "anton", scale: "m" },
    description:
      "OWLオリジナル フィールドグローブ。\nチーム名（白）と背番号入り。\n冬の定番を、チームアイテムに。",
    hero: { src: "assets/images/glove-owl.jpg", px: 100, py: 75, z: 2.5 },
    logo: null,
    gallery: [
      { src: "assets/images/glove-owl.jpg", px: 100, py: 75,   z: 2.5, alt: "OWL チーム名と背番号" },
      { src: "assets/images/glove-owl.jpg", px: 5,   py: 41.7, z: 2.5, alt: "手のひら側 滑り止め加工" }
    ]
  },

  /* --------------------------------------------------- GYOSEI INTERNATIONAL */
  "gyosei": {
    slug: "gyosei",
    teamName: "GYOSEI",
    teamNameJa: "暁星インターナショナル",
    teamNote: "GYOSEI INTERNATIONAL",
    productName: "OFFICIAL FIELD GLOVES",
    price: 2000,
    wholesalePrice: 1600,
    status: "open",
    deadline: "2026-09-30",
    printType: "logo-number",
    print: { font: "anton", numberFont: "anton", scale: "m" },
    description:
      "GYOSEI INTERNATIONALオリジナル フィールドグローブ。\nチームロゴと背番号入り。\nトレーニングから試合前まで。",
    hero: { src: "assets/images/photo-gyosei.jpg", px: 50, py: 50, z: 1.02 },
    logo: { src: "assets/images/photo-gyosei.jpg", px: 68.6, py: 56.8, z: 5.26, shape: "rect", ratio: "3 / 1" },
    gallery: [
      { src: "assets/images/photo-gyosei.jpg", px: 50,   py: 50,   z: 1.02, alt: "GYOSEI INTERNATIONAL フィールドグローブ" },
      { src: "assets/images/photo-gyosei.jpg", px: 71.4, py: 57.1, z: 3.33, alt: "チームロゴと背番号" },
      { src: "assets/images/photo-gyosei.jpg", px: 16.7, py: 41.7, z: 2.5,  alt: "手のひら側 滑り止め加工" }
    ]
  },

  /* ------------------------------------------------------------- SAMPLE FC */
  "sample-fc": {
    slug: "sample-fc",
    teamName: "SAMPLE FC",
    teamNameJa: "サンプルFC",
    teamNote: "DEMO TEAM STORE",
    productName: "OFFICIAL FIELD GLOVES",
    price: 2200,
    wholesalePrice: 1600,
    status: "open",
    deadline: "2026-09-30",
    printType: "name-number",
    print: { font: "graduate", numberFont: "teko", scale: "m" },
    description:
      "SAMPLE FCオリジナル フィールドグローブ。\nチーム名・背番号入り。\nこのページはデモ用のチーム専用ページです。",
    hero: { src: "assets/images/glove-teamfc.jpg", px: 50, py: 50, z: 1.02 },
    logo: null,
    gallery: [
      { src: "assets/images/glove-teamfc.jpg", px: 50,   py: 50,   z: 1.02, alt: "SAMPLE FC オリジナル フィールドグローブ" },
      { src: "assets/images/glove-teamfc.jpg", px: 91.7, py: 63.3, z: 2.5,  alt: "チーム名プリント" },
      { src: "assets/images/glove-teamfc.jpg", px: 8.3,  py: 50,   z: 2.5,  alt: "手のひら側 滑り止め加工" }
    ]
  }
};
