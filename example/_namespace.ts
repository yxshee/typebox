
// ------------------------------------------------------------------
// Exceptions
// ------------------------------------------------------------------
const Exceptions = {
  Unreachable: (): never => { throw globalThis.Error("Unreachable") },
  TypeError: (type: string, value: unknown): never => {
    const error = new globalThis.TypeError(`Invalid value for ${type}`)
    Object.defineProperty(error, 'cause', {
      value: value,
      writable: true,
      enumerable: false,
      configurable: true
    })
    throw error
  }
}

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface Validator<Value extends unknown = unknown> {
  /** Returns true if the value is valid for this type. */
  Check(value: unknown): value is Value
  /** Returns the value if it is valid for this type, otherwise throws a TypeError. */
  Parse(value: unknown): Value
  /** Returns the JSON Schema for this type. */
  Schema(): Readonly<Record<string, unknown> | boolean>
}

// ------------------------------------------------------------------
// Guard
// ------------------------------------------------------------------
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
    if (/^classs/.test(result)) return true
    if (/[native code]/.test(result)) return true
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
}

// ------------------------------------------------------------------
// GlobalsGuard
// ------------------------------------------------------------------
const GlobalsGuard = {
  IsBoolean: (value: unknown): value is globalThis.Boolean => {
    return value instanceof globalThis.Boolean
  },
  IsNumber: (value: unknown): value is globalThis.Number => {
    return value instanceof globalThis.Number
  },
  IsString: (value: unknown): value is globalThis.String => {
    return value instanceof globalThis.String
  },
  IsTypeArray: (value: unknown): value is ArrayBufferView => {
    return globalThis.ArrayBuffer.isView(value)
  },
  IsInt8Array: (value: unknown): value is Int8Array => {
    return value instanceof globalThis.Int8Array
  },
  IsUint8Array: (value: unknown): value is Uint8Array => {
    return value instanceof globalThis.Uint8Array
  },
  IsUint8ClampedArray: (value: unknown): value is Uint8ClampedArray => {
    return value instanceof globalThis.Uint8ClampedArray
  },
  IsInt16Array: (value: unknown): value is Int16Array => {
    return value instanceof globalThis.Int16Array
  },
  IsUint16Array: (value: unknown): value is Uint16Array => {
    return value instanceof globalThis.Uint16Array
  },
  IsInt32Array: (value: unknown): value is Int32Array => {
    return value instanceof globalThis.Int32Array
  },
  IsUint32Array: (value: unknown): value is Uint32Array => {
    return value instanceof globalThis.Uint32Array
  },
  IsFloat32Array: (value: unknown): value is Float32Array => {
    return value instanceof globalThis.Float32Array
  },
  IsFloat64Array: (value: unknown): value is Float64Array => {
    return value instanceof globalThis.Float64Array
  },
  IsBigInt64Array: (value: unknown): value is BigInt64Array => {
    return value instanceof globalThis.BigInt64Array
  },
  IsBigUint64Array: (value: unknown): value is BigUint64Array => {
    return value instanceof globalThis.BigUint64Array
  },
  IsRegExp: (value: unknown): value is globalThis.RegExp => {
    return value instanceof globalThis.RegExp
  },
  IsDate: (value: unknown): value is globalThis.Date => {
    return value instanceof globalThis.Date
  },
  IsSet: (value: unknown): value is globalThis.Set<unknown> => {
    return value instanceof globalThis.Set
  },
  IsMap: (value: unknown): value is globalThis.Map<unknown, unknown> => {
    return value instanceof globalThis.Map
  }
}

