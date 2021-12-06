#!/bin/bash

# The recommended way to install WP-CLI

# curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
# chmod +x wp-cli.phar
# sudo mv wp-cli.phar /usr/local/bin/wp

# Then, check if it works
# wp --info

# Updating WP-CLI
# wp cli update

function message() {
    local reset='\033[0m'
    local color='\033[2m'
    local newline='\n'
    local beforeline=''
    case "$2" in
         'red')
             color='\033[1;31m'
             ;;
         'green')
             color='\033[0;32m'
             ;;
         'blue')
             color='\033[0;34m'
             ;;
         'brown')
             color='\033[0;33m'
             ;;
         'bold')
             color='\033[1m'
             ;;
         *)
            color='\033[2m'
    esac
    if [ "$3" == false ]; then
        newline=''
    elif [ "$3" == true ]; then
        beforeline='\n'
    elif [ "$3" == 'tab' ]; then
        beforeline='\t'
    elif [ "$3" == 'bold' ]; then
        color="\033[1m$color"
    fi
    echo "$beforeline$color$1$reset$newline"
}

function usage() {
    message 'Options:' 'brown' 'bold'
    message ' -q|--quiet' 'bold' false
    message 'Quiet mode' 'dim' 'tab'
    message ' -l|--locale <locale>' 'bold' false
    message 'Name of locale (eg. en_US or ru_RU)' 'dim' 'tab'
    message ' -d|--domain <domain>' 'bold' false
    message 'Domain of translations' 'dim' 'tab'
    message ' -h|--handle <handle>' 'bold' false
    message 'JS script handle used in WordPressn' 'dim' 'tab'
    message ' -f|--file <path>' 'bold' false
    message 'Path for converted .PO input file' 'dim' 'tab'
    message ' -c|--codekit <path>' 'bold' false
    message 'Path for .SH file (when called from CodeKit)' 'dim' 'tab'
    exit 0
}

while [ ! -z "$1" ];do
   case "$1" in
        --help)
            usage
            ;;
        -q|--quiet)
            QUIET=true
            ;;
        -l|--locale)
            shift
            LOCALE="$1"
            ;;
        -d|--domain)
            shift
            DOMAIN="$1"
            ;;
        -h|--handle)
            shift
            HANDLE="$1"
            ;;
        -f|--file)
            shift
            FILE="$1"
            ;;
        -c|--codekit)
            shift
            CODEKIT="$1"
            ;;
        *)
           message " Wrong option provided: [$1]!" 'red'
   esac
shift
done

([ -z "$FILE" ] || [ -z "$DOMAIN" ]) && (message " Not enough options!" 'red') && usage

FOLDER="$(dirname $FILE)"

if [ -z "$LOCALE" ];then
    LOCALE="$(basename -s .po $FILE)"
fi

if [ -z "$CODEKIT" ];then
    NODEFILE="translate-2-json.js"
    if [ $QUIET == true ]; then
        BE_QUIET="-q"
        WP_QUIET="--quiet"
    else
        BE_QUIET=""
        WP_QUIET=""
    fi
else
    NODEFILE="$CODEKIT/translate-2-json.js"
    BE_QUIET="-q"
    WP_QUIET="--quiet"
fi

if [ -z "$HANDLE" ];then
    HANDLE="$DOMAIN"
fi

# WordPress will check for a file in that path with the format ${domain}-${locale}-${handle}.json
JSON_FILE="$FOLDER/$DOMAIN-$LOCALE-$HANDLE.json"
JSON_MASK="$DOMAIN-$LOCALE-*.json"

if [ -z $BE_QUIET ];then
    # echo " FILE:\t\t$FILE\n FOLDER:\t$FOLDER\n DOMAIN:\t$DOMAIN\n LOCALE:\t$LOCALE\n HANDLE:\t$HANDLE\n"
    message "### Converting $FOLDER/$LOCALE.po to $JSON_FILE ###" 'brown' true
fi

# remove previous JSON file(s)
MD5_FILE=$(find $FOLDER -name $JSON_MASK -type f)
rm -f $MD5_FILE
# replace multiple JS scripts to domain name
node $NODEFILE "--domain=$DOMAIN" "--file=$FILE" $BE_QUIET
# convert .PO file to .JSON
wp i18n make-json "$FOLDER/$DOMAIN-$LOCALE.po" --no-purge $WP_QUIET
# rename md5 file to handle
MD5_FILE=$(find $FOLDER -name $JSON_MASK -type f)
mv $MD5_FILE $JSON_FILE
# remove temporary .po files
rm -f "$FOLDER/$DOMAIN-$LOCALE.po"

#------------------------------------------------------------------------------#
# Hook for CodeKit
# Do not forget to set the ZUKIT_PATH to location of 'translate.sh' and DOMAIN
# If script handle is different from domain to set HANDLE (optional)

# DOMAIN="zukit"
# ZUKIT_PATH="zukit"
# HANDLE="zukit"

# sh "$ZUKIT_PATH/translate.sh" -f $CK_INPUT_PATH -d $DOMAIN -c $ZUKIT_PATH -h $HANDLE
