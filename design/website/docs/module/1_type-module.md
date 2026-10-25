# Module.TypeModule

```typescript
import Module from 'typebox/module'

const anonymous = Module.TypeModule(Type.Object({
  x: Type.Number(),
  y: Type.Number(),
  z: Type.Number()
}))

const module = Module.TypeModule(Type.Module({
  Vector: Type.Object({
    x: Type.Number(),
    y: Type.Number(),
    z: Type.Number()
  })
}))

```
