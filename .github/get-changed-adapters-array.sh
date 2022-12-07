#!/bin/bash

# This is a utility script to get a list of changed adapters. You can use it in a helper script with the following:
# source .github/get-changed-adapters-array.sh
# # Iteration:
#     CHANGED_ADAPTERS=$(getChangedAdapterArray)
#     for adapter in $CHANGED_ADAPTERS; do
#       echo "$adapter"
#     done
# # As space separated string:
#     SPACE_SEPARATED=$(getChangedAdapterArray)
# # As json output


if [[ -z $UPSTREAM_BRANCH ]]; then
  UPSTREAM_BRANCH=develop
fi
REGEX="@chainlink/(.*-adapter)"

# DO NOT USE echo IN THIS SCRIPT EXCEPT TO DUMP THE RESULT
# Any echoed lines will appear in the output array.

function getChangedAdapterArray(){
  changedFiles=$( git diff --name-status HEAD "origin/$UPSTREAM_BRANCH" |
  grep ".changeset" |
  grep -v "README.md" | # Inverse match
  cut -f2 )

  adapterSet=() # Would ideally want to use an associative array, but MacOS doesn't have bash 4+ installed and we'd have to install zsh in a run to use it
  for fileInThisBranch in $changedFiles; do
  while read -r line; do # See command after "done" for input

      # Grep has extracted the string from the changeset (i.e. cut spaces, quotes, unrelated text)
      # We can now replace the @chainlink/ prefix for the adapter name
      # Ex: @chainlink/evm-balance-adapter -> evm-balance-adapter
      adapterName=$(echo "$line" | sed  -e 's/.*@chainlink\/\(.*-adapter\).*/\1/g' )
      # Check if we've already encountered this adapter
      if [[ ! "${adapterSet[*]}" =~ $adapterName ]]; then
        adapterSet+=("$adapterName")
      fi
    done < <(grep -oE "$REGEX" "$fileInThisBranch")
  done

  echo "${adapterSet[@]}"
}
