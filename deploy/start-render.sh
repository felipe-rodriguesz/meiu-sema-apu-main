#!/bin/sh
set -eu
# Free services do not support a pre-deploy command. Migrate before accepting traffic.
node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
exec node dist/main.js
