#!/bin/bash
source ./packages/scripts/src/framework/util.sh

function bump() (
  cd $1
  
  # Get current version
  current_version=$(jq -r '.dependencies."@chainlink/external-adapter-framework"' package.json)
  # Install latest version, pinned
  yarn add @chainlink/external-adapter-framework -E > /dev/null # Silence output
  latest_version=$(jq -r '.dependencies."@chainlink/external-adapter-framework"' package.json) # Get final version

  if [[ $current_version == $latest_version ]] ; then
    echo "Package $1 already at latest version $latest_version"
  else
    echo "Bumped framework version in package $1 from version $current_version to version $latest_version"
  fi
)


setNpmAuth
cd packages

fillPackages $1
for package in ${packages[@]}; do
  bump $package
done

cd ..
removeNpmAuth

