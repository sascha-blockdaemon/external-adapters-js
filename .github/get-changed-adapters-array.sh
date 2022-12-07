#!/usr/bin/env bash

# This is a utility script to get a list of changed adapters. You can use it in a helper script with the following:
# source .github/get-changed-adapters-array.sh
# # Iteration:
#     CHANGED_ADAPTERS=$(getChangedAdapterArray)
#     for adapter in $CHANGED_ADAPTERS; do
#       echo "$adapter"
#     done
# # As space separated string:
#     SPACE_SEPARATED=$(getChangedAdapterArray)


if [[ -z $UPSTREAM_BRANCH ]]; then
  UPSTREAM_BRANCH=develop
fi
REGEX="@chainlink/(.*-adapter)"

# DO NOT USE echo IN THIS SCRIPT EXCEPT TO DUMP THE RESULT
# Any echoed lines will appear in the output array.
function getChangedAdapterArray(){
  adapterSet=()
  for line in $(git diff --name-only "origin/$UPSTREAM_BRANCH"...HEAD); do
    if [[ $line =~ ^packages/(sources|composites)/([a-zA-Z-]*)/.*$ ]]; then
      # TODO Doing this in two seds is sloppy, was giving me a hard time when trying to do it in one
      adapterName=$(echo "$line" |
      sed  -e 's/packages\/sources\/\(.*\)\/.*/\1/g' |
      sed  -e 's/packages\/composites\/\(.*\)\/.*/\1/g')
      if [[ -n $ADAPTER_SUFFIX ]]; then
        adapterName="$adapterName-$ADAPTER_SUFFIX"
      fi

      if [[ ! "${adapterSet[*]}" =~ $adapterName ]]; then
        adapterSet+=("$adapterName")
      fi
    fi
  done

  echo "${adapterSet[@]}"
}
