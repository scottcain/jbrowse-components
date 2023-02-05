import React, { useState } from 'react'
import { observer } from 'mobx-react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { getSession } from '@jbrowse/core/util'
import { getSnapshot } from 'mobx-state-tree'
import { getConf } from '@jbrowse/core/configuration'

// locals
import {
  TreeNode,
  HierarchicalTrackSelectorModel,
  generateHierarchy,
} from '../model'
import HierarchicalFab from './HierarchicalFab'
import HierarchicalTree from './tree/HierarchicalTree'
import HierarchicalHeader from './tree/HierarchicalHeader'

// Don't use autosizer in jest and instead hardcode a height, otherwise fails
// jest tests
const AutoSizedHierarchicalTree = ({
  tree,
  model,
  offset,
}: {
  tree: TreeNode
  model: HierarchicalTrackSelectorModel
  offset: number
}) => {
  return typeof jest === 'undefined' ? (
    <AutoSizer disableWidth>
      {({ height }) => {
        return (
          <HierarchicalTree
            height={height - offset}
            model={model}
            tree={tree}
          />
        )
      }}
    </AutoSizer>
  ) : (
    <HierarchicalTree height={20000} model={model} tree={tree} />
  )
}

const Wrapper = ({
  overrideDimensions,
  children,
}: {
  overrideDimensions?: { width: number; height: number }
  children: React.ReactNode
}) => {
  return overrideDimensions ? (
    <div style={{ ...overrideDimensions }}>{children}</div>
  ) : (
    <>{children}</>
  )
}

function hierarchy(self: any, assemblyName: string) {
  const hier = generateHierarchy(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    self as any,
    self.trackConfigurations(assemblyName),
    self.collapsed,
  )

  const session = getSession(self)
  const { connectionInstances } = session

  const { assemblyManager } = getSession(self)
  const assembly = assemblyManager.get(assemblyName)
  const conns =
    (assembly &&
      connectionInstances
        ?.map(c => ({
          // @ts-ignore
          id: getSnapshot(c).configuration,
          name: getConf(c, 'name'),
          children: self.connectionHierarchy(assemblyName, c),
          state: {
            expanded: true,
          },
        }))
        .filter(f => f.children.length)) ||
    []

  return {
    name: 'Root',
    id: 'Root',
    children: [{ name: 'Tracks', id: 'Tracks', children: hier }, ...conns],
  }
}

const HierarchicalTrackSelector = observer(function ({
  model,
  toolbarHeight = 0,
}: {
  model: HierarchicalTrackSelectorModel
  toolbarHeight?: number
}) {
  const [assemblyIdx, setAssemblyIdx] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)

  const { assemblyNames } = model
  const assemblyName = assemblyNames[assemblyIdx]
  return assemblyName ? (
    <>
      <HierarchicalHeader
        model={model}
        setHeaderHeight={setHeaderHeight}
        setAssemblyIdx={setAssemblyIdx}
      />
      <AutoSizedHierarchicalTree
        tree={hierarchy(model, assemblyName)}
        model={model}
        offset={toolbarHeight + headerHeight}
      />
    </>
  ) : null
})

export default observer(function ({
  model,
  toolbarHeight,
  overrideDimensions,
}: {
  model: HierarchicalTrackSelectorModel
  toolbarHeight: number
  overrideDimensions?: { width: number; height: number }
}) {
  return (
    <Wrapper overrideDimensions={overrideDimensions}>
      <HierarchicalTrackSelector model={model} toolbarHeight={toolbarHeight} />
      <HierarchicalFab model={model} />
    </Wrapper>
  )
})
