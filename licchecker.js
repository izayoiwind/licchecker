#!/usr/bin/env node

/*
 * Copyright (c) 2019-2020 Harukanagi (@izayoiwind).
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs')
const argv = process.argv
let inputFile = './licenses.json'
let outputFile = './licenses_out.json'
let knownFile = './known.json'

/** ライセンス条文 */
licenseTemplateTextDictionary = {}

/**
 * コンソールに警告を出力する。（黄文字）
 * @param {*} string 出力する文字列
 */
const outputConsoleWarning = (string) => {
    console.log(`\u001b[33m${string}\u001b[0m`)
}

/**
 * コンソールにエラーを出力する。（赤文字）
 * @param {*} string 出力する文字列
 */
const outputConsoleError = (string) => {
    console.log(`\u001b[31m${string}\u001b[0m`)
}

/**
 * コマンドライン引数の-付きオプションを確認する。
 * @param {*} inArgv コマンドライン引数の配列
 * @param {*} inIndex オプションを検出したインデックス
 * @returns オプションの値
 */
const getOptionArgv = (inArgv, inIndex) => {
    if (inArgv.length <= inIndex + 1) {
        throw new Error()
    }
    return inArgv[inIndex + 1]
}

/**
 * 著作権表記のエラーメッセージを出力する。
 * @param {*} key ライブラリのキー
 * @param {*} licenseType ライセンス種別
 */
const outputCopyrightError = (key, licenseType) => {
    console.log(`${key}：著作権表記を確認してください。（${licenseType}）`)
}

/**
 * ライセンス要確認のエラーメッセージを出力する。
 * @param {*} key ライブラリのキー
 * @param {*} licenseType ライセンス種別
 */
const outputLicenseError = (key, licenseType) => {
    outputConsoleError(`${key}：ライセンスを確認してください。（${licenseType}）`)
}

/**
 * 既知ライセンス情報条文エラーのエラーメッセージを出力する。
 * @param {*} key ライブラリのキー
 */
const outputKnownLicenseTextError = (key) => {
    outputConsoleError(`${key}：既知ライセンス情報に条文がありません。出力の必要がない場合は"ignore": trueを追加してください。`)
}

/**
 * 著作権情報から、ライセンス条文を生成する。
 * @param {*} licTemplateFileText ライセンス条文テンプレート
 * @param {*} copyright 著作権情報
 */
const generateLicenseText = (licTemplateFileText, copyright) => {
    return !!copyright ? licTemplateFileText.replace('%%%COPYRIGHT%%%', copyright) : ''
}

/**
 * ライセンステンプレートファイルを読み込む。
 */
const readLicenseTemplateFile = () => {
    try {
        licenseTemplateTextDictionary['MIT'] = fs.readFileSync(`${__dirname}/lictexts/mit.txt`, 'utf8')
        licenseTemplateTextDictionary['Apache-2.0'] = fs.readFileSync(`${__dirname}/lictexts/apache20.txt`, 'utf8')
        licenseTemplateTextDictionary['ISC'] = fs.readFileSync(`${__dirname}/lictexts/isc.txt`, 'utf8')
        licenseTemplateTextDictionary['BSD-2-Clause'] = fs.readFileSync(`${__dirname}/lictexts/bsd2clause.txt`, 'utf8')
        licenseTemplateTextDictionary['BSD-3-Clause'] = fs.readFileSync(`${__dirname}/lictexts/bsd3clause.txt`, 'utf8')
    } catch (e) {
        throw new Error('ライセンステンプレートファイルが存在しません。')
    }
}

/**
 * ライセンス情報ファイルを読み込む。
 * @param {*} inputFile ファイル名
 * @returns ライセンス情報
 */
const readLicenseFile = (inputFile) => {
    try {
        fs.statSync(inputFile)
        return JSON.parse(fs.readFileSync(inputFile, 'utf8'))
    } catch (e) {
        throw new Error('元となるライセンス情報ファイルが存在しない、または不正です。licenses.jsonという名前で配置するか、-iオプションでファイル名を指定してください。')
    }
}

/**
 * 既知ライセンス情報ファイルを読み込む。
 * @param {*} knownFile ファイル名
 */
const readKnownLicenseFile = (knownFile) => {
    try {
        fs.statSync(knownFile)
        return JSON.parse(fs.readFileSync(knownFile, 'utf8'))
    } catch (error) {
        // 既知ライブラリ情報ファイルが無い場合は何もしない。  
        return {}
    }
}

// このフラグがtrueの場合、エラーがあったとしてもファイルの出力を行う。
// エラーがあったものについては出力対象にならない。
let ignoreCheckError = false
let isList = false
let isOutputIndex = false

// コマンドラインオプション取得
try {
    argv.forEach((value, index) => {
        if (value === '-i') {
            inputFile = getOptionArgv(argv, index)
        } else if (value === '-o') {
            outputFile = getOptionArgv(argv, index)
        } else if (value === '-k') {
            knownFile = getOptionArgv(argv, index)
        } else if (value === '--force') {
            ignoreCheckError = true
        } else if (value === '--list') {
            isList = true
        } else if (value === '--index') {
            isOutputIndex = true
        }
    })
} catch (e) {
    console.error('オプションの指定が不正です。')
    process.exit(1)
}

