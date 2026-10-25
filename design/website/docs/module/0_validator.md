# Module.Validator


```typescript
export interface Validator<Value extends unknown = unknown> {
  /** Returns true if the value is valid for this type. */
  Check(value: unknown): value is Value
  /** Returns the value if it is valid for this type, otherwise throws a TypeError. */
  Parse(value: unknown): Value
  /** Returns the JSON Schema for this type. */
  Schema(): Readonly<Record<string, unknown> | boolean>
}
```