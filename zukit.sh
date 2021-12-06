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

function check_remote() {
    local existed=$(git remote)

    if [[ $existed =~ "zukit" ]]; then
        # remove if remote already exists)
        message 'Previous remote "zukit" was removed!' 'red' false
        git remote rm zukit
    fi
}

function has_remote() {
    local existed=$(git remote)

    if [[ $existed =~ 'zukit' ]]; then
        echo "1"
    else
        echo "0"
    fi
}


#------------------------------------------------------------------------------#
message "*** Init Zukit subtree ***" 'brown' true

if [ ! -d .git ]; then
    message " No a git repository found!" 'red'
    exit 1
fi

reinit=false

# Check if zukit subtree has already been installed
if [[ -d 'zukit' && $(has_remote) == "1" ]]; then
    message 'It looks like you already have "zukit" subtree initialized.' 'brown' false
    message 'Do you want to remove it and reinitialize it from scratch? [Y/n]' 'brown' false
    read -n1 choice
    echo '\n'
    if [[ $choice == 'Y' ]]; then
        reinit=true
        message '### Removing the previous remote "zukit"...' 'red' false
        git remote rm zukit
        message '### Removing the previous "zukit" subtree...' 'red'
        git rm -r zukit
        rm -rf zukit
        git add .
        git commit -am 'after removing previous Zukit subtree'
        echo '\n'
    else
        message '### Try using "git subtree pull..." to update.' 'blue' true
        exit 0
    fi
fi

# initialize remote
message "### Initialize Zukit remote..." 'blue' false
git remote add -f zukit https://github.com/picasso/zukit.git &> /dev/null

# check if local repository has changes
if [[ `git status --porcelain` ]]; then
    message "### Commit all changes before adding Zukit subtree..." 'blue' true
    git add .
    git commit -am 'before adding Zukit subtree'
fi

# add subtree
message "### Adding Zukit subtree..." 'blue' true
git subtree add --prefix=zukit zukit master --squash
git commit --amend -m 'Zukit subtree initialized'

# enable sparse-checkout
message "### Enable and configure sparse-checkout..." 'blue' true
git config core.sparsecheckout true
# configure sparse-checkout by specifying what files are not included
echo '*\n!zukit/src/**\n!zukit/*.json\n!zukit/*.md\n!zukit/lang/*.pot\n!zukit/.*' >> .git/info/sparse-checkout
# read tree information into the index and update working tree
git read-tree -mu HEAD

# add 'export-ignore' to .gitattributes
message "### Configure git archive..." 'blue'
echo '\n# Zukit ignore stuff\n\nzukit/src export-ignore\nzukit/package.json export-ignore' >> .gitattributes
echo 'zukit/package-lock.json export-ignore\nzukit/*.md export-ignore\nzukit/*.sh export-ignore' >> .gitattributes
echo 'zukit/*.pot export-ignore\nzukit/.* export-ignore\nzukit/translate-2-json.js export-ignore' >> .gitattributes

# mission complete
message "### done!" 'green'

if [[ $reinit == true ]]; then
    message "### Don't forget to check '.gitattributes' and '.git/info/sparse-checkout' and remove duplicate lines!" 'red'
fi

message "================================" 'dim' false
message "*** How to work with subtree ***" 'bold'
message "# pull updates from Zukit" 'dim' false
message "git subtree pull --prefix=zukit zukit master --squash -m 'Zukit updated'" 'blue'
message "# remove Zukit subtree" 'dim' false
message "git rm -r zukit" 'blue'
