import {
  BaseFeatureDataAdapter,
  BaseOptions,
} from '@jbrowse/core/data_adapters/BaseAdapter'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import {
  SimpleFeature,
  Feature,
  Region,
  complement,
  reverse,
  doesIntersect2,
} from '@jbrowse/core/util'
import { toArray } from 'rxjs/operators'

export default class extends BaseFeatureDataAdapter {
  public async configure() {
    const adapter = await this.getSubAdapter?.(this.getConf('sequenceAdapter'))
    if (!adapter) {
      throw new Error('Error getting subadapter')
    }
    return adapter.dataAdapter as BaseFeatureDataAdapter
  }

  public async getRefNames() {
    const adapter = await this.configure()
    return adapter.getRefNames()
  }

  public getFeatures(query: Region, opts: BaseOptions) {
    return ObservableCreate<Feature>(async observer => {
      const feats = [
        {
          uniqueId: '1541597311-match-19554-p',
          refName: 'ctgA',
          start: 19554,
          end: 19560,
          strand: 1,
        },
        {
          uniqueId: '1541597311-match-20380-p',
          refName: 'ctgA',
          start: 20380,
          end: 20386,
          strand: 1,
        },
        {
          uniqueId: '1541597311-match-23576-p',
          refName: 'ctgA',
          start: 23576,
          end: 23582,
          strand: 1,
        },
        {
          uniqueId: '1541597311-match-22032-n',
          refName: 'ctgA',
          start: 22032,
          end: 22038,
          strand: -1,
        },
        {
          uniqueId: '1541597311-match-22065-n',
          refName: 'ctgA',
          start: 22065,
          end: 22071,
          strand: -1,
        },
      ]

      const hw = 1000
      let { start: queryStart, end: queryEnd } = query
      queryStart = Math.max(0, queryStart - hw)
      queryEnd += hw
      feats.forEach(f => {
        if (doesIntersect2(queryStart, queryEnd, f.start, f.end)) {
          console.log(queryStart, queryEnd, JSON.stringify(f), f.start, f.end)
          observer.next(new SimpleFeature(f))
        }
      })

      observer.complete()
      console.log('done')
    })
  }

  public freeResources() {}
}
