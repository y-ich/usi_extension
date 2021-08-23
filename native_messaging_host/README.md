# AobaZero Native Messaging Host

## 中身

aobaz.pyはAobaZeroをnative messaging protocolに対応させるスクリプトです。

com.new3rs.aobazero.jsonはAobaZero Native Messaging Hostのマニフェストファイルです。

## インストール

+ 先にChrome拡張をインストールしてChrome拡張のIDを取得する
+ USIエンジン(ex. aobaz)を用意する
+ aobaz.pyの中にUSIエンジンを起動するCLIの記述があるのでそこをUSIエンジンの状況に応じて変更する
+ com.new3rs.aobazero.jsonの名前、path,allowed_originsを適切に変更する
+ 上で変更した.jsonを所定の位置にコピーする
所定の位置については[Native Messaging](https://developer.chrome.com/docs/apps/nativeMessaging/)を参照。

