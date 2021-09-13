# ローカルのUSIエンジンで中継サイトの棋譜を探索するChrome拡張

![スクリーンショット](screenshot.jpg)

.kifフォーマットで中継を行なっているサイト(具体的には日本将棋連盟の棋譜中継ページ)をアクセスすると、形勢バーが表示され、形勢バーの右隣のボタンをクリックするとローカルのUSIエンジンが起動して棋譜を探索し形勢バーに現在の局面の形勢を反映させます。
(注：Kifu for JSの設定で「駒音」を有効にしてください。「駒音」を使って局面の更新を検知しています)

# インストール
+ Chrome拡張をインストール
+ Native Messaging Hostをインストール

# TODO
- 推奨手の表示の改善(将棋版論理モデルの実装)
- 棋譜の更新がなくても局面を変えるとバックグラウンドで棋譜をロードしてしまう無駄をなくす
