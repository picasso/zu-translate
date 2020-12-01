#!/bin/bash

# Retrieve 'zukit.sh' from the repository
# curl 'https://raw.githubusercontent.com/picasso/zukit/master/zukit.sh' > zukit.sh

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
    fi
    echo "$beforeline$color$1$reset$newline"
}

#------------------------------------------------------------------------------#
message "*** Init Zukit subtree ***" 'brown' true

if [ ! -d .git ]; then
    message " No a git repository found!" 'red'
    exit 1
fi;

message "### Initialize Zukit remote..." 'blue'
# initialize remote
git remote add -f zukit https://github.com/picasso/zukit.git

message "### Commit all changes before adding Zukit subtree..." 'blue' true
git add .
git commit -am 'before adding Zukit subtree'

# add subtree
message "### Adding Zukit subtree..." 'blue' true
git subtree add --prefix=zukit zukit master --squash
git commit --amend -m 'Zukit subtree initialized'

message "### Enable and configure sparse-checkout..." 'blue' true
# enable sparse-checkout
git config core.sparsecheckout true
# configure sparse-checkout by specifying what files are not included
echo '*\n!zukit/src/**\n!zukit/*.json\n!zukit/*.md\n!zukit/.*' >> .git/info/sparse-checkout
# read tree information into the index and update working tree
git read-tree -mu HEAD

message "### Configure git archive..." 'blue'
# add 'export-ignore' to .gitattributes
echo '\n# Zukit ignore stuff\n\nzukit/src export-ignore\nzukit/package.json export-ignore' >> .gitattributes
echo 'zukit/package-lock.json export-ignore\nzukit/*.md export-ignore\nzukit/*.sh export-ignore' >> .gitattributes
echo 'zukit/*.pot export-ignore\nzukit/.* export-ignore\nzukit/translate-2-json.js export-ignore' >> .gitattributes

# mission complete
message "### done!" 'green'

# message "### Commit all changes after Zukit subtree was added..."
# git add .
# git commit -am 'after Zukit subtree initialized'

# pull updates from Zukit
# git subtree pull --prefix=zukit zukit master --squash -m 'Zukit updated'

# remove zukit subtree
# git rm -r zukit
