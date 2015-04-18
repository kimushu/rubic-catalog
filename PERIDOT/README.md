# PERIDOT用Rubicファームウェア
## 準備
RBF-WRITERを用いて、このフォルダにある plain\_plain\_epcs4\_auto.rpd をPERIDOTボードに書き込んでおいてください。
この操作は各ボードにつき一回のみで十分です。RBF-WRITERでは、rbfファイルだけでなくrpdファイルも直接扱えますので、
上記のファイルを直接ドラッグ＆ドロップすれば書き込みできます。

## 開発の手順
1. PERIDOTボードのスイッチをAS側にして、PCに接続する。
2. Rubicを起動し、既存のスケッチを開くか、新しいスケッチを書く。
3. Rubic画面下のボード画面から「PERIDOT」と「COMxx」を選択し、RUNをクリックする。

## 対応バージョン
- ハードウェア(PERIDOTボード) : 1.1 (1.0でもおそらく動作しますが、未確認です)
- 開発ソフトウェア(Rubic) : 0.1.0

## mrubyバージョン
- mruby 1.1.0 (RITE0003)

## 生成元情報
- Path: https://github.com/kimushu/peridot/tree/feature/rubic/fpga/peridot\_rubic
- Commit: c8ff38c2d7114918472f6f019174748730fdea38

