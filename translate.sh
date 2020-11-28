#!/bin/bash

# The recommended way to install WP-CLI

# curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
# chmod +x wp-cli.phar
# sudo mv wp-cli.phar /usr/local/bin/wp

# Then, check if it works
# wp --info

# Updating WP-CLI
# wp cli update

function usage() {
    echo '\033[1m\033[0;33mOptions:\033[0m\n'
    echo '\033[1m -q|--quiet\033[2m\n\tQuiet mode\033[0m\n'
    echo '\033[1m -l|--locale <locale>\033[2m\n\tName of locale (eg. en_US or ru_RU)\033[0m\n'
    echo '\033[1m -d|--domain <domain>\033[2m\n\tDomain of translations\033[0m\n'
    echo '\033[1m -h|--handle <handle>\033[2m\n\tJS script handle used in WordPressn\033[0m\n'
    echo '\033[1m -f|--file <path>\033[2m\n\tPath for converted .PO input file\033[0m\n'
    echo '\033[1m -c|--codekit <path>\033[2m\n\tPath for .SH file (when called from CodeKit)\033[0m\n'
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
           echo "\033[1;31mwrong option provided [$1]\033[0m"
   esac
shift
done

([ -z "$FILE" ] || [ -z "$DOMAIN" ]) && echo "\033[1;31mNot enough options!\033[0m" && usage

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

if [ -z $BE_QUIET ];then
    echo " FILE:\t\t$FILE\n FOLDER:\t$FOLDER\n DOMAIN:\t$DOMAIN\n LOCALE:\t$LOCALE\n HANDLE:\t$HANDLE\n"
    echo "\033[0;33m### Converting ./lang/$LOCALE.po to .JSON...\033[0m"
fi

# WordPress will check for a file in that path with the format ${domain}-${locale}-${handle}.json
JSON_FILE="$FOLDER/$DOMAIN-$LOCALE-$HANDLE.json"
JSON_MASK="$DOMAIN-$LOCALE-*.json"

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

# Hook for CodeKit
# Do not forget to set the CONV_PATH to location of 'translate.sh', DOMAIN
# HANDLE (optional)

# DOMAIN="zukit"
# CONV_PATH="zukit"
# HANDLE="zukit"

# sh "$CONV_PATH/translate.sh" -f $CK_INPUT_PATH -d $DOMAIN -c $CONV_PATH -h $HANDLE

# ------------------------------------------------------------------------------
# 0 - Normal Style
# 1 - Bold
# 2 - Dim
# 3 - Italic
# 4 - Underlined
# 5 - Blinking
# 7 - Reverse
# 8 - Invisible

# BOLD='\033[1m'
# RESET_ALL='\033[0m'

# Black        0;30     Dark Gray     1;30
# Red          0;31     Light Red     1;31
# Green        0;32     Light Green   1;32
# Brown/Orange 0;33     Yellow        1;33
# Blue         0;34     Light Blue    1;34
# Purple       0;35     Light Purple  1;35
# Cyan         0;36     Light Cyan    1;36
# Light Gray   0;37     White         1;37

# RED='\033[0;31m'
