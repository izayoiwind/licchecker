const fs = require('fs')
const argv = process.argv
let inputFile = './licenses.json'
let outputFile = './licenses_out.json'

let mitTxt = ''
let apache20Txt = ''
let iscTxt = ''
let bsd2clauseTxt = ''
let bsd3clauseTxt = ''
try {
    mitTxt = fs.readFileSync('./lictexts/mit.txt', 'utf8')
    apache20Txt = fs.readFileSync('./lictexts/apache20.txt', 'utf8')
    iscTxt = fs.readFileSync('./lictexts/isc.txt', 'utf8')
    bsd2clauseTxt = fs.readFileSync('./lictexts/bsd2clause.txt', 'utf8')
    bsd3clauseTxt = fs.readFileSync('./lictexts/bsd3clause.txt', 'utf8')
} catch (e) {
    console.error('ライセンステンプレートファイルが存在しません')
    process.exit(1)
}

const checkArgv = (inArgv, inIndex, inCorrected) => {
    if (inArgv.length <= inIndex + 1) {
        console.error('オプションの指定が不正です')
        process.exit(1)
    }
    inCorrected()
}
argv.forEach((value, index) => {
    if (value === '-i') {
        checkArgv(argv, index, () => {
            inputFile = argv[index + 1]
        })
    } else if (value === '-o') {
        checkArgv(argv, index, () => {
            outputFile = argv[index + 1]
        })
    }
})
try {
    fs.statSync(inputFile)
} catch (e) {
    console.error('指定されたファイルは存在しません')
    process.exit(1)
}
const containsCopyright = (value) => {
    return !!value.copyright
}
const generateLicenseText = (licTemplateFileText, value) => {
    return containsCopyright(value) ? licTemplateFileText.replace('%%%COPYRIGHT%%%', value.copyright) : ''
}
const checkLicenseText = (key, licenseType, licenseText) => {
    if (!licenseText) {
        console.log(`${key}：著作権表記を確認してください（${licenseType}）`)
    }
}
try {
    const json = JSON.parse(fs.readFileSync(inputFile, 'utf8'))
    const newLicensesJsonData = {}
    for (key in json) {
        let value = json[key]
        if (!value.name || !value.version) {
            console.log(`${key}：名前またはバージョンがありません`)
        }
        if (value.private) {
            continue
        }
        const name = value.name
        const version = value.version
        let licenseText = value.licenseFile.match(/LICENSE/ig) || value.licenseFile.match(/LICENCE/ig) ? value.licenseText : null
        if (!licenseText) {
            let tmpLicenseType = value.licenses
            if (tmpLicenseType === 'MIT') {
                licenseText = generateLicenseText(mitTxt, value)
                checkLicenseText(key, tmpLicenseType, licenseText)
            } else if (tmpLicenseType === 'Apache-2.0') {
                licenseText = generateLicenseText(apache20Txt, value)
                checkLicenseText(key, tmpLicenseType, licenseText)
            } else if (tmpLicenseType === 'ISC') {
                licenseText = generateLicenseText(iscTxt, value)
                checkLicenseText(key, tmpLicenseType, licenseText)
            } else if (tmpLicenseType === 'BSD-2-Clause') {
                licenseText = generateLicenseText(bsd2clauseTxt, value)
                checkLicenseText(key, tmpLicenseType, licenseText)
            } else if (tmpLicenseType === 'BSD-3-Clause') {
                licenseText = generateLicenseText(bsd3clauseTxt, value)
                checkLicenseText(key, tmpLicenseType, licenseText)
            } else {
                console.log(`${key}：ライセンスを確認してください`)
            }
        }
        newLicensesJsonData[key] = {
            name,
            version,
            licenseText
        }
    }
    fs.writeFileSync(outputFile, JSON.stringify(newLicensesJsonData));
} catch (e) {
    console.error('ファイルの読み込みに失敗しました')
    process.exit(1)
}
