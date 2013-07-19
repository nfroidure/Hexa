#! /bin/sh
# Remove production parasits

# Keep old dir
oldPwd=$(pwd)
# 
cd "$(dirname $0)/www";
# Avoid multiple > addition
sed -i "s/DEV-->/DEV--/g" index.html
# Comment RequireJS script tag
sed -i "s/DEV--/DEV-->/g" index.html
# Uncomment production script tag
sed -i "s/PROD-->/PROD--/g" index.html
# Delete prod file
rm javascript/production.js
# Back to the right pwd
cd "$olPwd"
