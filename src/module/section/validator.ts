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

import { Guard } from '../../guard/index.ts'
import * as Format from '../../format/index.ts'
import * as Schema from '../../schema/index.ts'
import { Writer } from './writer.ts'
import { Banner } from './banner.ts'

// ------------------------------------------------------------------
// ValidatorDefinition
// ------------------------------------------------------------------
export const ValidatorDefinition = () => (`${Banner('Types')}
export interface Validator<Value extends unknown = unknown> {
  /** Returns true if the value is valid for this type. */
  Check(value: unknown): value is Value
  /** Returns the value if it is valid for this type, otherwise throws a TypeError. */
  Parse(value: unknown): Value
  /** Returns the JSON Schema for this type. */
  Schema(): Readonly<Record<string, unknown> | boolean>
}`)

// ------------------------------------------------------------------
// Validator
// ------------------------------------------------------------------
function ValidatorSerialize(variable: unknown): string {
  // Regular Expression
  if (variable instanceof RegExp) return variable.toString()
  // Formats
  if (Guard.IsEqual(variable, Format.IsDate)) return 'Format.IsDate'
  if (Guard.IsEqual(variable, Format.IsDateTime)) return 'Format.IsDateTime'
  if (Guard.IsEqual(variable, Format.IsDuration)) return 'Format.IsDuration'
  if (Guard.IsEqual(variable, Format.IsEmail)) return 'Format.IsEmail'
  if (Guard.IsEqual(variable, Format.IsHostname)) return 'Format.IsHostname'
  if (Guard.IsEqual(variable, Format.IsIPv4)) return 'Format.IsIPv4'
  if (Guard.IsEqual(variable, Format.IsIPv6)) return 'Format.IsIPv6'
  if (Guard.IsEqual(variable, Format.IsIdnEmail)) return 'Format.IsIdnEmail'
  if (Guard.IsEqual(variable, Format.IsIdnHostname)) return 'Format.IsIdnHostname'
  if (Guard.IsEqual(variable, Format.IsIri)) return 'Format.IsIri'
  if (Guard.IsEqual(variable, Format.IsIriReference)) return 'Format.IsIriReference'
  if (Guard.IsEqual(variable, Format.IsJsonPointer)) return 'Format.IsJsonPointer'
  if (Guard.IsEqual(variable, Format.IsJsonPointerUriFragment)) return 'Format.IsJsonPointerUriFragment'
  if (Guard.IsEqual(variable, Format.IsRegex)) return 'Format.IsRegex'
  if (Guard.IsEqual(variable, Format.IsRelativeJsonPointer)) return 'Format.IsRelativeJsonPointer'
  if (Guard.IsEqual(variable, Format.IsTime)) return 'Format.IsTime'
  if (Guard.IsEqual(variable, Format.IsUri)) return 'Format.IsUri'
  if (Guard.IsEqual(variable, Format.IsUriReference)) return 'Format.IsUriReference'
  if (Guard.IsEqual(variable, Format.IsUriTemplate)) return 'Format.IsUriTemplate'
  if (Guard.IsEqual(variable, Format.IsUrl)) return 'Format.IsUrl'
  if (Guard.IsEqual(variable, Format.IsUuid)) return 'Format.IsUuid'
  // Function
  if (typeof variable === 'function') return variable.toString()
  // Value
  return JSON.stringify(variable)
}
function ValidatorExternals(build: Schema.BuildResult): string {
  const writer = new Writer(), { identifier, variables } = build.External()
  const serialized = variables.map((variable) => ValidatorSerialize(variable))
  writer.WriteLine(`  const ${identifier} = [${serialized.join(', ')}]`)
  return writer.ToString()
}
function ValidatorSchemas(schemaString: string): string {
  const writer = new Writer()
  writer.WriteLine(`  const schema_0 = Object.freeze(${schemaString})`)
  return writer.ToString()
}
function ValidatorChecks(build: Schema.BuildResult): string {
  const writer = new Writer()
  for (const check of build.Functions()) {
    writer.WriteLine('  // @ts-ignore')
    writer.WriteLine(`  ${check}`)
  }
  return writer.ToString()
}
function ValidatorInterface(name: string, build: Schema.BuildResult): string {
  const writer = new Writer()
  writer.WriteLine(`  const Schema = () => schema_0`)
  if (build.UseUnevaluated()) {
    writer.WriteLine(`  const Check = (value: unknown): value is ${name} => { const context = new CheckContext(); return ${build.Entry()} }`)
  } else {
    writer.WriteLine(`  const Check = (value: unknown): value is ${name} => ${build.Entry()}`)
  }
  writer.WriteLine(`  const Parse = (value: unknown): ${name} => Check(value) ? value : Exceptions.TypeError('${name}', value)`)
  return writer.ToString()
}
function ValidatorReturn(): string {
  const writer = new Writer()
  writer.WriteLine('  return { Check, Parse, Schema }')
  return writer.ToString()
}
export function Validator(name: string, context: Record<PropertyKey, Schema.XSchema>, schema: Schema.XSchema, schemaString: string): string {
  const writer = new Writer()
  const build = Schema.Build(context, schema)
  writer.WriteLine(Banner(name))
  writer.WriteLine(`const ${name}: Validator<${name}> = (() => {`)
  if (!Guard.IsEqual(build.External().variables.length, 0)) writer.WriteLine(ValidatorExternals(build))
  writer.WriteLine(ValidatorSchemas(schemaString))
  writer.WriteLine(ValidatorChecks(build))
  writer.WriteLine(ValidatorInterface(name, build))
  writer.WriteLine(ValidatorReturn())
  writer.WriteLine('})()')
  return writer.ToString()
}