// ------------------------------------------------------------------
// Hashing
// ------------------------------------------------------------------
const Hashing = (() => {
  function InstanceKeys(value: Record<PropertyKey, unknown>): PropertyKey[] {
    const propertyKeys = new Set<PropertyKey>()
    let current = value
    while (current && current !== Object.prototype) {
      for (const key of Reflect.ownKeys(current)) {
        if (key !== 'constructor' && typeof key !== 'symbol') propertyKeys.add(key)
      }
      current = Object.getPrototypeOf(current)
    }
    return [...propertyKeys]
  }
  function IsIEEE754(value: unknown): value is number {
    return typeof value === 'number'
  }
  const ByteMarker = {
    Array: 0x0,
    BigInt: 0x1,
    Boolean: 0x2,
    Date: 0x3,
    Constructor: 0x4,
    Function: 0x5,
    Null: 0x6,
    Number: 0x7,
    Object: 0x8,
    RegExp: 0x9,
    String: 0xA,
    Symbol: 0xB,
    TypeArray: 0xC,
    Undefined: 0xD
  } as const

  let A0 = 0x2325, A1 = 0x8422, A2 = 0x9CE4, A3 = 0xCBF2
  const F64 = new Float64Array(1)
  const F64In = new DataView(F64.buffer)
  const F64Out = new Uint8Array(F64.buffer)

  function FNV1A64_OP(byte: number) {
    const L0 = A0 ^ byte
    const T0 = L0 * 0x1B3
    const T1 = A1 * 0x1B3 + (T0 >>> 16)
    const T2 = A2 * 0x1B3 + (T1 >>> 16) + (L0 << 8)
    const T3 = A3 * 0x1B3 + (T2 >>> 16) + (A1 << 8)
    A0 = T0 & 0xFFFF
    A1 = T1 & 0xFFFF
    A2 = T2 & 0xFFFF
    A3 = T3 & 0xFFFF
  }
  function FromArray(value: unknown[]): void {
    FNV1A64_OP(ByteMarker.Array)
    for (const item of value) {
      FromValue(item)
    }
  }
  function FromBigInt(value: bigint): void {
    FNV1A64_OP(ByteMarker.BigInt)
    F64In.setBigInt64(0, value)
    for (const byte of F64Out) {
      FNV1A64_OP(byte)
    }
  }
  function FromBoolean(value: boolean): void {
    FNV1A64_OP(ByteMarker.Boolean)
    FNV1A64_OP(value ? 1 : 0)
  }
  function FromConstructor(value: new () => unknown): void {
    FNV1A64_OP(ByteMarker.Constructor)
    FromValue(value.toString())
  }
  function FromDate(value: Date): void {
    FNV1A64_OP(ByteMarker.Date)
    FromValue(value.getTime())
  }
  function FromFunction(value: globalThis.Function): void {
    FNV1A64_OP(ByteMarker.Function)
    FromValue(value.toString())
  }
  function FromNull(_value: null): void {
    FNV1A64_OP(ByteMarker.Null)
  }
  function FromNumber(value: number): void {
    FNV1A64_OP(ByteMarker.Number)
    F64In.setFloat64(0, value, true /* little-endian */)
    for (const byte of F64Out) {
      FNV1A64_OP(byte)
    }
  }
  function FromObject(value: Record<PropertyKey, unknown>): void {
    FNV1A64_OP(ByteMarker.Object)
    for (const key of InstanceKeys(value).sort()) {
      FromValue(key)
      FromValue(value[key])
    }
  }
  function FromRegExp(value: RegExp): void {
    FNV1A64_OP(ByteMarker.RegExp)
    FromString(value.toString())
  }
  const encoder = new TextEncoder()
  function FromString(value: string): void {
    FNV1A64_OP(ByteMarker.String)
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      if (code > 0x7F) {
        for (const byte of encoder.encode(value.slice(i))) {
          FNV1A64_OP(byte)
        }
        return
      }
      FNV1A64_OP(code)
    }
  }
  function FromSymbol(value: symbol): void {
    FNV1A64_OP(ByteMarker.Symbol)
    FromValue(value.toString())
  }
  function FromTypeArray(value: ArrayBufferView): void {
    FNV1A64_OP(ByteMarker.TypeArray)
    const buffer = new Uint8Array(value.buffer)
    for (let i = 0; i < buffer.length; i++) {
      FNV1A64_OP(buffer[i])
    }
  }
  function FromUndefined(_value: undefined): void {
    return FNV1A64_OP(ByteMarker.Undefined)
  }
  function FromValue(value: unknown): void {
    return (
      GlobalsGuard.IsTypeArray(value) ? FromTypeArray(value) :
      GlobalsGuard.IsDate(value) ? FromDate(value) :
      GlobalsGuard.IsRegExp(value) ? FromRegExp(value) :
      GlobalsGuard.IsBoolean(value) ? FromBoolean(value.valueOf()) :
      GlobalsGuard.IsString(value) ? FromString(value.valueOf()) :
      GlobalsGuard.IsNumber(value) ? FromNumber(value.valueOf()) :
      IsIEEE754(value) ? FromNumber(value) :
      Guard.IsArray(value) ? FromArray(value) :
      Guard.IsBoolean(value) ? FromBoolean(value) :
      Guard.IsBigInt(value) ? FromBigInt(value) :
      Guard.IsConstructor(value) ? FromConstructor(value) :
      Guard.IsNull(value) ? FromNull(value) :
      Guard.IsObject(value) ? FromObject(value) :
      Guard.IsString(value) ? FromString(value) :
      Guard.IsSymbol(value) ? FromSymbol(value) :
      Guard.IsUndefined(value) ? FromUndefined(value) :
      Guard.IsFunction(value) ? FromFunction(value) :
      Exceptions.Unreachable()
    )
  }
  function Hex(limb: number): string {
    return limb.toString(16).padStart(4, '0')
  }
  function Hash(value: unknown): string {
    A0 = 0x2325, A1 = 0x8422, A2 = 0x9CE4, A3 = 0xCBF2
    FromValue(value)
    return `${Hex(A3)}${Hex(A2)}${Hex(A1)}${Hex(A0)}`
  }
  return { Hash }
})()

