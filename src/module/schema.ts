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

import { Arguments } from '../system/index.ts'
import { Guard } from '../guard/index.ts'
import * as Schema from '../schema/index.ts'
import * as Section from './section/index.ts'
import * as Static from './static/index.ts'
import * as Info from './info/index.ts'

// ------------------------------------------------------------------
// FromModule
// ------------------------------------------------------------------
function FromModule(context: Record<PropertyKey, Schema.XSchema>, schema: Schema.XDefs): string {
  const writer = new Section.Writer()
  const names = Guard.Keys(schema.$defs)
  const info = Info.BuildInfo(true)
  // Required
  writer.WriteLine(Section.Exceptions())
  writer.WriteLine(Section.ValidatorDefinition())
  writer.WriteLine(Section.GuardModule())
  // Conditional
  if (info.UseGlobalGuardModule) writer.WriteLine(Section.GlobalsGuardModule())
  if (info.UseHashingModule) writer.WriteLine(Section.HashingModule())
  if (info.UseIdnaModule) writer.WriteLine(Section.IdnaModule())
  if (info.UseFormatModule) writer.WriteLine(Section.FormatModule(info))
  if (info.UseCheckContext) writer.WriteLine(Section.CheckContext())
  // Schema
  writer.WriteLine(Section.GlobalSchema(schema))
  // Validator
  for (const name of names) writer.WriteLine(Section.Validator(name, context, schema.$defs[name], `{ ...GlobalSchema, $ref: '#/$defs/${name}' }`))
  // Export
  writer.WriteLine(Section.NamespaceExport(names, (name) => Static.FromSchema([], schema, { ...schema, $ref: `#/$defs/${name}` })))
  return writer.ToString()
}
// ------------------------------------------------------------------
// FromAnonymous
// ------------------------------------------------------------------
function FromAnonymous(context: Record<PropertyKey, Schema.XSchema>, schema: Schema.XSchema) {
  const writer = new Section.Writer()
  const info = Info.BuildInfo(true)
  // Required
  writer.WriteLine(Section.Exceptions())
  writer.WriteLine(Section.ValidatorDefinition())
  writer.WriteLine(Section.GuardModule())
  // Conditional
  if (info.UseGlobalGuardModule) writer.WriteLine(Section.GlobalsGuardModule())
  if (info.UseHashingModule) writer.WriteLine(Section.HashingModule())
  if (info.UseIdnaModule) writer.WriteLine(Section.IdnaModule())
  if (info.UseFormatModule) writer.WriteLine(Section.FormatModule(info))
  if (info.UseCheckContext) writer.WriteLine(Section.CheckContext())
  // Schema
  writer.WriteLine(Section.GlobalSchema(schema))
  // Validator
  writer.WriteLine(Section.Validator('Anonymous', context, schema, 'GlobalSchema'))
  // Export
  writer.WriteLine(Section.AnonymousExport('Anonymous', () => Static.FromSchema([], schema, schema)))
  return writer.ToString()
}
// ------------------------------------------------------------------
// IsModule
// ------------------------------------------------------------------
function IsModule(schema: Schema.XSchema): schema is Schema.XDefs {
  return Schema.IsSchemaObject(schema) &&
    Schema.IsDefs(schema) &&
    (
      Guard.IsEqual(Guard.Keys(schema as never).length, 1) || (
        Guard.IsEqual(Guard.Keys(schema as never).length, 2) &&
        Guard.HasPropertyKey(schema, '$schema')
      )
    )
}
// ------------------------------------------------------------------
// JsonSchema
// ------------------------------------------------------------------
/** Generates a standalone Module from Json Schema. */
export function JsonSchema(schema: Schema.XSchema): string
/** Generates a standalone Module from Json Schema. */
export function JsonSchema(context: Record<PropertyKey, Schema.XSchema>, schema: Schema.XSchema): string
/** Generates a standalone Module from Json Schema. */
export function JsonSchema(...args: unknown[]): string {
  const [context, schema] = Arguments.Match<[Record<PropertyKey, Schema.XSchema>, Schema.XSchema]>(args, {
    2: (context, schema) => [context, schema],
    1: (schema) => [{}, schema]
  })
  return IsModule(schema) ? FromModule(context, schema) : FromAnonymous(context, schema)
}
