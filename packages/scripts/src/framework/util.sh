
function isV3Package {
  jq -e 'if (.dependencies."@chainlink/external-adapter-framework" != null) then true else false end' "${1}/package.json" > /dev/null
}

function fillPackages {
  specifiedPackage=$1

  if [[ -n "$specifiedPackage" ]]; then
    # Run bump only for one package
    if isV3Package "sources/$specifiedPackage"; then
      echo "Will only perform actions for package sources/$specifiedPackage"
      packages+=( "sources/$specifiedPackage" )
    else
      echo "Package $specifiedPackage does not exist or use EA v3"
    fi
  else
    packages+=( "scripts" )

    for source in sources/* ; do
      if [[ $source == "sources/README.md" ]] ; then
        continue
      fi

      if isV3Package $source; then
        packages+=( $source )
      fi
    done
  fi
}

function setNpmAuth {
  if [[ -z "${NPM_AUTH_TOKEN}" ]]; then
    echo "The NPM_AUTH_TOKEN variable needs to be set"
    exit 1
  fi

  # This will cause changes to .yarnrc.yml, so we'll need to remove them later
  yarn config set npmAuthToken $NPM_AUTH_TOKEN
}

function removeNpmAuth {
  # Remove the auth token from .yarnrc to avoid leaking tokens
  git restore .yarnrc.yml
}