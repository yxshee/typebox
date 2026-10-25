# Module

Standalone Type Modules

## Overview

TypeBox Module is a Ahead of Time (AOT) compiler for Types and JSON Schema. Unlike TypeBox's default schema compiler, Module produces high performance standalone validator modules that can be bundled without a dependency on TypeBox.

## Example

The Module compiler is available via a submodule import.

```typescript
import Module from 'typebox/module'
import * as Fs from 'node:fs'

// Write validator module to disk.
Fs.writeFileSync(new URL('./vector.ts', import.meta.url), Module.JsonSchema({ 
  type: 'string',
  required: ['x', 'y', 'z'],
  properties: {
    x: { type: 'number' },
    y: { type: 'number' },
    z: { type: 'number' }
  }
}))

// Import validator as a standalone module.
const Vector = await import('/vector.ts')

const result = Vector.Parse({
  x: 1,
  y: 2,
  z: 3
})


```