// ------------------------------------------------------------------
// Idna
// ------------------------------------------------------------------
const Idna = (() => {
  // ----------------------------------------------------------------
  // Pattern
  // ----------------------------------------------------------------
  const Pattern = (() => {
    const RE_RULE_HYPHEN_PLACEMENT = /^(?!-).*(?<!-)$/
    const RE_RULE_NOT_RESERVED_ACE = /^(?!..--)/
    const RE_ASCII_LDH = /^[a-zA-Z0-9-]*$/
    const RE_ASCII = /^\p{ASCII}*$/u
    const RE_NON_ASCII = /[^\p{ASCII}]/u
    const RE_HIGH_SURROGATE = /[\u{d800}-\u{dbff}]/u
    const RE_REGIONAL_INDICATOR = /[\u{1f1e6}-\u{1f1ff}]/u
    const RE_VARIATION_SELECTOR = /[\u{fe00}-\u{fe0f}]/u
    const RE_ZERO_WIDTH_JOINER = /\u{200d}/u
    const RE_ASCII_DIGIT = /[0-9]/
    const RE_ARABIC_INDIC_DIGIT = /[\u{0660}-\u{0669}]/u
    const RE_EXT_ARABIC_INDIC_DIGIT = /[\u{06f0}-\u{06f9}]/u
    const RE_COMMON_SEPARATOR = /[\u{002e}\u{002c}\u{003a}\u{002f}]/u
    const RE_EUROPEAN_SEPARATOR = /[\u{002d}\u{002b}]/u
    const RE_MARK_NONSPACING = /\p{Mn}/u
    const RE_MARK_SPACING_COMBINING = /\p{Mc}/u
    const RE_MARK_ENCLOSING = /\p{Me}/u
    const RE_COMBINING_MARK = /[\p{Mn}\p{Mc}\p{Me}]/u
    const RE_LETTER = /\p{L}/u
    const RE_NUMBER_DECIMAL = /\p{Nd}/u
    const RE_SCRIPT_GREEK = /\p{Script=Greek}/u
    const RE_SCRIPT_HEBREW = /\p{Script=Hebrew}/u
    const RE_SCRIPT_JAPANESE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u
    const RE_SCRIPT_ARABIC_LETTER = /[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Mandaic}]/u
    const RE_VIRAMA = /[\u{094d}\u{09cd}\u{0a4d}\u{0acd}\u{0b4d}\u{0bcd}\u{0c4d}\u{0ccd}\u{0d3b}\u{0d3c}\u{0d4d}\u{0dca}\u{1b44}\u{1baa}\u{1bab}\u{a9c0}\u{11046}\u{1107f}\u{110b9}\u{11133}\u{11134}\u{111c0}\u{11235}\u{1134d}\u{11442}\u{114c2}\u{115bf}\u{1163f}\u{116b6}\u{11c3f}\u{11d44}\u{11d45}]/u
    const RE_RFC5892_DISALLOWED = /[\u{0640}\u{07fa}\u{302e}\u{302f}\u{3031}\u{3032}\u{3033}\u{3034}\u{3035}\u{303b}]/u
    const RE_CONTEXTO_EXCEPTIONS = /[\u{00b7}\u{0375}\u{05f3}\u{05f4}\u{200c}\u{200d}\u{30fb}]/u
    const RE_PVALID_EXCEPTIONS = /[\u{00df}\u{03c2}\u{06fd}\u{06fe}\u{0f0b}\u{3007}]/u
    const RE_EUROPEAN_NUMBER = new RegExp([
      RE_ASCII_DIGIT,
      RE_EXT_ARABIC_INDIC_DIGIT
    ].map((regexp) => regexp.source).join('|'), 'u')
    const RE_PERMITTED_CATEGORY = new RegExp([
      RE_LETTER,
      RE_EUROPEAN_SEPARATOR,
      RE_COMMON_SEPARATOR,
      RE_NUMBER_DECIMAL,
      RE_MARK_NONSPACING,
      RE_MARK_SPACING_COMBINING,
      RE_CONTEXTO_EXCEPTIONS,
      RE_PVALID_EXCEPTIONS
    ].map((regexp) => regexp.source).join('|'), 'u')
    return {
      RE_RULE_HYPHEN_PLACEMENT,
      RE_RULE_NOT_RESERVED_ACE,
      RE_ASCII_LDH,
      RE_ASCII,
      RE_NON_ASCII,
      RE_HIGH_SURROGATE,
      RE_REGIONAL_INDICATOR,
      RE_VARIATION_SELECTOR,
      RE_ZERO_WIDTH_JOINER,
      RE_ASCII_DIGIT,
      RE_ARABIC_INDIC_DIGIT,
      RE_EXT_ARABIC_INDIC_DIGIT,
      RE_COMMON_SEPARATOR,
      RE_EUROPEAN_SEPARATOR,
      RE_MARK_NONSPACING,
      RE_MARK_SPACING_COMBINING,
      RE_MARK_ENCLOSING,
      RE_COMBINING_MARK,
      RE_LETTER,
      RE_NUMBER_DECIMAL,
      RE_SCRIPT_GREEK,
      RE_SCRIPT_HEBREW,
      RE_SCRIPT_JAPANESE,
      RE_SCRIPT_ARABIC_LETTER,
      RE_VIRAMA,
      RE_RFC5892_DISALLOWED,
      RE_CONTEXTO_EXCEPTIONS,
      RE_PVALID_EXCEPTIONS,
      RE_EUROPEAN_NUMBER,
      RE_PERMITTED_CATEGORY
    }
  })()
  // ------------------------------------------------------------------
  // FormatPuny
  // ------------------------------------------------------------------
  const FormatPuny = (() => {
    const RE_REPLACE_NON_ASCII = new RegExp(Pattern.RE_NON_ASCII.source, 'gu')
    // ------------------------------------------------------------------
    // PunyCode (RFC 3492)
    // ------------------------------------------------------------------
    const PUNYCODE_BASE = 36
    const PUNYCODE_TMIN = 1
    const PUNYCODE_TMAX = 26
    const PUNYCODE_SKEW = 38
    const PUNYCODE_DAMP = 700
    const PUNYCODE_INITIAL_BIAS = 72
    const PUNYCODE_INITIAL_N = 128
    // ------------------------------------------------------------------
    // ThrowDontCare
    // ------------------------------------------------------------------
    function ThrowDontCare(): never {
      throw null
    }
    // ------------------------------------------------------------------
    // IsAcePrefixed
    // ------------------------------------------------------------------
    function IsAcePrefixed(value: string): boolean {
      return value.toLowerCase().startsWith('xn--')
    }
    // ------------------------------------------------------------------
    // Adapt
    // ------------------------------------------------------------------
    function Adapt(delta: number, numPoints: number, firstTime: boolean): number {
      delta = firstTime ? Math.floor(delta / PUNYCODE_DAMP) : delta >> 1
      delta += Math.floor(delta / numPoints)
      let k = 0
      while (delta > (((PUNYCODE_BASE - PUNYCODE_TMIN) * PUNYCODE_TMAX) >> 1)) {
        delta = Math.floor(delta / (PUNYCODE_BASE - PUNYCODE_TMIN))
        k += PUNYCODE_BASE
      }
      return k + Math.floor(((PUNYCODE_BASE - PUNYCODE_TMIN + 1) * delta) / (delta + PUNYCODE_SKEW))
    }
    // ------------------------------------------------------------------
    // Decode
    // ------------------------------------------------------------------
    function Decode(value: string): string {
      const output: number[] = []
      let n = PUNYCODE_INITIAL_N
      let i = 0
      let bias = PUNYCODE_INITIAL_BIAS
      const delimIdx = value.lastIndexOf('-')
      if (delimIdx > 0) {
        for (let j = 0; j < delimIdx; j++) {
          const cp = value.charCodeAt(j)
          if (cp >= 128) ThrowDontCare() // throw new Error('Invalid punycode: non-basic before delimiter')
          output.push(cp)
        }
      }
      let inIdx = delimIdx < 0 ? 0 : delimIdx + 1
      while (inIdx < value.length) {
        const oldi = i
        let w = 1
        let k = PUNYCODE_BASE
        while (true) {
          if (inIdx >= value.length) ThrowDontCare() // throw new Error('Invalid punycode: unexpected end of input')
          const ch = value.charCodeAt(inIdx++)
          let digit: number
          if (ch >= 0x61 && ch <= 0x7a) digit = ch - 0x61 // a-z => 0-25
          else if (ch >= 0x30 && ch <= 0x39) digit = ch - 0x30 + 26 // 0-9 => 26-35
          // else if (ch >= 0x41 && ch <= 0x5a) digit = ch - 0x41 // A-Z => 0-25 // (no-spec-coverage)
          else ThrowDontCare() // throw new Error('Invalid punycode: bad digit character')
          i += digit * w
          const t = k <= bias ? PUNYCODE_TMIN : k >= bias + PUNYCODE_TMAX ? PUNYCODE_TMAX : k - bias
          if (digit < t) break
          w *= PUNYCODE_BASE - t
          k += PUNYCODE_BASE
        }
        const outLen = output.length + 1
        bias = Adapt(i - oldi, outLen, oldi === 0)
        n += Math.floor(i / outLen)
        i %= outLen
        output.splice(i, 0, n)
        i++
      }
      return String.fromCodePoint(...output)
    }
    function DigitToChar(digit: number): string {
      return digit < 26 ? String.fromCharCode(digit + 0x61) : String.fromCharCode(digit - 26 + 0x30)
    }
    function Encode(input: string): string {
      // Extract basic ASCII characters and set initial output array state
      const basic = input.replace(RE_REPLACE_NON_ASCII, '')
      const basicLength = basic.length
      const result = basicLength > 0 ? [basic, '-'] : []
      // Extract unicode codepoints
      const codePoints = Array.from(input, (char) => char.codePointAt(0)!)
      let n = PUNYCODE_INITIAL_N
      let delta = 0
      let bias = PUNYCODE_INITIAL_BIAS
      let handledCPCount = basicLength
      while (handledCPCount < codePoints.length) {
        let m = Infinity
        for (const cp of codePoints) {
          if (cp >= n && cp < m) m = cp
        }
        delta += (m - n) * (handledCPCount + 1)
        n = m
        for (const cp of codePoints) {
          if (cp < n) delta++
          if (cp === n) {
            let q = delta
            for (let k = PUNYCODE_BASE; ; k += PUNYCODE_BASE) {
              const t = k <= bias ? PUNYCODE_TMIN : k >= bias + PUNYCODE_TMAX ? PUNYCODE_TMAX : k - bias
              if (q < t) break
              const digit = t + ((q - t) % (PUNYCODE_BASE - t))
              result.push(DigitToChar(digit))
              q = Math.floor((q - t) / (PUNYCODE_BASE - t))
            }
            result.push(DigitToChar(q))
            bias = Adapt(delta, handledCPCount + 1, handledCPCount === basicLength)
            delta = 0
            handledCPCount++
          }
        }
        delta++
        n++
      }
      return result.join('')
    }
    return { Adapt, Decode, Encode, IsAcePrefixed }
  })()
  const FormatBidi = (() => {
    // ------------------------------------------------------------------
    // LOCAL REGEX: Allowed Bidi classes per direction (RFC 5893)
    // ------------------------------------------------------------------
    const RE_RTL_ALLOWED = /^(?:R|AL|AN|EN|ES|CS|ET|ON|BN|NSM)$/
    const RE_LTR_ALLOWED = /^(?:L|EN|ES|CS|ET|ON|BN|NSM)$/
    const RE_RTL_CLASSES = /^(?:R|AL|AN)$/

    // ------------------------------------------------------------------
    // HasBidiChars
    //
    // Decodes a punycode label to its Unicode form (if it is one) and
    // checks whether the result is an RTL label per RFC 5893 §1.4.
    // ------------------------------------------------------------------
    function HasBidiChars(value: string): boolean {
      if (FormatPuny.IsAcePrefixed(value)) {
        try {
          return HasRightToLeftCharacters(FormatPuny.Decode(value.slice(4).toLowerCase()))
        } catch {
          return false
        }
      }
      return HasRightToLeftCharacters(value)
    }
    // ------------------------------------------------------------------
    // GetBidiClass
    // ------------------------------------------------------------------
    function GetBidiClass(codePoint: number): string {
      const char = String.fromCodePoint(codePoint)
      return (
        Pattern.RE_EUROPEAN_NUMBER.test(char) ? 'EN' :
        Pattern.RE_ARABIC_INDIC_DIGIT.test(char) ? 'AN' :
        // Pattern.RE_EUROPEAN_SEPARATOR.test(char) ? 'ES' : // (no-spec-coverage)
        // Pattern.RE_COMMON_SEPARATOR.test(char) ? 'CS' : // (no-spec-coverage)
        Pattern.RE_MARK_NONSPACING.test(char) ? 'NSM' :
        Pattern.RE_SCRIPT_HEBREW.test(char) ? 'R' :
        Pattern.RE_SCRIPT_ARABIC_LETTER.test(char) ? 'AL' :
        Pattern.RE_LETTER.test(char) ? 'L' :
        'ON'
      )
    }
    // ------------------------------------------------------------------
    // HasRightToLeftCharacters
    //
    // Per RFC 5893 §1.4: "An RTL label is a label that contains at least
    // one character of type R, AL, or AN." Used to determine whether a
    // domain name is a "Bidi domain name" (RFC 5893 §1.4), in which case
    // the Bidi Rule applies to every label in the domain.
    // ------------------------------------------------------------------
    function HasRightToLeftCharacters(value: string): boolean {
      for (const ch of value) if (RE_RTL_CLASSES.test(GetBidiClass(ch.codePointAt(0)!))) return true
      return false
    }
    // ------------------------------------------------------------------
    // SatisfiesBidiRule
    // ------------------------------------------------------------------
    function SatisfiesBidiRule(value: string): boolean {
      let isRtl = false
      let allowed = RE_LTR_ALLOWED
      let sawEN = false
      let sawAN = false
      let isFirst = true
      // let lastClass: string | null = null // (no-spec-coverage)
      for (const ch of value) {
        const bidiClass = GetBidiClass(ch.codePointAt(0)!)
        if (isFirst) {
          // 1. The first character must be a character with Bidi property L, R, or AL.
          if (bidiClass !== 'L' && bidiClass !== 'R' && bidiClass !== 'AL') return false
          isRtl = bidiClass === 'R' || bidiClass === 'AL'
          allowed = isRtl ? RE_RTL_ALLOWED : RE_LTR_ALLOWED
          isFirst = false
        }
        // 2 / 5. Only characters in the allowed set for this direction may appear.
        if (!allowed.test(bidiClass)) return false
        if (bidiClass === 'EN') sawEN = true
        else if (bidiClass === 'AN') sawAN = true
        // if (bidiClass !== 'NSM') lastClass = bidiClass // (no-spec-coverage)
      }
      if (isRtl && sawEN && sawAN) return false // spec coverage path
      // (no-spec-coverage)
      // if (isRtl) {
      //   // 3. The end of the label must be R, AL, EN, or AN (ignoring trailing NSM).
      //   // if (lastClass !== 'R' && lastClass !== 'AL' && lastClass !== 'EN' && lastClass !== 'AN') return false
      //   // 4. If an EN is present, no AN may be present, and vice versa.
      //   if (sawEN && sawAN) return false
      // } else {
      //   // 6. The end of the label must be L or EN (ignoring trailing NSM).
      //   // if (lastClass !== 'L' && lastClass !== 'EN') return false
      // }
      return true
    }
    return { HasRightToLeftCharacters, SatisfiesBidiRule, HasBidiChars }
  })()
  // -------------------------------------------------------------------
  // LabelUnicode
  // -------------------------------------------------------------------
  const LabelUnicode = (() => {
    // ------------------------------------------------------------------
    // ExceedsMaxALabelLength
    //
    // RFC 5890 §2.3.2.1: an A-label (the ACE-encoded form of a label,
    // "xn--" + punycode) must not exceed 63 octets. Only labels
    // containing non-ASCII characters need checking - a pure-ASCII label
    // has no "xn--" prefix and is used as-is, so its punycode-encoded
    // length is irrelevant. The ASCII check is a cheap short-circuit that
    // avoids running the punycode encoder on labels that don't need it.
    // ------------------------------------------------------------------
    function ExceedsMaxALabelLength(value: string): boolean {
      return Pattern.RE_NON_ASCII.test(value) && FormatPuny.Encode(value).length + 4 > 63
    }
    // ------------------------------------------------------------------
    // HasInvalidHyphens
    //
    // RFC 5891 §4.2.3.2: label must not start or end with a hyphen, and
    // must not have hyphens in the 3rd and 4th codepoint positions (the
    // ACE prefix reservation, e.g. "xn--"). Operates on chars (the
    // per-codepoint string array) rather than raw string indices so
    // supplementary-plane characters earlier in the label don't throw
    // off the codepoint-position count.
    // ------------------------------------------------------------------
    function HasInvalidHyphens(chars: string[]): boolean {
      if (chars[0] === '-' || chars[chars.length - 1] === '-') return true
      return chars.slice(2).join('').startsWith('--')
    }
    // ------------------------------------------------------------------
    // IsUnicodeLabel
    // ------------------------------------------------------------------
    function IsUnicodeLabel(value: string): boolean {
      // RFC 5890 §2.3.2.1: Ensure Max Length
      if (ExceedsMaxALabelLength(value)) return false
      // RFC 5893 - Bidi Rule (applies whenever this label itself is RTL)
      if (FormatBidi.HasRightToLeftCharacters(value) && !FormatBidi.SatisfiesBidiRule(value)) return false
      const chars = [...value]
      const codePoints = chars.map((c) => c.codePointAt(0)!)
      const length = codePoints.length
      // RFC 5891 §4.2.3.2: Hyphen rules
      if (HasInvalidHyphens(chars)) return false
      // RFC 5891 §4.2.3.2 - Must not begin with a combining mark
      if (Pattern.RE_COMBINING_MARK.test(chars[0])) return false
      let hasJapanese = false
      // let hasArabicIndic = false // (no-spec-coverage)
      // let hasExtendedArabicIndic = false // (no-spec-coverage)
      for (let i = 0; i < length; i++) {
        const codePoint = codePoints[i]
        const char = chars[i]
        // 1. DISALLOWED exceptions
        if (Pattern.RE_RFC5892_DISALLOWED.test(char)) return false
        // 1b. General category (PVALID) enforcement
        if (!Pattern.RE_PERMITTED_CATEGORY.test(char)) return false
        // 2. Collect Flags
        if (Pattern.RE_SCRIPT_JAPANESE.test(char)) hasJapanese = true
        // if (Pattern.RE_ARABIC_INDIC_DIGIT.test(char)) hasArabicIndic = true  // (no-spec-coverage)
        // if (Pattern.RE_EXT_ARABIC_INDIC_DIGIT.test(char)) hasExtendedArabicIndic = true  // (no-spec-coverage)
        // 3. CONTEXTO / CONTEXTJ Neighbor Rules
        const prev = codePoints[i - 1], next = codePoints[i + 1]
        switch (codePoint) {
          case 0x00b7:
            if (prev !== 0x006c || next !== 0x006c) return false
            break // MIDDLE DOT (Catalan)
          case 0x0375:
            if (!next || !Pattern.RE_SCRIPT_GREEK.test(chars[i + 1])) return false
            break // Greek KERAIA
          case 0x05f3:
          case 0x05f4:
            if (!prev || !Pattern.RE_SCRIPT_HEBREW.test(chars[i - 1])) return false
            break // Hebrew GERESH
          case 0x200c: // ZWNJ - RFC 5892 Appendix A.1
            // Note: Full validation requires a Unicode joining type table. We reject
            // only when preceded by ASCII (U+0000-U+007F), which can never satisfy
            // the Virama or cursive-joining rules.
            if (!prev || (prev < 0x0080 && !Pattern.RE_VIRAMA.test(chars[i - 1]))) return false
            break
          case 0x200d: // ZWJ: RFC 5892 Appendix A.2
            if (!prev || !Pattern.RE_VIRAMA.test(chars[i - 1])) return false
            break
          case 0x30fb: // Checked at end via hasJapanese
            break // KATAKANA MIDDLE DOT
        }
      }
      // 4. Global Context Validations (Post-loop)
      // RFC 5892 Appendix A.7 - Katakana Middle Dot requirement
      if (value.includes('\u30fb') && !hasJapanese) return false
      // RFC 5892 Appendix A.8/A.9 - Mixing Arabic Digits
      // if (hasArabicIndic && hasExtendedArabicIndic) return false // (no-spec-coverage)
      return true
    }
    return { IsUnicodeLabel }
  })()
  // -------------------------------------------------------------------
  // LabelAscii
  // -------------------------------------------------------------------
  const LabelAscii = (() => {
    function IsAsciiLabel(value: string): boolean {
      return (
        Pattern.RE_RULE_HYPHEN_PLACEMENT.test(value) &&
        Pattern.RE_RULE_NOT_RESERVED_ACE.test(value) &&
        Pattern.RE_ASCII_LDH.test(value)
      )
    }
    return { IsAsciiLabel }
  })()
  // -------------------------------------------------------------------
  // LabelPuny
  // -------------------------------------------------------------------
  const LabelPuny = (() => {
    function IsPunyLabel(value: string): boolean {
      if (!FormatPuny.IsAcePrefixed(value)) return false
      try {
        const body = value.slice(4).toLowerCase()
        // A payload consisting of only a hyphen, or starting with the delimiter
        // (like "-9uc"), has 0 basic ASCII characters preceding it and is malformed.
        if (body.lastIndexOf('-') === 0) return false
        const decoded = FormatPuny.Decode(body)
        // RFC 5890 §2.3.2.1 - a U-label must contain at least one non-ASCII
        // character. Code-unit level check: any non-ASCII codepoint has at least
        // one UTF-16 unit >= 0x80 (surrogate halves included), so no need to
        // decode codepoints or allocate a character array to answer this.
        if (!Pattern.RE_NON_ASCII.test(decoded)) return false
        return LabelUnicode.IsUnicodeLabel(decoded)
      } catch {
        return false
      }
    }
    return { IsPunyLabel }
  })()
  // -------------------------------------------------------------------
  // IsIdnHostname
  // -------------------------------------------------------------------
  const IsIdnHostname = (() => {
    // ------------------------------------------------------------------
    // IsLabel
    // ------------------------------------------------------------------
    function IsValidLabelLength(value: string): boolean {
      return value.length > 0 && value.length <= 63
    }
    function IsLabel(value: string): boolean {
      return IsValidLabelLength(value) && (
        LabelPuny.IsPunyLabel(value) ||
        LabelUnicode.IsUnicodeLabel(value)
      )
    }
    // ------------------------------------------------------------------
    // NormalizeHostname
    //
    // Normalizes a hostname for label validation. Maps fullwidth
    // codepoints to their ASCII equivalent (e.g. 'ａ' U+FF41 maps to
    // 'a'), then normalizes for NFC such that equivalent codepoint
    // sequences can be uniformly compared. It also removes codepoints
    // that IDNA mapping ignores, and converts full stop variants to
    // ASCII '.' so the hostname can be split into labels.
    // ------------------------------------------------------------------
    function NormalizeHostname(value: string): string {
      return value
        .replace(/[\uff01-\uff5e]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)) // RE_FULLWIDTH_MAPPING
        .normalize('NFC')
        .replace(/[\u00ad\u034f\u180b-\u180d\u200b\ufe00-\ufe0f\u{e0100}-\u{e01ef}]/gu, '') // RE_IGNORED_MAPPING
        .replace(/[\u002E\u3002\uFF0E\uFF61]/g, '.') // RE_FULL_STOP_MAPPING
    }
    // ------------------------------------------------------------------
    // IsIdnHostname
    // ------------------------------------------------------------------
    return (value: string): boolean => {
      if (value.length === 0 || value.includes(' ')) return false
      const normalized = NormalizeHostname(value)
      if (normalized.length > 253) return false
      const labels = normalized.split('.')
      const hasBidiChars = labels.some((label) => FormatBidi.HasBidiChars(label))
      return labels.every((label) => IsLabel(label) && (!hasBidiChars || FormatBidi.SatisfiesBidiRule(label)))
    }
  })()
  const IsHostname = (() => {
    function IsValidLabelLength(value: string): boolean {
      return value.length > 0 && value.length <= 63
    }
    function IsLabel(value: string): boolean {
      return IsValidLabelLength(value) && (
        LabelPuny.IsPunyLabel(value) ||
        LabelAscii.IsAsciiLabel(value)
      )
    }
    return (value: string): boolean => {
      if (value.length === 0 || value.length > 253) return false
      if (value.charCodeAt(value.length - 1) === 46) return false
      return value.split('.').every((label) => IsLabel(label))
    }
  })()
  return { IsIdnHostname, IsHostname }
})()

