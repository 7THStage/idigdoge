#!/bin/sh

echo "Creating public/worker.js..."
uglifyjs raw/worker.js -e -c -m -o /tmp/worker.min.js
cat scrypt/module.min.js /tmp/worker.min.js > public/worker.js
rm /tmp/worker.min.js
echo "Done."

echo "Creating public/coordinator.js..."
uglifyjs raw/coordinator.js -c -m -o public/coordinator.js
echo "Done."

echo "Creating public/style.css..."
sqwish raw/style.css -o public/style.css
echo "Done."
