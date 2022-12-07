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
  changedFiles=()
  for line in $(git diff --name-only "origin/$UPSTREAM_BRANCH"...HEAD); do
    echo "line: $line"
    if [[ $line =~ ^packages/sources/([a-zA-Z-]*)/.*$ ]]; then
      # TODO sed was giving me a hard time with \sources\|composites. Need to fix later.
      adapterName=$(echo "$line" | sed  -e 's/packages\/sources\/\(.*\)\/.*/\1/g' )

      if [[ -n $ADAPTER_SUFFIX ]]; then
        adapterName="$adapterName-$ADAPTER_SUFFIX"
      fi

      if [[ ! "${adapterSet[*]}" =~ $adapterName ]]; then
        adapterSet+=("$adapterName")
      fi
    fi
  done
  echo "${adapterSet[@]}"
##  whi ( git diff --name-status HEAD "origin/$UPSTREAM_BRANCH" |
##  grep ".changeset" |
##  grep -v "README.md" |
##  cut -f2 )
#echo $changedFiles
#git diff --name-status HEAD "origin/$UPSTREAM_BRANCH"
#  adapterSet=()
#  for fileInThisBranch in $changedFiles; do
#    ls "branchFile: $fileInThisBranch"
#    while read -r line; do # See command after "done" for input
#        adapterName=$(echo "$line" | sed  -e 's/.*@chainlink\/\(.*-adapter\).*/\1/g' )
#        if [[ ! "${adapterSet[*]}" =~ $adapterName ]]; then
#          adapterSet+=("$adapterName")
#        fi
#      done < <(grep -oE "$REGEX" "$fileInThisBranch")
#  done

  echo "${adapterSet[@]}"
}
