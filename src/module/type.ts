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
import * as Type from '../type/index.ts'
import * as Section from './section/index.ts'
import * as Static from './static/index.ts'
import * as Info from './info/index.ts'

// ------------------------------------------------------------------
// FromModule
// ------------------------------------------------------------------
function FromModule(context: Type.TProperties, module: Type.TModule): string {
  const writer = new Section.Writer()
  const names = Guard.Keys(module)
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
  // Validator
  for (const name of names) writer.WriteLine(Section.Validator(name, context, module[name], JSON.stringify(module[name])))
  // Export
  writer.WriteLine(Section.NamespaceExport(names, (name) => Static.FromType(module, module[name])))
  return writer.ToString()
}
// ------------------------------------------------------------------
// FromAnonymous
// ------------------------------------------------------------------
function FromAnonymous(context: Type.TProperties, type: Type.TSchema) {
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
  // Validator
  writer.WriteLine(Section.Validator('Anonymous', context, type, JSON.stringify(type)))
  // Export
  writer.WriteLine(Section.AnonymousExport('Anonymous', () => Static.FromType({}, type)))
  return writer.ToString()
}
// ------------------------------------------------------------------
// IsModule
// ------------------------------------------------------------------
function IsModule(module: Type.TSchema): module is Type.TModule {
  return !Guard.HasPropertyKey(module, '~kind')
}
// ------------------------------------------------------------------
// FromType
// ------------------------------------------------------------------
/** Generates a standalone Module from a TModule or TSchema definition. */
export function TypeModule(type: Type.TModule | Type.TSchema): string
/** Generates a standalone Module from a TModule or TSchema definition. */
export function TypeModule(context: Type.TProperties, type: Type.TModule | Type.TSchema): string
/** Generates a standalone Module from a TModule or TSchema definition. */
export function TypeModule(...args: unknown[]): string {
  const [context, type] = Arguments.Match<[Type.TProperties, Type.TModule | Type.TSchema]>(args, {
    2: (context, type) => [context, type],
    1: (type) => [{}, type]
  })
  return IsModule(type) ? FromModule(context, type) : FromAnonymous(context, type)
}
