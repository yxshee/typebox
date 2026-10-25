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

// ------------------------------------------------------------------
// GuardModule
// ------------------------------------------------------------------
export const GuardModule = () => (`${Banner('Guard')}
const Guard = {
  IsArray: (value: unknown): value is unknown[] => {
    return Array.isArray(value)
  },
  IsBigInt: (value: unknown): value is bigint => {
    return typeof value === 'bigint'
  },
  IsBoolean: (value: unknown): value is boolean => {
    return typeof value === 'boolean'
  },
  IsConstructor: (value: unknown): value is new (...args: never[]) => unknown => {
    if (Guard.IsUndefined(value) || !Guard.IsFunction(value)) return false
    const result = Function.prototype.toString.call(value)
    if (/^class\s/.test(result)) return true
    if (/\[native code\]/.test(result)) return true
    return false
  },
  IsFunction: (value: unknown): value is globalThis.Function => {
    return typeof value === 'function'
  },
  IsInteger: (value: unknown): value is number => {
    return Number.isInteger(value)
  },
  IsNull: (value: unknown): value is null => {
    return value === null
  },
  IsNumber: (value: unknown): value is number => {
    return Number.isFinite(value)
  },
  IsObject: (value: unknown): value is Record<PropertyKey, unknown> => {
    return typeof value === 'object' && value !== null
  },
  IsString: (value: unknown): value is string => {
    return typeof value === 'string'
  },
  IsSymbol: (value: unknown): value is symbol => {
    return typeof value === 'symbol'
  },
  IsUndefined: (value: unknown): value is undefined => {
    return value === undefined
  },
  CodePointCount: (value: string): number => {
    let result = 0, index = 0, prev = 0
    while (index < value.length) {
      const next = value.charCodeAt(index++) >> 0xA
      result += +(((prev << 8) | next) !== 0x3637)
      prev = next
    }
    return result
  },
  IsMultipleOf: (dividend: bigint | number, divisor: bigint | number) => {
    if ((typeof dividend === 'bigint') || (typeof divisor === 'bigint')) {
      return BigInt(dividend) % BigInt(divisor) === 0n
    }
    const tolerance = 1e-10
    if (!Number.isFinite(dividend)) return true
    if (Number.isInteger(dividend) && (1 / divisor) % 1 === 0) return true
    const mod = dividend % divisor
    return Math.min(Math.abs(mod), Math.abs(mod - divisor), Math.abs(mod + divisor)) < tolerance
  },
  IsEqual: (left: unknown, right: unknown): boolean => {
    return left === right
  },
  Keys: (value: Record<PropertyKey, unknown>): string[] => {
    return Object.getOwnPropertyNames(value)
  },
  DeepEqualObject: (left: Record<PropertyKey, unknown>, right: unknown): boolean => {
    if (!Guard.IsObject(right)) return false
    const keys = Guard.Keys(left)
    return Guard.IsEqual(keys.length, Guard.Keys(right).length) &&
      keys.every((key) => Guard.IsDeepEqual(left[key], right[key]))
  },
  DeepEqualArray: (left: unknown[], right: unknown) => {
    return Guard.IsArray(right) && Guard.IsEqual(left.length, right.length) &&
      left.every((_, index) => Guard.IsDeepEqual(left[index], right[index]))
  },
  IsDeepEqual: (left: unknown, right: unknown): boolean => {
    return (
      Guard.IsArray(left) ? Guard.DeepEqualArray(left, right) : 
      Guard.IsObject(left) ? Guard.DeepEqualObject(left, right) : 
      Guard.IsEqual(left, right)
    )
  }
}`)
