licchecker
===
npm install（もしくはyarn install）でインストールしたライブラリのライセンスの整理をちょっと楽にするために適当に作ったツールです。

[license-checker](https://github.com/davglass/license-checker#readme)とセットで使用します。

使い方
---
まずは、以下のコマンドでlicense-checkerを実行し、元となるライセンス情報ファイルを作成します。
```
$ license-checker --json --customPath ./licenses/format.json --production --out ./licenses/licenses.json
```
上記のコマンドで指定しているformat.jsonは以下の内容となります。
```
{
	"name": "",
	"version": "",
	"description": "",
	"licenses": "",
	"copyright": "",
	"licenseFile": "",
	"licenseText": "",
	"licenseModified": ""
}
```
license-checkerで出力したJSONファイルをlicchecker.jsに読み込ませます。何も指定しない場合は、実行ディレクトリにあるlicenses.jsonが対象となります。実行後に、ライセンス条文等を整理したlicenses_out.jsonが吐き出されます。ライセンスや著作権表記の確認が必要な場合は、その旨が出力されます。
```
$ node licchecker.js
```
他のnodeを使用するアプリケーションの依存ライブラリとして取得し、かつyarnを使用している場合は、以下のコマンドで実行可能です。
```
$ yarn licchecker
```

オプション
---
以下のオプションを指定できます。

|オプション|パラメータ|説明|
|---|---|---|
|-i|ファイルパス|入力ライセンス情報ファイルを指定できます。|
|-o|ファイルパス|出力ライセンス情報ファイルを指定できます。|
|-k|ファイルパス|既知ライセンス情報ファイルを指定できます。|
|--force|なし|エラーがあってもファイル出力を行います。エラーとなった分は出力対象に含まれません。|
|--index|なし|インデックス番号を含めます。|
|--list|なし|連想配列ではなく、リスト形式で出力します。|

オプション指定例
```
$ node licchecker.js -i input.json -o output.json -k knownlicences.json --force --index --list
```

既知ライセンス情報ファイルについて
---
licenses.jsonに著作権表記が含まれていない等、警告が出る場合に、既知ライセンス情報をknown.jsonという名前で作成すると、既知のライブラリについての処理を自動化できます。既知以外のライブラリが追加され、ライセンスや著作権表記の確認が必要になった場合、または既知のライブラリでもバージョンアップ等でライセンスが変更になった場合に、警告を出すことができます。

既知ライセンス情報ファイルの書き方
---
以下のように記載します。
```
{
    "ライブラリ名（licenses.jsonのnameに記載されるもの ※1）": {
        "licenses": "ライセンス種別 ※2",
        "licensesOrigin": "licenses.jsonに記載のライセンス種別 ※3",
        "copyright": "著作権情報",
        "ignore": 出力対象としない場合はtrue、それ以外は定義しないまたはfalse,
        "licenseText": "ライセンス条文"
    }
}
```
※1 同一ライブラリのバージョン違いが含まれ、ライセンスが異なる場合は、アンダースコアとlicensesOriginの内容を付与することが可能です。この場合、当該ライブラリの記述全てに対して同様の指定を行ってください。例：library_MIT

※2 MIT、Apache-2.0、ISC、BSD-2-Clause、BSD-3-Clauseのいずれかを指定することで、licenses.jsonとの表記揺れを吸収できます。それ以外のライセンスの場合はKNOWN_LICENSEと指定します。KNOWN_LICENSEを指定した場合、条文が必要であればlicenseTextを指定してください。ただし、パブリックドメイン等、ライブラリを使用しているという明示が必要ないものであれば、"ignore": trueを指定することで、最終的に生成されるライセンス情報に掲載されないようにすることができます。この場合は、条文の定義は不要です。

※3 licenses.jsonのライセンス種別が配列で記載されている場合は、カンマ区切りで記載します。例：MIT,BSD

ライセンス
---
ライセンスはMITです。商用利用、非商用利用問わずご自由にお使いください。