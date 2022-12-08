import { DockerLabels, generateFileJSON } from '../docker-build/lib'
import * as child_process from 'child_process'

interface JobMatrix {
  adapter: {
    name: string
    type: string
  }[]
}

/**
 * Create a job matrix that allows our build pipeline to create and push
 * docker images.
 *
 * By default, will build images for any adapter listed under ./changesets
 * Call with yarn generate:gha:matrix full OR BUILD_ALL=true yarn generate:gha:matrix to build all adapters
 */
export async function getJobMatrix(): Promise<JobMatrix> {
  // const adapterNames = new Set<string>()
  // const expression = new RegExp(/'@chainlink\/([a-zA-Z-]*-adapter)'/, 'g')

  // fs.readdirSync('./.changeset')
  //   .filter((file) => file.endsWith('.md'))
  //   .map((file) => {
  //     const content = fs.readFileSync(`./.changeset/${file}`)
  //     Array.from(content.toString().matchAll(expression)).forEach((m) => {
  //       adapterNames.add(m[1])
  //     })
  //   })

  let shouldBuildAll = process.argv[2] === 'full' || process.env['BUILD_ALL'] === 'true'
  const adapters = new Set<{ name: string; type: string }>()
  if (!shouldBuildAll) {
    const expression = new RegExp(/packages\/(sources|composites|examples|targets)\/(.*)\/.*/, 'g')
    const output = child_process
      .execSync(`git diff --name-only ${process.env['UPSTREAM_BRANCH'] || 'origin/develop'}...HEAD`)
      .toString()
      .split('\n')

    for (let i = 0; i < output.length; i++) {
      const line = output[i]
      Array.from(line.matchAll(expression)).forEach((m) => {
        adapters.add({
          name: `${m[2]}-adapter`,
          type: `${m[1]}`,
        }) // Docker services use -adapter suffix
      })
      // TODO @ad0ll, below temporarily commented for testing (which has to be done through the test PR), should not appear in final PR
      // if (line.match(/packages\/(core|scripts|non-deployable)/)) {
      if (line.match(/packages\/(core|non-deployable)/)) {
        shouldBuildAll = true
        break
      }
    }
  }

  // shouldBuildAll is forcefully set to true if we encounter a core or script change in the diff, so we have to explicitly
  // check if its true after evaluating the diff.
  if (shouldBuildAll) {
    //Full build, get data from docker-compose.generated.yaml
    const branch = process.env.BRANCH || ''
    const prefix = process.env.IMAGE_PREFIX || ''
    const useLatest = !!process.env.LATEST
    const dockerfile = await generateFileJSON({ prefix, branch, useLatest }, { context: '.' })

    Object.entries(dockerfile.services).forEach(([k, v]) => {
      adapters.add({
        name: k,
        type: v.build.labels[DockerLabels.EA_TYPE],
      })
    })
  }

  return {
    adapter: Array.from(adapters),
  }
}
