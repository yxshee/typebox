# Module.JsonSchema

```typescript
import Module from 'typebox/module'

const anonymous = Module.JsonSchema({
  type: 'object',
  required: ['x', 'y', 'z'],
  properties: {
    x: { type: 'number' },
    y: { type: 'number' },
    z: { type: 'number' },
  }
})

const module = Module.JsonSchema({
  $defs: {
    Vector: {
      type: 'object',
      required: ['x', 'y', 'z'],
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        z: { type: 'number' },
      }
    }
  }
})
```

