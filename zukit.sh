#!/bin/bash

# Retrieve 'zukit.sh' from the repository
# curl 'https://raw.githubusercontent.com/picasso/zukit/master/zukit.sh' > zukit.sh

# curl 'https://raw.githubusercontent.com/picasso/zukit/master/README.md' > README.md


echo "* Init Zukit subtree *\n"

echo "### Initialize Zukit remote...\n"
# initialize remote
git remote add -f zukit https://github.com/picasso/zukit.git

echo "\n### Commit all changes before adding Zukit subtree...\n"
git commit -am 'before adding Zukit subtree'

# add subtree
echo "\n### Adding Zukit subtree..."
git subtree add --prefix=zukit zukit master --squash
git commit --amend -m 'Zukit subtree initialized'

echo "\n### Enable and configure sparse-checkout...\n"
# enable sparse-checkout
git config core.sparsecheckout true
# configure sparse-checkout by specifying what files are not included
echo '*\n!zukit/src/**\n!zukit/*.json\n!zukit/*.md\n!zukit/*.sh\n!zukit/.*' >> .git/info/sparse-checkout
# read tree information into the index
git read-tree -mu HEAD

echo "### Configure git archive...\n"
# add 'export-ignore' to .gitattributes
echo '\n# Zukit ignore stuff\n\nzukit/src export-ignore\nzukit/*.json export-ignore' >> .gitattributes
echo 'zukit/*.md export-ignore\nzukit/*.sh export-ignore\nzukit/.* export-ignore' >> .gitattributes

# echo 'zukit/src/**zukit/*.json\nzukit/*.md\nzukit/*.sh\nzukit/.*' >> .git/info/exclude
#echo '\n#Zukit ignore stuff\nsrc\n*.json\n*.md\n*.sh\n.*' >> zukit/.gitignore
# echo '\n#Zukit ignore stuff\nzukit/src/**zukit/*.json\nzukit/*.md\nzukit/*.sh\nzukit/.*' >> .gitignore


echo "\n### done!"

# remove unnecessary files from the staging area
# git rm -r --cached 'zukit/src'
# git rm --cached 'zukit/*.json'
# git rm --cached 'zukit/*.sh'
# git rm --cached 'zukit/*.md'
# git rm --cached 'zukit/.*'


# echo "### Commit all changes after Zukit subtree was added...\n"
# git add .
# git commit -am 'Zukit subtree initialized'


# pull updates from Zukit
# git subtree pull --prefix=zukit zukit master --squash -m 'Zukit updated'
