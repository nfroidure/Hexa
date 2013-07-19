#! /bin/sh
# Build and eventually send to production server

# Keep old dir
oldPwd=$(pwd)
# 
cd "$(dirname $0)/www";
# Avoid multiple > addition
sed -i "s/PROD-->/PROD--/g" index.html
# Comment RequireJS script tag
sed -i "s/DEV-->/DEV--/g" index.html
# Uncomment production script tag
sed -i "s/PROD--/PROD-->/g" index.html
# Run r.js
if [ "$1" = "prod" ]; then
	# Production
	r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js
else
	# Debug
	r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js optimize=none
fi
# Adding a simple closure
echo "(function() {\n\n" >> /tmp/production.js
cat javascript/production.js >> /tmp/production.js
echo "\n\n}).call({})" >> /tmp/production.js
mv /tmp/production.js javascript/production.js
# Sending if server given
if [ "$2" != "" ]; then
	cd ..
	rsync -Haurov --exclude=/.git/ --exclude=/node_modules/ --exclude=/materials/ --exclude=/www/javascript/ ./ "$2:/home/karaoke/player/"
	scp www/javascript/production.js "$2:/home/karaoke/player/www/javascript/production.js"
fi
# Back to the right pwd
cd "$olPwd"
