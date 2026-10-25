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

// deno-fmt-ignore-file

import * as Type from '../../../type/index.ts'

import { FromAny } from './any.ts'
import { FromArray } from './array.ts'
import { FromBigInt } from './bigint.ts'
import { FromBoolean } from './boolean.ts'
import { FromCall } from './call.ts'
import { FromConstructor } from './constructor.ts'
import { FromCyclic } from './cyclic.ts'
import { FromDeferred } from './deferred.ts'
import { FromDependent } from './dependent.ts'
import { FromEnum } from './enum.ts'
import { FromFunction } from './function.ts'
import { FromGeneric } from './generic.ts'
import { FromIdentifier } from './identifier.ts'
import { FromInteger } from './integer.ts'
import { FromIntersect } from './intersect.ts'
import { FromLiteral } from './literal.ts'
import { FromNever } from './never.ts'
import { FromNull } from './null.ts'
import { FromNumber } from './number.ts'
import { FromObject } from './object.ts'
import { FromParameter } from './parameter.ts'
import { FromRecord } from './record.ts'
import { FromRef } from './ref.ts'
import { FromString } from './string.ts'
import { FromSymbol } from './symbol.ts'
import { FromTemplateLiteral } from './template_literal.ts'
import { FromThis } from './this.ts'
import { FromTuple } from './tuple.ts'
import { FromUndefined } from './undefined.ts'
import { FromUnion } from './union.ts'
import { FromUnknown } from './unknown.ts'
import { FromVoid } from './void.ts'

export function FromType(context: Type.TProperties, type: Type.TSchema): string {
  return (
    Type.IsAny(type) ? FromAny(context, type) :
    Type.IsArray(type) ? FromArray(context, type) :
    Type.IsBigInt(type) ? FromBigInt(context, type) :
    Type.IsBoolean(type) ? FromBoolean(context, type) :
    Type.IsCall(type) ? FromCall(context, type) :
    Type.IsConstructor(type) ? FromConstructor(context, type) :
    Type.IsCyclic(type) ? FromCyclic(context, type) :
    Type.IsDeferred(type) ? FromDeferred(context, type) :
    Type.IsDependent(type) ? FromDependent(context, type) :
    Type.IsEnum(type) ? FromEnum(context, type) :
    Type.IsFunction(type) ? FromFunction(context, type) :
    Type.IsGeneric(type) ? FromGeneric(context, type) :
    Type.IsIdentifier(type) ? FromIdentifier(context, type) :
    Type.IsInteger(type) ? FromInteger(context, type) :
    Type.IsIntersect(type) ? FromIntersect(context, type) :
    Type.IsLiteral(type) ? FromLiteral(context, type) :
    Type.IsNever(type) ? FromNever(context, type) :
    Type.IsNull(type) ? FromNull(context, type) :
    Type.IsNumber(type) ? FromNumber(context, type) :
    Type.IsObject(type) ? FromObject(context, type) :
    Type.IsParameter(type) ? FromParameter(context, type) :
    Type.IsRecord(type) ? FromRecord(context, type) :
    Type.IsRef(type) ? FromRef(context, type) :
    Type.IsString(type) ? FromString(context, type) :
    Type.IsSymbol(type) ? FromSymbol(context, type) :
    Type.IsTemplateLiteral(type) ? FromTemplateLiteral(context, type) :
    Type.IsThis(type) ? FromThis(context, type) :
    Type.IsTuple(type) ? FromTuple(context, type) :
    Type.IsUndefined(type) ? FromUndefined(context, type) :
    Type.IsUnion(type) ? FromUnion(context, type) :
    Type.IsUnknown(type) ? FromUnknown(context, type) :
    Type.IsVoid(type) ? FromVoid(context, type) :
    'never'
  )
}
