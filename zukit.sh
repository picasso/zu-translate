#!/bin/bash

# Retrieve 'zukit.sh' from the repository
# curl 'https://raw.githubusercontent.com/picasso/zukit/master/zukit.sh' > zukit.sh

echo "*** Init Zukit subtree ***\n"

echo "### Initialize Zukit remote...\n"
# initialize remote
git remote add -f zukit https://github.com/picasso/zukit.git

echo "\n### Commit all changes before adding Zukit subtree...\n"
git commit -am 'before adding Zukit subtree'

# add subtree
echo "\n### Adding Zukit subtree...\n"
git subtree add --prefix=zukit zukit master --squash
git commit --amend -m 'Zukit subtree initialized'

echo "\n### Enable and configure sparse-checkout...\n"
# enable sparse-checkout
git config core.sparsecheckout true
# configure sparse-checkout by specifying what files are not included
echo '*\n!zukit/src/**\n!zukit/*.json\n!zukit/*.md\n!zukit/*.sh\n!zukit/.*' >> .git/info/sparse-checkout
# read tree information into the index and update working tree
git read-tree -mu HEAD

echo "### Configure git archive...\n"
# add 'export-ignore' to .gitattributes
echo '\n# Zukit ignore stuff\n\nzukit/src export-ignore\nzukit/*.json export-ignore' >> .gitattributes
echo 'zukit/*.md export-ignore\nzukit/*.sh export-ignore\nzukit/.* export-ignore' >> .gitattributes

# mission complete
echo "### done!"

# echo "### Commit all changes after Zukit subtree was added...\n"
# git add .
# git commit -am 'after Zukit subtree initialized'

# pull updates from Zukit
# git subtree pull --prefix=zukit zukit master --squash -m 'Zukit updated'

# remove zukit subtree
# git rm -r zukit
