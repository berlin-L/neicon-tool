var path = require('path');
var config = require('./config');
var fs = require('fs');
var axios = require('axios');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var program = require('commander');

program.version('1.0.0')
    .option('-c, --config', 'set icon repo config file path')
    .parse(process.argv);

var configFilePath = path.resolve(__dirname, program.config || 'icon.config.js');
var iconRepoConfig = [];
try {
    iconRepoConfig = require(configFilePath) || {};
} catch (e) {
    throw new Error('missing icon.config.json');
}

var handle = {
    sendRequest: function (item) {
        console.log('send request to ' + item.url);
        axios.get(item.url, {
            params: {
                type: item.type === "cssFile" ? "cssContent" : item.type
            }
        }).then(function (result) {
            if (result.status === 200 && result.data.code === 200) {
                var tag = item.tag || config.reg[item.type];
                handle[item.type] ?  handle[item.type](result.data.result, item.output)
                    : handle.replaceTagWithContent(result.data.result, tag, item.output);
            } else {
                throw new Error('request error' + JSON.stringify(result));
            }
        })
    },
    // replace specific file tag with cssUrl or cssContent
    replaceTagWithContent: function (content, tag, filePath) {
        console.log('replace file ' + filePath);
        var fileContent = fs.readFileSync(filePath, {encoding: 'utf8'});
        fileContent = fileContent.replace(tag, function ($0, $1, $2) {
            return $0.replace($2, content);
        });
        fs.writeFileSync(filePath, fileContent);
    },
    // generate all svg files into dirPath
    svg: function (icons, dirPath) {
        console.log('get icons tatal: ' + icons.length);
        // delete dirPath
        rimraf(dirPath, function () {
            mkdirp(dirPath, function (err) {
                if (err) {
                    throw new Error(err);
                } else {
                    for (var i = 0; i < icons.length; i++) {
                        var svgPath = path.join(dirPath, icons[i].iconName + '.svg');
                        fs.writeFileSync(svgPath, icons[i].iconContent, {flag: 'w+'});
                    }
                }
            });
        })
    },
    cssFile: function (content, filePath) {
        // delete dirPath
        fs.writeFileSync(filePath, content, {flag: 'w'});
    }
};

function startGetIcon() {
    console.log('start get icon');
    var reg0 = /\{(.*?)\}/gi;

    for (var i = 0; i < iconRepoConfig.length; i++) {
        iconRepoConfig[i].url = config.apiUrl.replace(reg0, function ($0, $1) {
            return iconRepoConfig[i][$1] ? iconRepoConfig[i][$1] : $0
        });
        handle.sendRequest(iconRepoConfig[i]);
    }
}

startGetIcon();
