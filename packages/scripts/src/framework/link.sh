#!/bin/bash
source ./packages/scripts/src/framework/util.sh

# Since `yarn link` seems to be very problematic, this script will replace the npm package with the local path
# This script expects the ea-framework-js repo to be located at the same level as the EA monorepo
pathToFramework=$(readlink -f ../ea-framework-js/dist/src)

if [ ! -d "$pathToFramework" ]; then
  echo "Framework build ($pathToFramework) does not exist."
fi

function linkFramework() {
  # Replace dependency with link to local repo
  jq ".dependencies.\"@chainlink/external-adapter-framework\" = \"portal:$pathToFramework\"" $1/package.json \
  > tmp.json && mv tmp.json $1/package.json

  # Install dependencies
  yarn --cwd $1
}

setNpmAuth

cd packages
fillPackages $1

for package in ${packages[@]}; do
  linkFramework $package
done

cd ..
removeNpmAuth