import Module from 'typebox/module'
import Type from 'typebox'
import * as Fs from 'node:fs'

// done: tests
// done: build-info

// todo: investigate better type normalization
// todo: ignore generic types in compiler
// todo: handle refine
// todo: handle additional formats

const namespace = Module.JsonSchema({ $defs: Type.Script(`type A = string; type B = string; type C = string; type D = string;`) })
const anonymous = Module.JsonSchema(Type.Script(`{ x: number }`))
const scaling = Module.JsonSchema(JSON.parse(Fs.readFileSync('./example/mcp/spec.json', 'utf-8')))
const simple = Module.JsonSchema({ type: 'string' })

console.log(Fs.writeFileSync('./example/_anonymous.ts', anonymous))
console.log(Fs.writeFileSync('./example/_namespace.ts', namespace))
console.log(Fs.writeFileSync('./example/_scaling.ts', scaling))
console.log(Fs.writeFileSync('./example/_simple.ts', simple))

// import Anonymous from './_anonymous.ts'
// import { Check } from './_anonymous.ts'
// import Namespace from './_namespace.ts'
// import Mcp from './_scaling.ts'
// import { A } from './_namespace.ts'
// function testA(value: Namespace.A) {}
// function testB(value: A) {}
// function testC(value: Anonymous) {}
// function testD(value: Mcp.CallToolRequest) {}
// console.log(Anonymous.Check({}))
// console.log(Namespace.A.Check({}))
// console.log(A.Check({}))
// console.log(Check({}))
// console.log(Mcp.Annotations.Check({}))

// Namespace.A.Check({})
// console.log(A.Schema())
