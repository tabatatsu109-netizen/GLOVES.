/* ==========================================================================
   NOF — 公開サイト共通設定（このファイルはそのまま公開されます）
   --------------------------------------------------------------------------
   ここには「お客様に見せてよい情報」だけを書きます。
   卸価格・仕入価格・掛け率など内部の数字は絶対に入れないでください。

   printInquiryEndpoint … ORIGINAL PRINT の見積もりフォームの送信先。
                          Formspree なら "https://formspree.io/f/xxxxxxxx" の形。
                          空文字のままだとフォームは送信せず、メールでの相談を案内します
                          （「送信しました」と偽って表示することはありません）。
   contactEmail         … 公開用の問い合わせメールアドレス（フォーム送信不可時の案内、フッター等）。
   contactEndpoint      … 公式サイト contact.html のお問い合わせフォーム送信先（Formspree 等）。
                          空文字のままだとフォームは送信せず、メール／BASEのお問い合わせを案内します。
   instagramUrl         … Instagram のURL。
   shopUrl              … BASE オンラインショップのURL。
   siteUrl              … 本番ドメイン（https://〜 、末尾スラッシュなし）。
                          決まったら README の「公開前チェックリスト」に従って OG タグ等も更新してください。
   ========================================================================== */
window.NOF_SITE = {
  siteUrl: "",
  contactEmail: "",
  printInquiryEndpoint: "",
  contactEndpoint: "",
  instagramUrl: "https://www.instagram.com/nofootball_nof/",
  shopUrl: "https://nofootball.base.shop/"
};
