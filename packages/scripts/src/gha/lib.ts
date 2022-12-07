import { DockerLabels, generateFileJSON } from '../docker-build/lib'
import fs from 'fs'

interface JobMatrix {
  adapter: {
    name: string
    type: string
  }[]
}

/**
 * Create a job matrix that allows our build pipeline to create and push
 * docker images
 */
export async function getJobMatrix(): Promise<JobMatrix> {
  // yarn generate:gha:matrix to only include changed adapters
  // yarn generate:gha:matrix full to include all adapters
  const branch = process.env.BRANCH || ''
  const prefix = process.env.IMAGE_PREFIX || ''
  const useLatest = !!process.env.LATEST
  const dockerfile = await generateFileJSON({ prefix, branch, useLatest }, { context: '.' })

  const adapterNames = new Set<string>()
  const expression = new RegExp(/'@chainlink\/([a-zA-Z-]*-adapter)'/, 'g')

  fs.readdirSync('./.changeset')
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const content = fs.readFileSync(`./.changeset/${file}`)
      Array.from(content.toString().matchAll(expression)).forEach((m) => {
        adapterNames.add(m[1])
      })
    })

  const adapter = Object.entries(dockerfile.services)
    .filter(([k]) => {
      // Do not filter if we are building all adapters
      return process.argv[2] === 'full' || adapterNames.has(k)
    })
    .map(([k, v]) => {
      return {
        name: k,
        type: v.build.labels[DockerLabels.EA_TYPE],
      }
    })

  return { adapter }
}
