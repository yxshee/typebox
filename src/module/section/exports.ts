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

import { Banner } from './banner.ts'
import { Writer } from './writer.ts'

// ------------------------------------------------------------------
// NamespaceExport
// ------------------------------------------------------------------
export function NamespaceName(names: string[]): string {
  let name = `Namespace`
  while (names.includes(name)) name += '_'
  return name
}
export function NamespaceExport(names: string[], infer: (name: string) => string): string {
  const writer = new Writer()
  const namespaceName = NamespaceName(names)
  writer.WriteLine(Banner('Export'))
  writer.WriteLine(`declare namespace ${namespaceName} {`)
  for (const name of names) writer.WriteLine(`  export type ${name} = ${infer(name)}`)
  writer.WriteLine('}')
  for (const name of names) writer.WriteLine(`type ${name} = ${namespaceName}.${name}`)
  for (const name of names) writer.WriteLine(`export { ${name} }`)
  writer.WriteLine(`const ${namespaceName} = { ${names.join(', ')} }`)
  writer.WriteLine(`export default ${namespaceName}`)
  return writer.ToString()
}
// ------------------------------------------------------------------
// AnonymousExport
// ------------------------------------------------------------------
export function AnonymousExport(name: string, infer: (name: string) => string): string {
  const writer = new Writer()
  writer.WriteLine(Banner('Export'))
  writer.WriteLine(`type ${name} = ${infer(name)}`)
  writer.WriteLine(`const { Schema, Check, Parse } = ${name}`)
  writer.WriteLine(`export { Check, Parse, Schema }`)
  writer.WriteLine(`export default ${name}`)
  return writer.ToString()
}
