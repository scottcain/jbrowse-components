---
id: linearbasicdisplay
title: LinearBasicDisplay
toplevel: true
---

Note: this document is automatically generated from configuration objects in our
source code. See [Config guide](/docs/config_guide) for more info

## Source file

[plugins/linear-genome-view/src/LinearBasicDisplay/configSchema.ts](https://github.com/GMOD/jbrowse-components/blob/main/plugins/linear-genome-view/src/LinearBasicDisplay/configSchema.ts)

## Docs

### LinearBasicDisplay - Slots

#### slot: mouseover

```js
mouseover: {
        type: 'string',
        description: 'what to display in a given mouseover',
        defaultValue: `jexl:get(feature,'name')`,

        contextVariable: ['feature'],
      }
```

#### slot: renderer

```js
renderer: pluginManager.pluggableConfigSchemaType('renderer')
```

## LinearBasicDisplay - Derives from

```js
baseConfiguration: baseLinearDisplayConfigSchema
```