/** エラーカウント */
let errorCount = 0

try {
    // ライセンステンプレートファイルを読み込む。
    readLicenseTemplateFile()
    // 既知ライブラリ情報ファイルを読み込む。
    const knownLicensesDictionary = readKnownLicenseFile(knownFile)
    // ライセンス情報ファイルを読み込む。
    const inputLicensesDictionary = readLicenseFile(inputFile)
    const newLicensesDictionary = {}
    let index = 0
    for (inputLicensesKey in inputLicensesDictionary) {
        let inputLicensesData = inputLicensesDictionary[inputLicensesKey]
        if (!inputLicensesData.name || !inputLicensesData.version) {
            console.log(`${inputLicensesKey}：名前またはバージョンがありません。`)
            errorCount++
            continue
        }
        if (inputLicensesData.private) {
            // privateの場合は出力対象にしない。
            continue
        }
        const name = inputLicensesData.name
        const version = inputLicensesData.version
        const inputDataLicenseType = inputLicensesData.licenses
        let copyright = inputLicensesData.copyright
        let licenseType = inputLicensesData.licenses
        // ライセンスファイルのスペルが2種類存在するので、両方とも処理対象に含める。
        let licenseText = inputLicensesData.licenseFile.match(/LICENSE/ig) || inputLicensesData.licenseFile.match(/LICENCE/ig) ? inputLicensesData.licenseText : null
        // 既知ライセンス情報が存在する場合は取得する。
        let knownLicensesData = knownLicensesDictionary[name]
        if (!knownLicensesData) {
            // 既知ライセンス情報が見つからない場合、ライセンス種別を付加しもう一度チェックする。
            knownLicensesData = knownLicensesDictionary[`${name}_${licenseType}`]
        }
        if (!!knownLicensesData && licenseType === knownLicensesData.licensesOrigin) {
            // 既知ライセンス情報に存在し、かつlicensesOriginに記載された種別と一致する場合のみライセンス種別を上書きする。
            // これにより、バージョンアップでライセンスが変更になっている場合に検出することが可能。
            licenseType = knownLicensesData.licenses
            copyright = !!knownLicensesData.copyright ? knownLicensesData.copyright : copyright
        }
        switch (licenseType) {
            case 'MIT':
            case 'Apache-2.0':
            case 'ISC':
            case 'BSD-2-Clause':
            case 'BSD-3-Clause':
                if (!licenseText) {
                    // 著作権情報が存在する場合はテンプレートと合成しライセンス条文を生成する。
                    // ただし、ライセンス条文が用意されている場合はそちらを優先する。
                    if (!!copyright) {
                        licenseText = generateLicenseText(licenseTemplateTextDictionary[licenseType], copyright)
                    } else {
                        outputCopyrightError(inputLicensesKey, licenseType)
                        errorCount++
                        continue
                    }
                }
                break
            case 'KNOWN_LICENSE':
                if (!!knownLicensesData.ignore) {
                    // 出力不要の場合は無視する。
                    continue
                }
                // 既知ライブラリ情報に記載されている場合で、定義しているもの以外のライセンス
                licenseText = knownLicensesData.licenseText
                if (!licenseText) {
                    // ignoreの明示的な指定が無く、条文が存在しない場合はエラーとする。
                    outputKnownLicenseTextError(inputLicensesKey)
                    errorCount++
                    continue
                }
                break
            default:
                outputLicenseError(inputLicensesKey, licenseType)
                errorCount++
                // チェックに引っかかったものは出力対象にしない。
                continue
        }
        newLicensesDictionary[inputLicensesKey] = isOutputIndex ? {
            index,
            name,
            inputDataLicenseType,
            version,
            licenseText
        } : {
            name,
            inputDataLicenseType,
            version,
            licenseText
        }
        index++
    }
    if (errorCount > 0 && !ignoreCheckError) {
        throw new Error(`${errorCount}個の要確認事項が見つかりました。既知ライセンス情報ファイルにライセンス情報を追加する等の方法で要確認事項を解決し、再度実行してください。`)
    }
    if (isList) {
        const newLicensesList = []
        for (newLicensesKey in newLicensesDictionary) {
            newLicensesList.push(newLicensesDictionary[newLicensesKey])
        }
        fs.writeFileSync(outputFile, JSON.stringify(newLicensesList));
    } else {
        fs.writeFileSync(outputFile, JSON.stringify(newLicensesDictionary));
    }
    if (errorCount > 0) {
        outputConsoleWarning(`\r\n${errorCount}個の要確認事項が見つかりましたが、強制的にファイル出力を行いました。確認が必要なものは出力対象に含まれません。`)
    }
} catch (e) {
    if (e.message) {
        outputConsoleWarning(`\r\n${e.message}`)
    } else {
        outputConsoleError('不明なエラーです。')
    }
    process.exit(1)
}
