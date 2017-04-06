# Rubic-Catalog

This repository is referenced from Rubic VSCode Extension.

# Japanese (ja)

## 概要

このドキュメントは、[VSCode拡張版Rubic](https://marketplace.visualstudio.com/items?itemName=kimushu.rubic)がサポートするボードの開発者、およびファームウェア開発者向けに、
ファームウェアをRubicに登録する方法を説明するものです。

## カタログの階層構造

カタログは、以下に示す階層構造を持っています。

* ボード (Board) - 組み込みボードの種類

  * リポジトリ (Repository) - ボード毎に用意されたファームウェアの配布元

    * リリース (Release) - 一般公開されたバージョン

      * バリエーション (Variation) - 同一リリース内で、細かな構成の違いを表現するための選択肢。

### ボード (Board)

ボードとは、組み込みボード(ハードウェア)の種類を指します。
各ボードに対する通信・制御プログラムはRubic内に直接実装されていますので、
以下のケースにおいては[issues](https://github.com/kimushu/rubic-vscode/issues)にて問い合わせください。

* 新たなボードの追加
* 既存ボードの名称/説明文変更
* 既存ボードのアイコン(写真)変更
* 既存ボードの通信プロトコル変更 (Rubic側の修正が必要になるもの)
* 既存ボードの廃止

### リポジトリ (Repository)

ボードの中には、ボードの制御やRubicユーザーが作成したプログラムを制御するためのソフトウェア(ファームウェアと呼ばれます)を書き込んで利用します。
Rubicユーザーが作成するプログラムそのものとファームウェアは原則として異なります(※)ので混同しないようご注意ください。
※ただし、ユーザーのプログラム＋制御部をまとめてビルドしてファームウェアとして書き込むタイプの場合を除きます。(例: Arduino)

これらのファームウェアはボード毎、提供する機能毎に用意され、リポジトリと呼ばれる単位の配布元から提供されます。
現時点ではリポジトリを配置するホストとしてGitHubに対応しています。

各ボードに対して、対応するファームウェアを提供するリポジトリの一覧はRubicオーナーが管理しています。
以下のケースにおいては[issues](https://github.com/kimushu/rubic-vscode/issues)にて問い合わせください。

* カタログへのリポジトリ追加
* リポジトリの所有者/リポジトリ名/ブランチ等の変更
* カタログからのリポジトリ削除

### リリース (Release)

リリースとは、Rubicユーザー向けに公開されたバージョンを指します。
Rubicカタログでは、GitHubのリリース機構を利用します。
ファームウェア開発者は、GitHub上で新しいReleaseを作成することで、自由に新しいリリースを作成できます。
(リリースの削除も出来ますが、原則として推奨しません。)

### バリエーション (Variation)

バリエーションとは、構成の違いや同系統シリーズボードにおけるボード差を表現するための分類です。
バリエーションは各リリースに添付される情報ファイルに記述されており、ファームウェア開発者が自由に設定できます。

### 例

* ボード : GR-CITRUS

  * リポジトリ : Wakayama.rb Ruby Board V2 library firmware

    * リリース : 2.19(2016/11/19)

      * バリエーション : Standard (最小限mrbgemsのみ)
      * バリエーション : For MIKAN (ネット関連mrbgems入り)

## カタログの内部構造

この節では、先述の階層構造に基づく内部構造を説明します。
なお、JSONデータの構造については以下にインターフェース定義があります。

* TypeScriptインターフェースによる定義
  * [catalog.d.ts](https://github.com/kimushu/rubic-vscode/blob/master/schema/catalog.d.ts)
* JSONスキーマによる定義
  * [catalog.schema.json](https://github.com/kimushu/rubic-vscode/blob/master/schema/catalog.schema.json)

※複数の定義がありますが、どれも定義している内容自体は同一であり、表記方法のみが異なります。

### カタログキャッシュルート (catalog.json)

[https://github.com/kimushu/rubic-catalog/blob/vscode-master/catalog.json](https://github.com/kimushu/rubic-catalog/blob/vscode-master/catalog.json)

* TypeScript interface: RubicCatalog.Root

* Rubicが一定時間ごとに参照する、カタログの全データ(※各リリースのバイナリを除く)を記述したJSONファイルです。
このファイルは、毎日未明(日本時間)に、後述のカタログテンプレートをベースとして全Releaseをスキャンして再構築され、コミットされます。

* Rubicオーナーだけが変更できます。

### カタログテンプレート (template.json)

[https://github.com/kimushu/rubic-catalog/blob/vscode-master/template.json](https://github.com/kimushu/rubic-catalog/blob/vscode-master/template.json)

* TypeScript interface: RubicCatalog.Root

* catalog.jsonの更新に使用されるベースとなる情報を記述したJSONファイルです。ボードの名称等の情報、各ファームウェアの参照先等を含みます。

* Rubicオーナーだけが変更できます。

### リポジトリ情報 (rubic-repository.json)

例: [https://github.com/kimushu/rubic-firmware-sample/blob/v0.2/rubic-repository.json](https://github.com/kimushu/rubic-firmware-sample/blob/v0.2/rubic-repository.json)

* TypeScript interface: RubicCatalog.RepositoryDetail

* リポジトリで提供するファームウェアの名前や説明文を記述したJSONファイルです。

* ファームウェア開発者が変更できます。

* :star: [https://github.com/kimushu/rubic-firmware-sample](https://github.com/kimushu/rubic-firmware-sample) に、ファームウェア格納リポジトリのサンプルがあります。参考にしてください。

### リリース一覧

先述の通り、[GitHubのRelease機能](https://help.github.com/articles/creating-releases/)を用います。

* Tag version: Git上で作成したtag名称を付けます。Rubicがリリースを区別する識別子として使われますので、一度一般公開したReleaseのtag名称を変更しないでください。

* Release title: このリリースの名前を英語で指定します。後述のrelease.jsonに名前を指定してある場合、省略可能です。

* Describe this release: このリリースの説明文を英語で指定します。後述のrelease.jsonに説明文を指定してある場合、省略可能です。

* Attach binaries: 後述のリリースデータアーカイブを1つ登録してください。(ファイル名は任意)

* This is a pre-release: ここにチェックをつけると、Rubic上では「プレビュー版」扱いとなります。

なお、draft状態のリリースはRubicカタログに掲載されません。公開する場合はPublish releaseしてください。

### リリースデータアーカイブ

各リリースの詳細情報や、ボードに転送するプログラムのバイナリデータをまとめた圧縮ファイルです。使用可能な圧縮方式は zip, tar.gz, tar.bz2 です。

このアーカイブは、以下のファイルを含みます。

* release.json - [必須] このリリースの詳細を記述したJSONファイル
* xxxxx.xxx - [任意] ボードに転送するプログラムのバイナリデータなど
* :

### リリース詳細情報 (release.json)

例: [https://github.com/kimushu/rubic-firmware-sample/blob/v0.1/release.json](https://github.com/kimushu/rubic-firmware-sample/blob/v0.1/release.json)

* TypeScript interface: RubicCatalog.ReleaseDetail
* TypeScript interface: RubicCatalog.Variation

* リリースの詳細を記述したJSONファイルです。リリースの名前・説明や、格納されたバリエーションの一覧、バリエーションの名前・説明、プログラミング言語の対応状況などを記述します。
* 詳細はTypeScript interface定義を参照してください。

# English (en)

Under construction..., sorry.
