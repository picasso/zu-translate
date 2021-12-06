/* global process, require */
const replace = require('replace-in-file');
const fs = require('fs');
const path = require('path');

function message(value, color) {
    if(quiet) return;
    const esc = '\x1B'; // octal \033 is hexadecimal \x1B
    const code = color === 'red' ? '[1;31m' : (color === 'green' ? '[0;32m' : '[0;34m');
    const reset = '[0m';
    if(typeof value === 'string' || value instanceof String) {
        // eslint-disable-next-line no-console
        console.log(`\n${esc}${code}${value}${esc}${reset}`);
    } else {
        // eslint-disable-next-line no-console
        console.log(value);
    }
}

function getArgs () {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
            // long arg
            if(arg.slice(0,2) === '--') {
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2, longArg[0].length);
                const longArgValue = longArg.length > 1 ? longArg[1] : true;
                args[longArgFlag] = longArgValue;
            }
            // flags
            else if(arg[0] === '-') {
                const flags = arg.slice(1,arg.length).split('');
                flags.forEach(flag => {
                    args[flag] = true;
                });
            }
    });
    return args;
}
const args = getArgs();
const { domain, file, q: quiet } = args;
// message(args);

if(!domain || !file) {
    message(`Missing arguments [${!domain ? 'domain' : ''}, ${!file ? 'file' : ''}]!`);
    process.exit(-1);
}

const folder = path.dirname(file);
const locale = path.basename(file, path.extname(file));

// Replace JS file names
const jsFiles = [
    // eslint-disable-next-line no-useless-escape
    /(#[^\s]*).+(\.js\s*:\s*\d+)/gm,
];

const replaceJs = [
    `$1 ${domain}$2`,
];

const options = {
  files: file,
  toFiles: `${folder}/${domain}-${locale}.po`,
  from: [].concat(
      jsFiles,
  ),
  to: [].concat(
      replaceJs,
  ),
  countMatches: true,
};

message('Replacement options:');
message(options);

// Copy the 'fileFrom' to 'fileTo' (because 'replace-in-file'
// does not support creating a new file, which is required for CodeKit)
function copyFileAndReplaceIn(fileFrom, fileTo) {

    var source = fs.createReadStream(fileFrom);
    var dest = fs.createWriteStream(fileTo);

    source.pipe(dest);

    source.on('end', function() {
        // eslint-disable-next-line no-console
        message(`"${path.basename(fileFrom)}" succesfully copied to "${path.basename(fileTo)}"`, 'green');
        replaceInFile();
    });
    source.on('error', function(err) { message(err, 'red'); });
}

function replaceInFile() {
    try {
        options.files = options.toFiles;
        const results = replace.sync(options);
        message('Replacement results:');
        message(results);
    }
    catch(error) {
        message('Error occurred:', 'red');
        message(error);
    }
}

// copy file & replace in it
copyFileAndReplaceIn(options.files, options.toFiles);
