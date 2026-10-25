/*--------------------------------------------------------------------------

TypeBox

The MIT License (MIT)

Copyright (c) 2017-2026 Haydn Paterson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import * as Schema from '../../../schema/index.ts'

import { FromAdditionalProperties } from './additionalProperties.ts'
import { FromAllOf } from './allOf.ts'
import { FromAnyOf } from './anyOf.ts'
import { FromConst } from './const.ts'
import { FromEnum } from './enum.ts'
import { FromIf } from './if.ts'
import { FromItems } from './items.ts'
import { FromOneOf } from './oneOf.ts'
import { FromPatternProperties } from './patternProperties.ts'
import { FromPrefixItems } from './prefixItems.ts'
import { FromProperties } from './properties.ts'
import { FromPropertyNames } from './propertyNames.ts'
import { FromRef } from './ref.ts'
import { FromRequired } from './required.ts'
import { FromType } from './type.ts'
import { FromUnevaluatedProperties } from './unevaluatedProperties.ts'

// ------------------------------------------------------------------
// FromKeywords
// ------------------------------------------------------------------
function FromKeywords(stack: string[], root: Schema.XSchema, schema: unknown): string[] {
  if (!Schema.IsSchema(schema)) return ['unknown']
  if (Schema.IsSchemaBoolean(schema)) return [`${schema}`]
  const result: string[] = []
  if (Schema.IsAdditionalProperties(schema)) result.push(FromAdditionalProperties(stack, root, schema.additionalProperties))
  if (Schema.IsAllOf(schema)) result.push(FromAllOf(stack, root, schema.allOf))
  if (Schema.IsAnyOf(schema)) result.push(FromAnyOf(stack, root, schema.anyOf))
  if (Schema.IsConst(schema)) result.push(FromConst(schema.const))
  if (Schema.IsIf(schema)) result.push(FromIf(stack, root, schema, schema.if))
  if (Schema.IsEnum(schema)) result.push(FromEnum(schema.enum))
  if (Schema.IsItems(schema)) result.push(FromItems(stack, root, schema, schema.items))
  if (Schema.IsOneOf(schema)) result.push(FromOneOf(stack, root, schema.oneOf))
  if (Schema.IsPatternProperties(schema)) result.push(FromPatternProperties(stack, root, schema.patternProperties))
  if (Schema.IsPrefixItems(schema)) result.push(FromPrefixItems(stack, root, schema, schema.prefixItems))
  if (Schema.IsProperties(schema)) result.push(FromProperties(stack, root, schema, schema.properties))
  if (Schema.IsPropertyNames(schema)) result.push(FromPropertyNames(stack, root, schema.propertyNames))
  if (Schema.IsRef(schema)) result.push(FromRef(stack, root, schema.$ref))
  if (Schema.IsRequired(schema)) result.push(FromRequired(stack, root, schema, schema.required))
  if (Schema.IsType(schema)) result.push(FromType(schema.type))
  if (Schema.IsUnevaluatedProperties(schema)) result.push(FromUnevaluatedProperties(stack, root, schema.unevaluatedProperties))
  return result.length === 0 ? ['unknown'] : result
}
// ------------------------------------------------------------------
// KeywordsIntersected
// ------------------------------------------------------------------
function KeywordsIntersected(schemas: string[]): string {
  return schemas.length === 0 ? 'unknown' : schemas.join(' & ')
}
// ------------------------------------------------------------------
// KeywordsEvaluated
// ------------------------------------------------------------------
function KeywordsEvaluated(schema: string): string {
  return schema // todo: should we Evaluate?
}
// ------------------------------------------------------------------
// StaticObject
// ------------------------------------------------------------------
export function FromSchemaObject(stack: string[], root: Schema.XSchema, schema: Schema.XSchema) {
  const keywords = FromKeywords(stack, root, schema)
  const intersected = KeywordsIntersected(keywords)
  const evaluated = KeywordsEvaluated(intersected)
  return evaluated
}
// ------------------------------------------------------------------
// FromBoolean
// ------------------------------------------------------------------
export function FromSchemaBoolean(schema: boolean) {
  return schema ? 'unknown' : 'never'
}
// ------------------------------------------------------------------
// StaticSchema
// ------------------------------------------------------------------
export function FromSchema(stack: string[], root: Schema.XSchema, schema: Schema.XSchema): string {
  return Schema.IsSchemaBoolean(schema) ? FromSchemaBoolean(schema) : FromSchemaObject(stack, root, schema)
}
