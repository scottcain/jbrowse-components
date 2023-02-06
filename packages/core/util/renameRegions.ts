import { getSnapshot, isAlive, isStateTreeNode } from 'mobx-state-tree'
import { AssemblyManager, Region } from './types'

export async function renameRegionsIfNeeded<
  ARGTYPE extends {
    assemblyName?: string
    regions?: Region[]
    signal?: AbortSignal
    adapterConfig: unknown
    sessionId: string
    statusCallback?: (arg: string) => void
  },
>(assemblyManager: AssemblyManager, args: ARGTYPE) {
  const { regions = [], adapterConfig } = args
  if (!args.sessionId) {
    throw new Error('sessionId is required')
  }

  const assemblyNames = regions.map(region => region.assemblyName)
  const assemblyMaps = Object.fromEntries(
    await Promise.all(
      assemblyNames.map(async assemblyName => {
        return [
          assemblyName,
          await assemblyManager.getRefNameMapForAdapter(
            adapterConfig,
            assemblyName,
            args,
          ),
        ]
      }),
    ),
  )

  return {
    ...args,
    regions: regions.map((region, i) =>
      // note: uses assemblyNames defined above since region could be dead now
      renameRegionIfNeeded(assemblyMaps[assemblyNames[i]], region),
    ),
  }
}

export function renameRegionIfNeeded(
  refNameMap: Record<string, string>,
  region: Region,
): Region & { originalRefName?: string } {
  if (isStateTreeNode(region) && !isAlive(region)) {
    return region
  }

  if (region && refNameMap && refNameMap[region.refName]) {
    // clone the region so we don't modify it
    if (isStateTreeNode(region)) {
      // @ts-ignore
      region = { ...getSnapshot(region) }
    } else {
      region = { ...region }
    }

    // modify it directly in the container
    const newRef = refNameMap[region.refName]
    if (newRef) {
      return { ...region, refName: newRef, originalRefName: region.refName }
    }
  }
  return region
}
