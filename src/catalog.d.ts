declare namespace RubicCatalog {
    /**
     * カタログ情報ルート (公式カタログサイトのcatalog.json)
     */
    interface Root {
        /**
         * 対応するRubicのバージョン
         * これを満たさないバージョンのRubic利用者はカタログを更新できず、
         * アップデートを推奨される。
         */
        rubicVersion: string;

        /**
         * このJSONの最終更新時刻 (Date.now()の値)
         */
        lastModified: number;

        /**
         * ボード一覧
         * この配列の順番が原則としてカタログ上の表示順序となる。
         */
        boards: Board[];
    }

    /**
     * 多言語対応文字列 (英語は必須)
     */
    interface LocalizedString {
        en:  string;    /** English (always required) */
        de?: string;    /** German   */
        es?: string;    /** Spanish  */
        fr?: string;    /** French   */
        it?: string;    /** Italian  */
        ja?: string;    /** Japanese */
        ko?: string;    /** Korean   */
        ru?: string;    /** Russian  */
        "zh-cn"?: string;   /** Chinese (China)  */
        "zh-tw"?: string;   /** Chinese (Taiwan) */
    }

    /**
     * ボード定義
     */
    interface Board {
        /**
         * ボードクラス名 (Rubic内部実装と合わせる)
         * (分かりやすさのためCamelCaseで書いているが、実際には
         *  大文字小文字は区別されない)
         */
        class: string;

        /** ボード名称 */
        name: LocalizedString;

        /** 説明文 */
        description: LocalizedString;

        /** 作者名 */
        author: LocalizedString;

        /** WEBサイト URL */
        website: LocalizedString;

        /**
         * ファームウェア一覧
         * この配列の順番が原則としてカタログ上の表示順序となる。
         */
        firmwares: FirmwareLink[];
    }

    /**
     * ファームウェア定義へのリンク
     */
    interface FirmwareLink {
        /** ホスティングサイト */
        host: "github";

        /** 所有者 */
        owner: string;

        /** リポジトリ名 */
        repo: string;

        /** ブランチ名(省略時=master) */
        branch?: string;

        /** キャッシュ情報 */
        cache?: Firmware;
    }

    /**
     * ファームウェア定義
     */
    interface Firmware {
        /**
         * このキャッシュの最終更新時刻 (Date.now()の値)
         */
        lastUpdated: number;   

        /**
         * 説明文(GitHubリポジトリのDescriptionから。英語)
         */
        description: string;

        /**
         * リリース一覧(順序不問。公開日でソートされるため)
         */
        releases: ReleaseInfo[];
    }

    /**
     * リリース定義
     */
    interface ReleaseInfo {
        /** リリースの名称 (GitHubのリリース名称より。英語) */
        name: string;

        /** リリースの説明 (GitHubのリリース説明より。英語) */
        description: string;

        /** プレリリースか否か(省略時=false) */
        prerelease?: boolean;

        /** 公開日 (GitHubのリリース情報 published_at より。ただし値は Date.now() フォーマット) */
        published_at: number;

        /** zip assetのURL */
        url: string;

        /** zipに格納された info.json のキャッシュ */
        data: ReleaseData;
    }

    /**
     * リリースデータ定義
     */
    interface ReleaseData {
        /** リリースの名称 */
        name: LocalizedString;

        /** リリースの説明文 */
        description: LocalizedString;

        /** バリエーション一覧 */
        variations: Variation;
    }

    /**
     * バリエーション定義
     */
    interface Variation {
        /** バリエーションの名前 */
        name: LocalizedString;

        /** バリエーションの説明文 */
        description: LocalizedString;

        /** ランタイムの一覧 */
        runtimes: Runtime.Common[];

        /** アーカイブ(zip)内のパス */
        path: string;
    }

    /**
     * ランタイム情報
     */
    namespace Runtime {
        interface Common {
            /** ランタイムの名前 */
            name: string;
        }
        interface Mruby extends Common {
            /** バージョン(x.x.x) */
            version: string;
        }

        interface Duktape extends Common{
        }
    }
}