// ------------------------------------------------------------------
// Format
// ------------------------------------------------------------------
const Format = {
  IsDateTime: (value: string): boolean => {
    const DATE_TIME_SUFFIX = /^(?:\[!?(?:(?!\.{1,2}[/\]])[A-Za-z._][A-Za-z._0-9+-]{0,13}(?:\/(?!\.{1,2}[/\]])[A-Za-z._][A-Za-z._0-9+-]{0,13})*|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9])\](?:\[!?[a-z_][a-z_0-9-]*=[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\])*|(?:\[!?[a-z_][a-z_0-9-]*=[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\])*)$/
    const index = value.indexOf('[')
    const datetime = index === -1 ? value : value.slice(0, index)
    if (index !== -1 && !DATE_TIME_SUFFIX.test(value.slice(index))) return false
    const split: string[] = datetime.split(/T/i)
    return split.length === 2 && Format.IsDate(split[0]) && Format.IsTime(split[1])
  },
  IsDate: (value: string): boolean => {
    const IsLeapYear = (year: number): boolean => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/
    const matches: string[] | null = DATE.exec(value)
    if (!matches) return false
    const year: number = +matches[1]
    const month: number = +matches[2]
    const day: number = +matches[3]
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && IsLeapYear(year) ? 29 : DAYS[month])
  },
  IsDuration: (value: string): boolean => {
    return /^P((\d+Y(\d+M(\d+D)?)?|\d+M(\d+D)?|\d+D)(T(\d+H(\d+M(\d+S)?)?|\d+M(\d+S)?|\d+S))?|T(\d+H(\d+M(\d+S)?)?|\d+M(\d+S)?|\d+S)|\d+W)$/.test(value)
  },
  IsEmail: (value: string): boolean => {
    return /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[^"\\]|\\[\x20-\x7e])*")@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*|\[(?:IPv6:[a-f0-9:]+|(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?:\.(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3})\])$/i.test(value)
  },
  IsHostname: (value: string): boolean => {
    return Idna.IsHostname(value)
  },
  IsIdnEmail: (value: string): boolean => {
    const IdnEmail = /^(?:[A-Za-z0-9!#$%&'*+\/=?^_`{|}~\u{0080}-\u{10FFFF}-]+(?:\.[A-Za-z0-9!#$%&'*+\/=?^_`{|}~\u{0080}-\u{10FFFF}-]+)*|"(?:[^"\\]|\\.)*")@[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,62})(?<!-)(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,62})(?<!-))*$/iu
    return IdnEmail.test(value.normalize('NFC'))
  },
  IsIdnHostname: (value: string): boolean => {
    return Idna.IsIdnHostname(value)
  },
  IsIPv4: (value: string): boolean => {
    return /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(value)
  },
  IsIPv6: (value: string): boolean => {
    return /^(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:)?[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)$/i.test(value)
  },
  IsIriReference: (value: string): boolean => {
    const InvalidIriChars = /[\x00-\x20\x7F\\]|%(?![0-9a-fA-F]{2})/
    const MalformedScheme = /^[a-zA-Z][a-zA-Z0-9+\-.]*\/\//
    return (
      !InvalidIriChars.test(value) &&
      !MalformedScheme.test(value) &&
      URL.canParse(value, 'http://example.com')
    )
  },
  IsIri: (value: string): boolean => {
    const InvalidIriChars = /[\x00-\x20<>\^`{|}\\]/
    const InvalidPercentEncoding = /%(?![0-9a-fA-F]{2})/
    if (InvalidIriChars.test(value)) return false
    if (InvalidPercentEncoding.test(value)) return false
    return URL.canParse(value)
  },
  IsJsonPointerUriFragment: (value: string): boolean => {
    return /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i.test(value)
  },
  IsJsonPointer: (value: string): boolean => {
    return /^(?:\/(?:[^~/]|~0|~1)*)*$/.test(value)
  },
  IsRegex: (value: string): boolean => {
    try {
      new RegExp(value, 'u')
      return true
    } catch {
      return false
    }
  },
  IsRelativeJsonPointer: (value: string): boolean => {
    return /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/.test(value)
  },
  IsTime: (value: string, strictTimeZone: boolean = true): boolean => {
    const matches = /^(\d\d):(\d\d):(\d\d)(?:\.\d+)?(?:([Zz])|([+-])(\d\d):(\d\d))?$/.exec(value)
    if (!matches) return false
    if (strictTimeZone && !matches[4] && !matches[5]) return false
    const hr = +matches[1]
    const min = +matches[2]
    const sec = +matches[3]
    if (hr > 23 || min > 59 || sec > 60) return false
    if (matches[5]) {
      const tzH = +matches[6]
      const tzM = +matches[7]
      if (tzH > 23 || tzM > 59) return false
    }
    if (sec < 60) return true
    const tzSign = matches[5] === '-' ? -1 : 1
    const tzH = +(matches[6] || 0)
    const tzM = +(matches[7] || 0)
    const totalUtcMin = (hr * 60 + min) - tzSign * (tzH * 60 + tzM)
    return (totalUtcMin % 1440 + 1440) % 1440 === 1439
  },
  IsUriReference: (value: string): boolean => {
    return /^(?:[a-z][a-z0-9+\-.]*:(?:\/\/(?:(?:[-a-z0-9._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:[\da-f]{1,4}:){6}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|::(?:[\da-f]{1,4}:){5}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:[\da-f]{1,4})?::(?:[\da-f]{1,4}:){4}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,1}[\da-f]{1,4})?::(?:[\da-f]{1,4}:){3}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,2}[\da-f]{1,4})?::(?:[\da-f]{1,4}:){2}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,3}[\da-f]{1,4})?::[\da-f]{1,4}:(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,4}[\da-f]{1,4})?::(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,5}[\da-f]{1,4})?::[\da-f]{1,4}|(?:(?:[\da-f]{1,4}:){0,6}[\da-f]{1,4})?::)|v[0-9a-f]+\.[-a-z0-9._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)|(?:[-a-z0-9._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:\/\/(?:(?:[-a-z0-9._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:[\da-f]{1,4}:){6}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|::(?:[\da-f]{1,4}:){5}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:[\da-f]{1,4})?::(?:[\da-f]{1,4}:){4}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,1}[\da-f]{1,4})?::(?:[\da-f]{1,4}:){3}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,2}[\da-f]{1,4})?::(?:[\da-f]{1,4}:){2}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,3}[\da-f]{1,4})?::[\da-f]{1,4}:(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,4}[\da-f]{1,4})?::(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,5}[\da-f]{1,4})?::[\da-f]{1,4}|(?:(?:[\da-f]{1,4}:){0,6}[\da-f]{1,4})?::)|v[0-9a-f]+\.[-a-z0-9._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)|(?:[-a-z0-9._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[-a-z0-9._~!$&'()*+,;=@]|%[0-9a-f]{2})+(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?)(?:\?(?:[-a-z0-9._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[-a-z0-9._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i.test(value)
  },
  IsUriTemplate: (value: string): boolean => {
    return /^(?:(?:[^\x00-\x20"<>%\\^`{|}\x7f]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?:\.(?:[a-z0-9_]|%[0-9a-f]{2})+)*(?::[1-9]\d{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?:\.(?:[a-z0-9_]|%[0-9a-f]{2})+)*(?::[1-9]\d{0,3}|\*)?)*\})*$/i.test(value)
  },
  IsUri: (value: string): boolean => {
    return /^[a-z][a-z0-9+\-.]*:(?:\/\/(?:(?:[-a-z0-9._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:[\da-f]{1,4}:){6}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|::(?:[\da-f]{1,4}:){5}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:[\da-f]{1,4})?::(?:[\da-f]{1,4}:){4}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,1}[\da-f]{1,4})?::(?:[\da-f]{1,4}:){3}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,2}[\da-f]{1,4})?::(?:[\da-f]{1,4}:){2}(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,3}[\da-f]{1,4})?::[\da-f]{1,4}:(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,4}[\da-f]{1,4})?::(?:[\da-f]{1,4}:[\da-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))|(?:(?:[\da-f]{1,4}:){0,5}[\da-f]{1,4})?::[\da-f]{1,4}|(?:(?:[\da-f]{1,4}:){0,6}[\da-f]{1,4})?::)|v[0-9a-f]+\.[-a-z0-9._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)|(?:[-a-z0-9._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[-a-z0-9._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[-a-z0-9._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[-a-z0-9._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i.test(value)
  },
  IsUuid: (value: string): boolean => {
    return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
  },
  IsUrl: (value: string): boolean => {
    return URL.canParse(value)
  }
}

// ------------------------------------------------------------------
// CheckContext
// ------------------------------------------------------------------
class CheckContext {
  private readonly stack: {
    indices: Set<number>,
    keys: Set<string>
  }[]
  constructor() {
    const indices = new Set<number>()
    const keys = new Set<string>()
    this.stack = [{ indices, keys }]
  }
  public Push(): true {
    const indices = new Set<number>()
    const keys = new Set<string>()
    this.stack.push({ indices, keys })
    return true
  }
  public Pop(): true {
    this.stack.pop()
    return true
  }
  public AddIndex(index: number): true {
    this.GetIndices().add(index)
    return true
  }
  public AddKey(key: string): true {
    this.GetKeys().add(key)
    return true
  }
  public GetIndices(): Set<number> {
    const top = this.stack[this.stack.length - 1]
    return top.indices
  }
  public GetKeys(): Set<string> {
    const top = this.stack[this.stack.length - 1]
    return top.keys
  }
  public Merge(results: CheckContext[]): true {
    for (const context of results) {
      context.GetIndices().forEach(value => this.GetIndices().add(value))
      context.GetKeys().forEach(value => this.GetKeys().add(value))
    }
    return true
  }
}

// ------------------------------------------------------------------
// GlobalSchema
// ------------------------------------------------------------------
const GlobalSchema = ({"$defs":{"A":{"type":"string"},"B":{"type":"string"}}})

// ------------------------------------------------------------------
// A
// ------------------------------------------------------------------
const A: Validator<A> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/A' })
  // @ts-ignore
  const check_0 = ((value) => typeof value === "string")
  const Schema = () => schema_0
  const Check = (value: unknown): value is A => check_0(value)
  const Parse = (value: unknown): A => Check(value) ? value : Exceptions.TypeError('A', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// B
// ------------------------------------------------------------------
const B: Validator<B> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/B' })
  // @ts-ignore
  const check_0 = ((value) => typeof value === "string")
  const Schema = () => schema_0
  const Check = (value: unknown): value is B => check_0(value)
  const Parse = (value: unknown): B => Check(value) ? value : Exceptions.TypeError('B', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
declare namespace Namespace {
  export type A = string
  export type B = string
}
type A = Namespace.A
type B = Namespace.B
export { A }
export { B }
const Namespace = { A, B }
export default Namespace