
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
const GlobalSchema = ({"$schema":"https://json-schema.org/draft/2020-12/schema","$defs":{"Annotations":{"description":"Optional annotations for the client. The client can use annotations to inform how objects are used or displayed","properties":{"audience":{"description":"Describes who the intended audience of this object or data is.\n\nIt can include multiple entries to indicate content useful for multiple audiences (e.g., `[\"user\", \"assistant\"]`).","items":{"$ref":"#/$defs/Role"},"type":"array"},"lastModified":{"description":"The moment the resource was last modified, as an ISO 8601 formatted string.\n\nShould be an ISO 8601 formatted string (e.g., \"2025-01-12T15:00:58Z\").\n\nExamples: last activity timestamp in an open file, timestamp when the resource\nwas attached, etc.","type":"string"},"priority":{"description":"Describes how important this data is for operating the server.\n\nA value of 1 means \"most important,\" and indicates that the data is\neffectively required, while 0 means \"least important,\" and indicates that\nthe data is entirely optional.","maximum":1,"minimum":0,"type":"number"}},"type":"object"},"AudioContent":{"description":"Audio provided to or from an LLM.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/Annotations","description":"Optional annotations for the client."},"data":{"description":"The base64-encoded audio data.","format":"byte","type":"string"},"mimeType":{"description":"The MIME type of the audio. Different providers may support different audio types.","type":"string"},"type":{"const":"audio","type":"string"}},"required":["data","mimeType","type"],"type":"object"},"BaseMetadata":{"description":"Base interface for metadata with name (identifier) and title (display name) properties.","properties":{"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"}},"required":["name"],"type":"object"},"BlobResourceContents":{"properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"blob":{"description":"A base64-encoded string representing the binary data of the item.","format":"byte","type":"string"},"mimeType":{"description":"The MIME type of this resource, if known.","type":"string"},"uri":{"description":"The URI of this resource.","format":"uri","type":"string"}},"required":["blob","uri"],"type":"object"},"BooleanSchema":{"properties":{"default":{"type":"boolean"},"description":{"type":"string"},"title":{"type":"string"},"type":{"const":"boolean","type":"string"}},"required":["type"],"type":"object"},"CacheableResult":{"description":"A result that supports a time-to-live (TTL) hint for client-side caching.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"cacheScope":{"description":"Indicates the intended scope of the cached response, analogous to HTTP\n`Cache-Control: public` vs `Cache-Control: private`.\n\n- `\"public\"`: The response does not contain user-specific data. Any\n  client or intermediary (e.g., shared gateway, caching proxy) MAY cache\n  the response and serve it across authorization contexts.\n- `\"private\"`: The response MAY be cached and reused only within the\n  same authorization context. Caches MUST NOT be shared across\n  authorization contexts (e.g., a different access token requires a\n  different cache).","enum":["private","public"],"type":"string"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"ttlMs":{"description":"A hint from the server indicating how long (in milliseconds) the\nclient MAY cache this response before re-fetching. Semantics are\nanalogous to HTTP Cache-Control max-age.\n\n- If 0, The response SHOULD be considered immediately stale,\n  The client MAY re-fetch every time the result is needed.\n- If positive, the client SHOULD consider the result fresh for this many\n  milliseconds after receiving the response.","minimum":0,"type":"integer"}},"required":["cacheScope","resultType","ttlMs"],"type":"object"},"CallToolRequest":{"description":"Used by the client to invoke a tool provided by the server.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"tools/call","type":"string"},"params":{"$ref":"#/$defs/CallToolRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"CallToolRequestParams":{"description":"Parameters for a `tools/call` request.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"arguments":{"additionalProperties":{},"description":"Arguments to use for the tool call.","type":"object"},"inputResponses":{"$ref":"#/$defs/InputResponses"},"name":{"description":"The name of the tool.","type":"string"},"requestState":{"type":"string"}},"required":["_meta","name"],"type":"object"},"CallToolResult":{"description":"The result returned by the server for a {@link CallToolRequesttools/call} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"content":{"description":"A list of content objects that represent the unstructured result of the tool call.","items":{"$ref":"#/$defs/ContentBlock"},"type":"array"},"isError":{"description":"Whether the tool call ended in an error.\n\nIf not set, this is assumed to be false (the call was successful).\n\nAny errors that originate from the tool SHOULD be reported inside the result\nobject, with `isError` set to true, _not_ as an MCP protocol-level error\nresponse. Otherwise, the LLM would not be able to see that an error occurred\nand self-correct.\n\nHowever, any errors in _finding_ the tool, an error indicating that the\nserver does not support tool calls, or any other exceptional conditions,\nshould be reported as an MCP error response.","type":"boolean"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"structuredContent":{"description":"An optional JSON value that represents the structured result of the tool call.\n\nThis can be any JSON value (object, array, string, number, boolean, or null)\nthat conforms to the tool's outputSchema if one is defined."}},"required":["content","resultType"],"type":"object"},"CallToolResultResponse":{"description":"A successful response from the server for a {@link CallToolRequesttools/call} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"anyOf":[{"$ref":"#/$defs/InputRequiredResult"},{"$ref":"#/$defs/CallToolResult"}]}},"required":["id","jsonrpc","result"],"type":"object"},"CancelledNotification":{"description":"This notification is sent by the client to indicate that it is cancelling a request it previously issued.\n\nOn stdio, the server also sends this notification, solely to terminate a {@link SubscriptionsListenRequestsubscriptions/listen} stream: it references the ID of the `subscriptions/listen` request that opened the stream. Servers MUST NOT use this notification to cancel any other request.\n\nThe request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.\n\nThis notification indicates that the result will be unused, so any associated processing SHOULD cease.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/cancelled","type":"string"},"params":{"$ref":"#/$defs/CancelledNotificationParams"}},"required":["jsonrpc","method","params"],"type":"object"},"CancelledNotificationParams":{"description":"Parameters for a `notifications/cancelled` notification.","properties":{"_meta":{"$ref":"#/$defs/NotificationMetaObject"},"reason":{"description":"An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.","type":"string"},"requestId":{"$ref":"#/$defs/RequestId","description":"The ID of the request to cancel.\n\nThis MUST correspond to the ID of a request the client previously issued."}},"required":["requestId"],"type":"object"},"ClientCapabilities":{"description":"Capabilities a client may support. Known capabilities are defined here, in this schema, but this is not a closed set: any client can define its own, additional capabilities.","properties":{"elicitation":{"description":"Present if the client supports elicitation from the server.","properties":{"form":{"$ref":"#/$defs/JSONObject"},"url":{"$ref":"#/$defs/JSONObject"}},"type":"object"},"experimental":{"additionalProperties":{"$ref":"#/$defs/JSONObject"},"description":"Experimental, non-standard capabilities that the client supports.","type":"object"},"extensions":{"additionalProperties":{"$ref":"#/$defs/JSONObject"},"description":"Optional MCP extensions that the client supports. Keys are extension identifiers\n(e.g., \"io.modelcontextprotocol/oauth-client-credentials\"), and values are\nper-extension settings objects. An empty object indicates support with no settings.\n\nKeys MUST follow the {@link MetaObject`_meta` key naming rules}, with a\nmandatory prefix.","type":"object"},"roots":{"description":"Present if the client supports listing roots.","properties":{},"type":"object"},"sampling":{"description":"Present if the client supports sampling from an LLM.","properties":{"context":{"$ref":"#/$defs/JSONObject","description":"Whether the client supports context inclusion via `includeContext` parameter.\nIf not declared, servers SHOULD only use `includeContext: \"none\"` (or omit it)."},"tools":{"$ref":"#/$defs/JSONObject","description":"Whether the client supports tool use via `tools` and `toolChoice` parameters."}},"type":"object"}},"type":"object"},"ClientNotification":{"description":"This notification is sent by the client to indicate that it is cancelling a request it previously issued.\n\nOn stdio, the server also sends this notification, solely to terminate a {@link SubscriptionsListenRequestsubscriptions/listen} stream: it references the ID of the `subscriptions/listen` request that opened the stream. Servers MUST NOT use this notification to cancel any other request.\n\nThe request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.\n\nThis notification indicates that the result will be unused, so any associated processing SHOULD cease.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/cancelled","type":"string"},"params":{"$ref":"#/$defs/CancelledNotificationParams"}},"required":["jsonrpc","method","params"],"type":"object"},"ClientRequest":{"anyOf":[{"$ref":"#/$defs/DiscoverRequest"},{"$ref":"#/$defs/ListResourcesRequest"},{"$ref":"#/$defs/ListResourceTemplatesRequest"},{"$ref":"#/$defs/ReadResourceRequest"},{"$ref":"#/$defs/SubscriptionsListenRequest"},{"$ref":"#/$defs/ListPromptsRequest"},{"$ref":"#/$defs/GetPromptRequest"},{"$ref":"#/$defs/ListToolsRequest"},{"$ref":"#/$defs/CallToolRequest"},{"$ref":"#/$defs/CompleteRequest"}]},"ClientResult":{"$ref":"#/$defs/Result","description":"Common result fields."},"CompleteRequest":{"description":"A request from the client to the server, to ask for completion options.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"completion/complete","type":"string"},"params":{"$ref":"#/$defs/CompleteRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"CompleteRequestParams":{"description":"Parameters for a `completion/complete` request.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"argument":{"description":"The argument's information","properties":{"name":{"description":"The name of the argument","type":"string"},"value":{"description":"The value of the argument to use for completion matching.","type":"string"}},"required":["name","value"],"type":"object"},"context":{"description":"Additional, optional context for completions","properties":{"arguments":{"additionalProperties":{"type":"string"},"description":"Previously-resolved variables in a URI template or prompt.","type":"object"}},"type":"object"},"ref":{"anyOf":[{"$ref":"#/$defs/PromptReference"},{"$ref":"#/$defs/ResourceTemplateReference"}]}},"required":["_meta","argument","ref"],"type":"object"},"CompleteResult":{"description":"The result returned by the server for a {@link CompleteRequestcompletion/complete} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"completion":{"properties":{"hasMore":{"description":"Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.","type":"boolean"},"total":{"description":"The total number of completion options available. This can exceed the number of values actually sent in the response.","type":"integer"},"values":{"description":"An array of completion values. Must not exceed 100 items.","items":{"type":"string"},"maxItems":100,"type":"array"}},"required":["values"],"type":"object"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"}},"required":["completion","resultType"],"type":"object"},"CompleteResultResponse":{"description":"A successful response from the server for a {@link CompleteRequestcompletion/complete} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/CompleteResult"}},"required":["id","jsonrpc","result"],"type":"object"},"ContentBlock":{"anyOf":[{"$ref":"#/$defs/TextContent"},{"$ref":"#/$defs/ImageContent"},{"$ref":"#/$defs/AudioContent"},{"$ref":"#/$defs/ResourceLink"},{"$ref":"#/$defs/EmbeddedResource"}]},"CreateMessageRequest":{"description":"A request from the server to sample an LLM via the client. The client has full discretion over which model to select. The client should also inform the user before beginning sampling, to allow them to inspect the request (human in the loop) and decide whether to approve it.","properties":{"method":{"const":"sampling/createMessage","type":"string"},"params":{"$ref":"#/$defs/CreateMessageRequestParams"}},"required":["method","params"],"type":"object"},"CreateMessageRequestParams":{"description":"Parameters for a `sampling/createMessage` request.","properties":{"includeContext":{"description":"A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.\nThe client MAY ignore this request.\n\nDefault is `\"none\"`. The values `\"thisServer\"` and `\"allServers\"` are deprecated (SEP-2596): servers SHOULD\nomit this field or use `\"none\"`, and SHOULD only use the deprecated values if the client declares\n{@link ClientCapabilities.sampling.context}.","enum":["allServers","none","thisServer"],"type":"string"},"maxTokens":{"description":"The requested maximum number of tokens to sample (to prevent runaway completions).\n\nThe client MAY choose to sample fewer tokens than the requested maximum.","type":"integer"},"messages":{"items":{"$ref":"#/$defs/SamplingMessage"},"type":"array"},"metadata":{"$ref":"#/$defs/JSONObject","description":"Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific."},"modelPreferences":{"$ref":"#/$defs/ModelPreferences","description":"The server's preferences for which model to select. The client MAY ignore these preferences."},"stopSequences":{"items":{"type":"string"},"type":"array"},"systemPrompt":{"description":"An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.","type":"string"},"temperature":{"type":"number"},"toolChoice":{"$ref":"#/$defs/ToolChoice","description":"Controls how the model uses tools.\nThe client MUST return an error if this field is provided but {@link ClientCapabilities.sampling.tools} is not declared.\nDefault is `{ mode: \"auto\" }`."},"tools":{"description":"Tools that the model may use during generation.\nThe client MUST return an error if this field is provided but {@link ClientCapabilities.sampling.tools} is not declared.","items":{"$ref":"#/$defs/Tool"},"type":"array"}},"required":["maxTokens","messages"],"type":"object"},"CreateMessageResult":{"description":"The result returned by the client for a {@link CreateMessageRequestsampling/createMessage} request.\nThe client should inform the user before returning the sampled message, to allow them\nto inspect the response (human in the loop) and decide whether to allow the server to see it.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"content":{"anyOf":[{"$ref":"#/$defs/TextContent"},{"$ref":"#/$defs/ImageContent"},{"$ref":"#/$defs/AudioContent"},{"$ref":"#/$defs/ToolUseContent"},{"$ref":"#/$defs/ToolResultContent"},{"items":{"$ref":"#/$defs/SamplingMessageContentBlock"},"type":"array"}]},"model":{"description":"The name of the model that generated the message.","type":"string"},"role":{"$ref":"#/$defs/Role"},"stopReason":{"description":"The reason why sampling stopped, if known.\n\nStandard values:\n- `\"endTurn\"`: Natural end of the assistant's turn\n- `\"stopSequence\"`: A stop sequence was encountered\n- `\"maxTokens\"`: Maximum token limit was reached\n- `\"toolUse\"`: The model wants to use one or more tools\n\nThis field is an open string to allow for provider-specific stop reasons.","type":"string"}},"required":["content","model","role"],"type":"object"},"Cursor":{"description":"An opaque token used to represent a cursor for pagination.","type":"string"},"DiscoverRequest":{"description":"A request from the client asking the server to advertise its supported\nprotocol versions, capabilities, and other metadata. Servers **MUST**\nimplement `server/discover`. Clients **MAY** call it but are not required\nto — version negotiation can also happen inline via per-request `_meta`.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"server/discover","type":"string"},"params":{"$ref":"#/$defs/RequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"DiscoverResult":{"description":"The result returned by the server for a {@link DiscoverRequestserver/discover} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"cacheScope":{"description":"Indicates the intended scope of the cached response, analogous to HTTP\n`Cache-Control: public` vs `Cache-Control: private`.\n\n- `\"public\"`: The response does not contain user-specific data. Any\n  client or intermediary (e.g., shared gateway, caching proxy) MAY cache\n  the response and serve it across authorization contexts.\n- `\"private\"`: The response MAY be cached and reused only within the\n  same authorization context. Caches MUST NOT be shared across\n  authorization contexts (e.g., a different access token requires a\n  different cache).","enum":["private","public"],"type":"string"},"capabilities":{"$ref":"#/$defs/ServerCapabilities","description":"The capabilities of the server."},"instructions":{"description":"Natural-language guidance describing the server and its features.\n\nThis can be used by clients to improve an LLM's understanding of\navailable tools (e.g., by including it in a system prompt). It should\nfocus on information that helps the model use the server effectively\nand should not duplicate information already in tool descriptions.","type":"string"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"supportedVersions":{"description":"MCP Protocol Versions this server supports. The client should choose a\nversion from this list for use in subsequent requests.","items":{"type":"string"},"type":"array"},"ttlMs":{"description":"A hint from the server indicating how long (in milliseconds) the\nclient MAY cache this response before re-fetching. Semantics are\nanalogous to HTTP Cache-Control max-age.\n\n- If 0, The response SHOULD be considered immediately stale,\n  The client MAY re-fetch every time the result is needed.\n- If positive, the client SHOULD consider the result fresh for this many\n  milliseconds after receiving the response.","minimum":0,"type":"integer"}},"required":["cacheScope","capabilities","resultType","supportedVersions","ttlMs"],"type":"object"},"DiscoverResultResponse":{"description":"A successful response from the server for a {@link DiscoverRequestserver/discover} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/DiscoverResult"}},"required":["id","jsonrpc","result"],"type":"object"},"ElicitRequest":{"description":"A request from the server to elicit additional information from the user via the client.","properties":{"method":{"const":"elicitation/create","type":"string"},"params":{"$ref":"#/$defs/ElicitRequestParams"}},"required":["method","params"],"type":"object"},"ElicitRequestFormParams":{"description":"The parameters for a request to elicit non-sensitive information from the user via a form in the client.","properties":{"message":{"description":"The message to present to the user describing what information is being requested.","type":"string"},"mode":{"const":"form","description":"The elicitation mode.","type":"string"},"requestedSchema":{"description":"A restricted subset of JSON Schema.\nOnly top-level properties are allowed, without nesting.","properties":{"$schema":{"type":"string"},"properties":{"additionalProperties":{"$ref":"#/$defs/PrimitiveSchemaDefinition"},"type":"object"},"required":{"items":{"type":"string"},"type":"array"},"type":{"const":"object","type":"string"}},"required":["properties","type"],"type":"object"}},"required":["message","requestedSchema"],"type":"object"},"ElicitRequestParams":{"anyOf":[{"$ref":"#/$defs/ElicitRequestFormParams"},{"$ref":"#/$defs/ElicitRequestURLParams"}],"description":"The parameters for a request to elicit additional information from the user via the client."},"ElicitRequestURLParams":{"description":"The parameters for a request to elicit information from the user via a URL in the client.","properties":{"message":{"description":"The message to present to the user explaining why the interaction is needed.","type":"string"},"mode":{"const":"url","description":"The elicitation mode.","type":"string"},"url":{"description":"The URL that the user should navigate to.","format":"uri","type":"string"}},"required":["message","mode","url"],"type":"object"},"ElicitResult":{"description":"The result returned by the client for an {@link ElicitRequestelicitation/create} request.","properties":{"action":{"description":"The user action in response to the elicitation.\n- `\"accept\"`: User submitted the form/confirmed the action\n- `\"decline\"`: User explicitly declined the action\n- `\"cancel\"`: User dismissed without making an explicit choice","enum":["accept","cancel","decline"],"type":"string"},"content":{"additionalProperties":{"anyOf":[{"items":{"type":"string"},"type":"array"},{"type":["string","integer","boolean"]}]},"description":"The submitted form data, only present when action is `\"accept\"` and mode was `\"form\"`.\nContains values matching the requested schema.\nOmitted for out-of-band mode responses.","type":"object"}},"required":["action"],"type":"object"},"EmbeddedResource":{"description":"The contents of a resource, embedded into a prompt or tool call result.\n\nIt is up to the client how best to render embedded resources for the benefit\nof the LLM and/or the user.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/Annotations","description":"Optional annotations for the client."},"resource":{"anyOf":[{"$ref":"#/$defs/TextResourceContents"},{"$ref":"#/$defs/BlobResourceContents"}]},"type":{"const":"resource","type":"string"}},"required":["resource","type"],"type":"object"},"EmptyResult":{"$ref":"#/$defs/Result","description":"Common result fields."},"EnumSchema":{"anyOf":[{"$ref":"#/$defs/UntitledSingleSelectEnumSchema"},{"$ref":"#/$defs/TitledSingleSelectEnumSchema"},{"$ref":"#/$defs/UntitledMultiSelectEnumSchema"},{"$ref":"#/$defs/TitledMultiSelectEnumSchema"},{"$ref":"#/$defs/LegacyTitledEnumSchema"}]},"Error":{"properties":{"code":{"description":"The error type that occurred.","type":"integer"},"data":{"description":"Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.)."},"message":{"description":"A short description of the error. The message SHOULD be limited to a concise single sentence.","type":"string"}},"required":["code","message"],"type":"object"},"GetPromptRequest":{"description":"Used by the client to get a prompt provided by the server.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"prompts/get","type":"string"},"params":{"$ref":"#/$defs/GetPromptRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"GetPromptRequestParams":{"description":"Parameters for a `prompts/get` request.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"arguments":{"additionalProperties":{"type":"string"},"description":"Arguments to use for templating the prompt.","type":"object"},"inputResponses":{"$ref":"#/$defs/InputResponses"},"name":{"description":"The name of the prompt or prompt template.","type":"string"},"requestState":{"type":"string"}},"required":["_meta","name"],"type":"object"},"GetPromptResult":{"description":"The result returned by the server for a {@link GetPromptRequestprompts/get} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"description":{"description":"An optional description for the prompt.","type":"string"},"messages":{"items":{"$ref":"#/$defs/PromptMessage"},"type":"array"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"}},"required":["messages","resultType"],"type":"object"},"GetPromptResultResponse":{"description":"A successful response from the server for a {@link GetPromptRequestprompts/get} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"anyOf":[{"$ref":"#/$defs/InputRequiredResult"},{"$ref":"#/$defs/GetPromptResult"}]}},"required":["id","jsonrpc","result"],"type":"object"},"HeaderMismatchError":{"description":"Returned when a server rejects a request because the values in the HTTP\nheaders do not match the corresponding values in the request body, or\nbecause required headers are missing or malformed. For HTTP, the response\nstatus code MUST be `400 Bad Request`.","properties":{"error":{"allOf":[{"$ref":"#/$defs/Error"},{"properties":{"code":{"const":-32020,"type":"integer"}},"required":["code"],"type":"object"}]},"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"}},"required":["error","jsonrpc"],"type":"object"},"Icon":{"description":"An optionally-sized icon that can be displayed in a user interface.","properties":{"mimeType":{"description":"Optional MIME type override if the source MIME type is missing or generic.\nFor example: `\"image/png\"`, `\"image/jpeg\"`, or `\"image/svg+xml\"`.","type":"string"},"sizes":{"description":"Optional array of strings that specify sizes at which the icon can be used.\nEach string should be in WxH format (e.g., `\"48x48\"`, `\"96x96\"`) or `\"any\"` for scalable formats like SVG.\n\nIf not provided, the client should assume that the icon can be used at any size.","items":{"type":"string"},"type":"array"},"src":{"description":"A standard URI pointing to an icon resource. May be an HTTP/HTTPS URL or a\n`data:` URI with Base64-encoded image data.\n\nConsumers SHOULD take steps to ensure URLs serving icons are from the\nsame domain as the client/server or a trusted domain.\n\nConsumers SHOULD take appropriate precautions when consuming SVGs as they can contain\nexecutable JavaScript.","format":"uri","type":"string"},"theme":{"description":"Optional specifier for the theme this icon is designed for. `\"light\"` indicates\nthe icon is designed to be used with a light background, and `\"dark\"` indicates\nthe icon is designed to be used with a dark background.\n\nIf not provided, the client should assume the icon can be used with any theme.","enum":["dark","light"],"type":"string"}},"required":["src"],"type":"object"},"Icons":{"description":"Base interface to add `icons` property.","properties":{"icons":{"description":"Optional set of sized icons that the client can display in a user interface.\n\nClients that support rendering icons MUST support at least the following MIME types:\n- `image/png` - PNG images (safe, universal compatibility)\n- `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)\n\nClients that support rendering icons SHOULD also support:\n- `image/svg+xml` - SVG images (scalable but requires security precautions)\n- `image/webp` - WebP images (modern, efficient format)","items":{"$ref":"#/$defs/Icon"},"type":"array"}},"type":"object"},"ImageContent":{"description":"An image provided to or from an LLM.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/Annotations","description":"Optional annotations for the client."},"data":{"description":"The base64-encoded image data.","format":"byte","type":"string"},"mimeType":{"description":"The MIME type of the image. Different providers may support different image types.","type":"string"},"type":{"const":"image","type":"string"}},"required":["data","mimeType","type"],"type":"object"},"Implementation":{"description":"Describes the MCP implementation.","properties":{"description":{"description":"An optional human-readable description of what this implementation does.\n\nThis can be used by clients or servers to provide context about their purpose\nand capabilities. For example, a server might describe the types of resources\nor tools it provides, while a client might describe its intended use case.","type":"string"},"icons":{"description":"Optional set of sized icons that the client can display in a user interface.\n\nClients that support rendering icons MUST support at least the following MIME types:\n- `image/png` - PNG images (safe, universal compatibility)\n- `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)\n\nClients that support rendering icons SHOULD also support:\n- `image/svg+xml` - SVG images (scalable but requires security precautions)\n- `image/webp` - WebP images (modern, efficient format)","items":{"$ref":"#/$defs/Icon"},"type":"array"},"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"},"version":{"description":"The version of this implementation.","type":"string"},"websiteUrl":{"description":"An optional URL of the website for this implementation.","format":"uri","type":"string"}},"required":["name","version"],"type":"object"},"InputRequest":{"anyOf":[{"$ref":"#/$defs/CreateMessageRequest"},{"$ref":"#/$defs/ListRootsRequest"},{"$ref":"#/$defs/ElicitRequest"}]},"InputRequests":{"additionalProperties":{"$ref":"#/$defs/InputRequest"},"description":"A map of server-initiated requests that the client must fulfill.\nKeys are server-assigned identifiers; values are the request objects.","type":"object"},"InputRequiredResult":{"description":"An InputRequiredResult sent by the server to indicate that additional input is needed\nbefore the request can be completed.\n\nAt least one of `inputRequests` or `requestState` MUST be present.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"inputRequests":{"$ref":"#/$defs/InputRequests"},"requestState":{"type":"string"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"}},"required":["resultType"],"type":"object"},"InputResponse":{"anyOf":[{"$ref":"#/$defs/CreateMessageResult"},{"$ref":"#/$defs/ListRootsResult"},{"$ref":"#/$defs/ElicitResult"}]},"InputResponseRequestParams":{"properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"inputResponses":{"$ref":"#/$defs/InputResponses"},"requestState":{"type":"string"}},"required":["_meta"],"type":"object"},"InputResponses":{"additionalProperties":{"$ref":"#/$defs/InputResponse"},"description":"A map of client responses to server-initiated requests.\nKeys correspond to the keys in the {@link InputRequests} map;\nvalues are the client's result for each request.","type":"object"},"InternalError":{"description":"A JSON-RPC error indicating that an internal error occurred on the receiver. This error is returned when the receiver encounters an unexpected condition that prevents it from fulfilling the request.","properties":{"code":{"const":-32603,"description":"The error type that occurred.","type":"integer"},"data":{"description":"Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.)."},"message":{"description":"A short description of the error. The message SHOULD be limited to a concise single sentence.","type":"string"}},"required":["code","message"],"type":"object"},"InvalidParamsError":{"description":"A JSON-RPC error indicating that the method parameters are invalid or malformed.\n\nIn MCP, this error is returned in various contexts when request parameters fail validation:\n\n- **Tools**: Unknown tool name or invalid tool arguments\n- **Prompts**: Unknown prompt name or missing required arguments\n- **Pagination**: Invalid or expired cursor values\n- **Logging**: Invalid log level\n- **Elicitation**: Server requests an elicitation mode not declared in client capabilities\n- **Sampling**: Missing tool result or tool results mixed with other content","properties":{"code":{"const":-32602,"description":"The error type that occurred.","type":"integer"},"data":{"description":"Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.)."},"message":{"description":"A short description of the error. The message SHOULD be limited to a concise single sentence.","type":"string"}},"required":["code","message"],"type":"object"},"InvalidRequestError":{"description":"A JSON-RPC error indicating that the request is not a valid request object. This error is returned when the message structure does not conform to the JSON-RPC 2.0 specification requirements for a request (e.g., missing required fields like `jsonrpc` or `method`, or using invalid types for these fields).","properties":{"code":{"const":-32600,"description":"The error type that occurred.","type":"integer"},"data":{"description":"Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.)."},"message":{"description":"A short description of the error. The message SHOULD be limited to a concise single sentence.","type":"string"}},"required":["code","message"],"type":"object"},"JSONArray":{"items":{"$ref":"#/$defs/JSONValue"},"type":"array"},"JSONObject":{"additionalProperties":{"$ref":"#/$defs/JSONValue"},"type":"object"},"JSONRPCErrorResponse":{"description":"A response to a request that indicates an error occurred.","properties":{"error":{"$ref":"#/$defs/Error"},"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"}},"required":["error","jsonrpc"],"type":"object"},"JSONRPCMessage":{"anyOf":[{"$ref":"#/$defs/JSONRPCRequest"},{"$ref":"#/$defs/JSONRPCNotification"},{"$ref":"#/$defs/JSONRPCResultResponse"},{"$ref":"#/$defs/JSONRPCErrorResponse"}],"description":"Refers to any valid JSON-RPC object that can be decoded off the wire, or encoded to be sent."},"JSONRPCNotification":{"description":"A notification which does not expect a response.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"type":"string"},"params":{"additionalProperties":{},"type":"object"}},"required":["jsonrpc","method"],"type":"object"},"JSONRPCRequest":{"description":"A request that expects a response.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"type":"string"},"params":{"additionalProperties":{},"type":"object"}},"required":["id","jsonrpc","method"],"type":"object"},"JSONRPCResponse":{"anyOf":[{"$ref":"#/$defs/JSONRPCResultResponse"},{"$ref":"#/$defs/JSONRPCErrorResponse"}],"description":"A response to a request, containing either the result or error."},"JSONRPCResultResponse":{"description":"A successful (non-error) response to a request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/Result"}},"required":["id","jsonrpc","result"],"type":"object"},"JSONValue":{"anyOf":[{"$ref":"#/$defs/JSONObject"},{"items":{"$ref":"#/$defs/JSONValue"},"type":"array"},{"type":["string","integer","boolean"]}]},"LegacyTitledEnumSchema":{"description":"Use {@link TitledSingleSelectEnumSchema} instead.\nThis interface will be removed in a future version.","properties":{"default":{"type":"string"},"description":{"type":"string"},"enum":{"items":{"type":"string"},"type":"array"},"enumNames":{"description":"(Legacy) Display names for enum values.\nNon-standard according to JSON schema 2020-12.","items":{"type":"string"},"type":"array"},"title":{"type":"string"},"type":{"const":"string","type":"string"}},"required":["enum","type"],"type":"object"},"ListPromptsRequest":{"description":"Sent from the client to request a list of prompts and prompt templates the server has.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"prompts/list","type":"string"},"params":{"$ref":"#/$defs/PaginatedRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"ListPromptsResult":{"description":"The result returned by the server for a {@link ListPromptsRequestprompts/list} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"cacheScope":{"description":"Indicates the intended scope of the cached response, analogous to HTTP\n`Cache-Control: public` vs `Cache-Control: private`.\n\n- `\"public\"`: The response does not contain user-specific data. Any\n  client or intermediary (e.g., shared gateway, caching proxy) MAY cache\n  the response and serve it across authorization contexts.\n- `\"private\"`: The response MAY be cached and reused only within the\n  same authorization context. Caches MUST NOT be shared across\n  authorization contexts (e.g., a different access token requires a\n  different cache).","enum":["private","public"],"type":"string"},"nextCursor":{"description":"An opaque token representing the pagination position after the last returned result.\nIf present, there may be more results available.","type":"string"},"prompts":{"items":{"$ref":"#/$defs/Prompt"},"type":"array"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"ttlMs":{"description":"A hint from the server indicating how long (in milliseconds) the\nclient MAY cache this response before re-fetching. Semantics are\nanalogous to HTTP Cache-Control max-age.\n\n- If 0, The response SHOULD be considered immediately stale,\n  The client MAY re-fetch every time the result is needed.\n- If positive, the client SHOULD consider the result fresh for this many\n  milliseconds after receiving the response.","minimum":0,"type":"integer"}},"required":["cacheScope","prompts","resultType","ttlMs"],"type":"object"},"ListPromptsResultResponse":{"description":"A successful response from the server for a {@link ListPromptsRequestprompts/list} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/ListPromptsResult"}},"required":["id","jsonrpc","result"],"type":"object"},"ListResourceTemplatesRequest":{"description":"Sent from the client to request a list of resource templates the server has.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"resources/templates/list","type":"string"},"params":{"$ref":"#/$defs/PaginatedRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"ListResourceTemplatesResult":{"description":"The result returned by the server for a {@link ListResourceTemplatesRequestresources/templates/list} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"cacheScope":{"description":"Indicates the intended scope of the cached response, analogous to HTTP\n`Cache-Control: public` vs `Cache-Control: private`.\n\n- `\"public\"`: The response does not contain user-specific data. Any\n  client or intermediary (e.g., shared gateway, caching proxy) MAY cache\n  the response and serve it across authorization contexts.\n- `\"private\"`: The response MAY be cached and reused only within the\n  same authorization context. Caches MUST NOT be shared across\n  authorization contexts (e.g., a different access token requires a\n  different cache).","enum":["private","public"],"type":"string"},"nextCursor":{"description":"An opaque token representing the pagination position after the last returned result.\nIf present, there may be more results available.","type":"string"},"resourceTemplates":{"items":{"$ref":"#/$defs/ResourceTemplate"},"type":"array"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"ttlMs":{"description":"A hint from the server indicating how long (in milliseconds) the\nclient MAY cache this response before re-fetching. Semantics are\nanalogous to HTTP Cache-Control max-age.\n\n- If 0, The response SHOULD be considered immediately stale,\n  The client MAY re-fetch every time the result is needed.\n- If positive, the client SHOULD consider the result fresh for this many\n  milliseconds after receiving the response.","minimum":0,"type":"integer"}},"required":["cacheScope","resourceTemplates","resultType","ttlMs"],"type":"object"},"ListResourceTemplatesResultResponse":{"description":"A successful response from the server for a {@link ListResourceTemplatesRequestresources/templates/list} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/ListResourceTemplatesResult"}},"required":["id","jsonrpc","result"],"type":"object"},"ListResourcesRequest":{"description":"Sent from the client to request a list of resources the server has.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"resources/list","type":"string"},"params":{"$ref":"#/$defs/PaginatedRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"ListResourcesResult":{"description":"The result returned by the server for a {@link ListResourcesRequestresources/list} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"cacheScope":{"description":"Indicates the intended scope of the cached response, analogous to HTTP\n`Cache-Control: public` vs `Cache-Control: private`.\n\n- `\"public\"`: The response does not contain user-specific data. Any\n  client or intermediary (e.g., shared gateway, caching proxy) MAY cache\n  the response and serve it across authorization contexts.\n- `\"private\"`: The response MAY be cached and reused only within the\n  same authorization context. Caches MUST NOT be shared across\n  authorization contexts (e.g., a different access token requires a\n  different cache).","enum":["private","public"],"type":"string"},"nextCursor":{"description":"An opaque token representing the pagination position after the last returned result.\nIf present, there may be more results available.","type":"string"},"resources":{"items":{"$ref":"#/$defs/Resource"},"type":"array"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"ttlMs":{"description":"A hint from the server indicating how long (in milliseconds) the\nclient MAY cache this response before re-fetching. Semantics are\nanalogous to HTTP Cache-Control max-age.\n\n- If 0, The response SHOULD be considered immediately stale,\n  The client MAY re-fetch every time the result is needed.\n- If positive, the client SHOULD consider the result fresh for this many\n  milliseconds after receiving the response.","minimum":0,"type":"integer"}},"required":["cacheScope","resources","resultType","ttlMs"],"type":"object"},"ListResourcesResultResponse":{"description":"A successful response from the server for a {@link ListResourcesRequestresources/list} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/ListResourcesResult"}},"required":["id","jsonrpc","result"],"type":"object"},"ListRootsRequest":{"description":"Sent from the server to request a list of root URIs from the client. Roots allow\nservers to ask for specific directories or files to operate on. A common example\nfor roots is providing a set of repositories or directories a server should operate\non.\n\nThis request is typically used when the server needs to understand the file system\nstructure or access specific locations that the client has permission to read from.","properties":{"method":{"const":"roots/list","type":"string"},"params":{"properties":{"_meta":{"$ref":"#/$defs/MetaObject"}},"type":"object"}},"required":["method"],"type":"object"},"ListRootsResult":{"description":"The result returned by the client for a {@link ListRootsRequestroots/list} request.\nThis result contains an array of {@link Root} objects, each representing a root directory\nor file that the server can operate on.","properties":{"roots":{"items":{"$ref":"#/$defs/Root"},"type":"array"}},"required":["roots"],"type":"object"},"ListToolsRequest":{"description":"Sent from the client to request a list of tools the server has.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"tools/list","type":"string"},"params":{"$ref":"#/$defs/PaginatedRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"ListToolsResult":{"description":"The result returned by the server for a {@link ListToolsRequesttools/list} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"cacheScope":{"description":"Indicates the intended scope of the cached response, analogous to HTTP\n`Cache-Control: public` vs `Cache-Control: private`.\n\n- `\"public\"`: The response does not contain user-specific data. Any\n  client or intermediary (e.g., shared gateway, caching proxy) MAY cache\n  the response and serve it across authorization contexts.\n- `\"private\"`: The response MAY be cached and reused only within the\n  same authorization context. Caches MUST NOT be shared across\n  authorization contexts (e.g., a different access token requires a\n  different cache).","enum":["private","public"],"type":"string"},"nextCursor":{"description":"An opaque token representing the pagination position after the last returned result.\nIf present, there may be more results available.","type":"string"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"tools":{"items":{"$ref":"#/$defs/Tool"},"type":"array"},"ttlMs":{"description":"A hint from the server indicating how long (in milliseconds) the\nclient MAY cache this response before re-fetching. Semantics are\nanalogous to HTTP Cache-Control max-age.\n\n- If 0, The response SHOULD be considered immediately stale,\n  The client MAY re-fetch every time the result is needed.\n- If positive, the client SHOULD consider the result fresh for this many\n  milliseconds after receiving the response.","minimum":0,"type":"integer"}},"required":["cacheScope","resultType","tools","ttlMs"],"type":"object"},"ListToolsResultResponse":{"description":"A successful response from the server for a {@link ListToolsRequesttools/list} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/ListToolsResult"}},"required":["id","jsonrpc","result"],"type":"object"},"LoggingLevel":{"description":"The severity of a log message.\n\nThese map to syslog message severities, as specified in RFC-5424:\nhttps://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1","enum":["alert","critical","debug","emergency","error","info","notice","warning"],"type":"string"},"LoggingMessageNotification":{"description":"JSONRPCNotification of a log message passed from server to client. The client opts in by setting `\"io.modelcontextprotocol/logLevel\"` in a request's `_meta`.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/message","type":"string"},"params":{"$ref":"#/$defs/LoggingMessageNotificationParams"}},"required":["jsonrpc","method","params"],"type":"object"},"LoggingMessageNotificationParams":{"description":"Parameters for a `notifications/message` notification.","properties":{"_meta":{"$ref":"#/$defs/NotificationMetaObject"},"data":{"description":"The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here."},"level":{"$ref":"#/$defs/LoggingLevel","description":"The severity of this log message."},"logger":{"description":"An optional name of the logger issuing this message.","type":"string"}},"required":["data","level"],"type":"object"},"MetaObject":{"description":"Represents the contents of a `_meta` field, which clients and servers use to attach additional metadata to their interactions.\n\nCertain key names are reserved by MCP for protocol-level metadata; implementations MUST NOT make assumptions about values at these keys. Additionally, specific schema definitions may reserve particular names for purpose-specific metadata, as declared in those definitions.\n\nValid keys have two segments:\n\n**Prefix:**\n- Optional — if specified, MUST be a series of _labels_ separated by dots (`.`), followed by a slash (`/`).\n- Labels MUST start with a letter and end with a letter or digit. Interior characters may be letters, digits, or hyphens (`-`).\n- Implementations SHOULD use reverse DNS notation (e.g., `com.example/` rather than `example.com/`).\n- Any prefix where the second label is `modelcontextprotocol` or `mcp` is **reserved** for MCP use. For example: `io.modelcontextprotocol/`, `dev.mcp/`, `org.modelcontextprotocol.api/`, and `com.mcp.tools/` are all reserved. However, `com.example.mcp/` is NOT reserved, as the second label is `example`.\n\n**Name:**\n- Unless empty, MUST start and end with an alphanumeric character (`[a-z0-9A-Z]`).\n- Interior characters may be alphanumeric, hyphens (`-`), underscores (`_`), or dots (`.`).","type":"object"},"MethodNotFoundError":{"description":"A JSON-RPC error indicating that the requested method does not exist or is not available.\n\nIn MCP, a server returns this error when a client invokes a method the server does not implement — either a genuinely unknown method, or one gated behind a server capability the server did not advertise (e.g., calling `prompts/list` when the `prompts` capability was not advertised).\n\nA request that requires a client capability the client did not declare is signalled instead by {@link MissingRequiredClientCapabilityError} (`-32021`).","properties":{"code":{"const":-32601,"description":"The error type that occurred.","type":"integer"},"data":{"description":"Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.)."},"message":{"description":"A short description of the error. The message SHOULD be limited to a concise single sentence.","type":"string"}},"required":["code","message"],"type":"object"},"MissingRequiredClientCapabilityError":{"description":"Returned when processing a request requires a capability the client did not\ndeclare in `clientCapabilities`. For HTTP, the response status code MUST be\n`400 Bad Request`.","properties":{"error":{"allOf":[{"$ref":"#/$defs/Error"},{"properties":{"code":{"const":-32021,"type":"integer"},"data":{"properties":{"requiredCapabilities":{"$ref":"#/$defs/ClientCapabilities","description":"The capabilities the server requires from the client to process this request."}},"required":["requiredCapabilities"],"type":"object"}},"required":["code","data"],"type":"object"}]},"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"}},"required":["error","jsonrpc"],"type":"object"},"ModelHint":{"description":"Hints to use for model selection.\n\nKeys not declared here are currently left unspecified by the spec and are up\nto the client to interpret.","properties":{"name":{"description":"A hint for a model name.\n\nThe client SHOULD treat this as a substring of a model name; for example:\n - `claude-3-5-sonnet` should match `claude-3-5-sonnet-20241022`\n - `sonnet` should match `claude-3-5-sonnet-20241022`, `claude-3-sonnet-20240229`, etc.\n - `claude` should match any Claude model\n\nThe client MAY also map the string to a different provider's model name or a different model family, as long as it fills a similar niche; for example:\n - `gemini-1.5-flash` could match `claude-3-haiku-20240307`","type":"string"}},"type":"object"},"ModelPreferences":{"description":"The server's preferences for model selection, requested of the client during sampling.\n\nBecause LLMs can vary along multiple dimensions, choosing the \"best\" model is\nrarely straightforward.  Different models excel in different areas—some are\nfaster but less capable, others are more capable but more expensive, and so\non. This interface allows servers to express their priorities across multiple\ndimensions to help clients make an appropriate selection for their use case.\n\nThese preferences are always advisory. The client MAY ignore them. It is also\nup to the client to decide how to interpret these preferences and how to\nbalance them against other considerations.","properties":{"costPriority":{"description":"How much to prioritize cost when selecting a model. A value of 0 means cost\nis not important, while a value of 1 means cost is the most important\nfactor.","maximum":1,"minimum":0,"type":"number"},"hints":{"description":"Optional hints to use for model selection.\n\nIf multiple hints are specified, the client MUST evaluate them in order\n(such that the first match is taken).\n\nThe client SHOULD prioritize these hints over the numeric priorities, but\nMAY still use the priorities to select from ambiguous matches.","items":{"$ref":"#/$defs/ModelHint"},"type":"array"},"intelligencePriority":{"description":"How much to prioritize intelligence and capabilities when selecting a\nmodel. A value of 0 means intelligence is not important, while a value of 1\nmeans intelligence is the most important factor.","maximum":1,"minimum":0,"type":"number"},"speedPriority":{"description":"How much to prioritize sampling speed (latency) when selecting a model. A\nvalue of 0 means speed is not important, while a value of 1 means speed is\nthe most important factor.","maximum":1,"minimum":0,"type":"number"}},"type":"object"},"MultiSelectEnumSchema":{"anyOf":[{"$ref":"#/$defs/UntitledMultiSelectEnumSchema"},{"$ref":"#/$defs/TitledMultiSelectEnumSchema"}]},"Notification":{"properties":{"method":{"type":"string"},"params":{"additionalProperties":{},"type":"object"}},"required":["method"],"type":"object"},"NotificationMetaObject":{"description":"Extends {@link MetaObject} with additional notification-specific fields. All key naming rules from `MetaObject` apply.","properties":{"io.modelcontextprotocol/subscriptionId":{"$ref":"#/$defs/RequestId","description":"Identifies the subscription stream a notification was delivered on. The\nserver MUST include this key on every notification delivered via a\n{@link SubscriptionsListenRequestsubscriptions/listen} stream, so the\nclient can correlate the notification with the originating subscription.\nThe key is absent on notifications not delivered via a subscription\nstream (e.g. progress notifications for an in-flight request), which is\nwhy it is optional here.\n\nThe value is the JSON-RPC ID of the `subscriptions/listen` request that\nopened the stream."}},"type":"object"},"NotificationParams":{"description":"Common params for any notification.","properties":{"_meta":{"$ref":"#/$defs/NotificationMetaObject"}},"type":"object"},"NumberSchema":{"properties":{"default":{"type":"number"},"description":{"type":"string"},"maximum":{"type":"number"},"minimum":{"type":"number"},"title":{"type":"string"},"type":{"enum":["integer","number"],"type":"string"}},"required":["type"],"type":"object"},"PaginatedRequest":{"properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"type":"string"},"params":{"$ref":"#/$defs/PaginatedRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"PaginatedRequestParams":{"description":"Common params for paginated requests.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"cursor":{"description":"An opaque token representing the current pagination position.\nIf provided, the server should return results starting after this cursor.","type":"string"}},"required":["_meta"],"type":"object"},"PaginatedResult":{"properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"nextCursor":{"description":"An opaque token representing the pagination position after the last returned result.\nIf present, there may be more results available.","type":"string"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"}},"required":["resultType"],"type":"object"},"ParseError":{"description":"A JSON-RPC error indicating that invalid JSON was received by the server. This error is returned when the server cannot parse the JSON text of a message.","properties":{"code":{"const":-32700,"description":"The error type that occurred.","type":"integer"},"data":{"description":"Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.)."},"message":{"description":"A short description of the error. The message SHOULD be limited to a concise single sentence.","type":"string"}},"required":["code","message"],"type":"object"},"PrimitiveSchemaDefinition":{"anyOf":[{"$ref":"#/$defs/StringSchema"},{"$ref":"#/$defs/NumberSchema"},{"$ref":"#/$defs/BooleanSchema"},{"$ref":"#/$defs/UntitledSingleSelectEnumSchema"},{"$ref":"#/$defs/TitledSingleSelectEnumSchema"},{"$ref":"#/$defs/UntitledMultiSelectEnumSchema"},{"$ref":"#/$defs/TitledMultiSelectEnumSchema"},{"$ref":"#/$defs/LegacyTitledEnumSchema"}],"description":"Restricted schema definitions that only allow primitive types\nwithout nested objects or arrays."},"ProgressNotification":{"description":"An out-of-band notification used to inform the receiver of a progress update for a long-running request.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/progress","type":"string"},"params":{"$ref":"#/$defs/ProgressNotificationParams"}},"required":["jsonrpc","method","params"],"type":"object"},"ProgressNotificationParams":{"description":"Parameters for a {@link ProgressNotificationnotifications/progress} notification.","properties":{"_meta":{"$ref":"#/$defs/NotificationMetaObject"},"message":{"description":"An optional message describing the current progress.","type":"string"},"progress":{"description":"The progress thus far. This should increase every time progress is made, even if the total is unknown.","type":"number"},"progressToken":{"$ref":"#/$defs/ProgressToken","description":"The progress token which was given in the initial request, used to associate this notification with the request that is proceeding."},"total":{"description":"Total number of items to process (or total progress required), if known.","type":"number"}},"required":["progress","progressToken"],"type":"object"},"ProgressToken":{"description":"A progress token, used to associate progress notifications with the original request.","type":["string","integer"]},"Prompt":{"description":"A prompt or prompt template that the server offers.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"arguments":{"description":"A list of arguments to use for templating the prompt.","items":{"$ref":"#/$defs/PromptArgument"},"type":"array"},"description":{"description":"An optional description of what this prompt provides","type":"string"},"icons":{"description":"Optional set of sized icons that the client can display in a user interface.\n\nClients that support rendering icons MUST support at least the following MIME types:\n- `image/png` - PNG images (safe, universal compatibility)\n- `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)\n\nClients that support rendering icons SHOULD also support:\n- `image/svg+xml` - SVG images (scalable but requires security precautions)\n- `image/webp` - WebP images (modern, efficient format)","items":{"$ref":"#/$defs/Icon"},"type":"array"},"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"}},"required":["name"],"type":"object"},"PromptArgument":{"description":"Describes an argument that a prompt can accept.","properties":{"description":{"description":"A human-readable description of the argument.","type":"string"},"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"required":{"description":"Whether this argument must be provided.","type":"boolean"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"}},"required":["name"],"type":"object"},"PromptListChangedNotification":{"description":"An optional notification from the server to the client, informing it that the list of prompts it offers has changed. This is only delivered on a {@link SubscriptionsListenRequestsubscriptions/listen} stream when the client requested it via the `promptsListChanged` filter field.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/prompts/list_changed","type":"string"},"params":{"$ref":"#/$defs/NotificationParams"}},"required":["jsonrpc","method"],"type":"object"},"PromptMessage":{"description":"Describes a message returned as part of a prompt.\n\nThis is similar to {@link SamplingMessage}, but also supports the embedding of\nresources from the MCP server.","properties":{"content":{"$ref":"#/$defs/ContentBlock"},"role":{"$ref":"#/$defs/Role"}},"required":["content","role"],"type":"object"},"PromptReference":{"description":"Identifies a prompt.","properties":{"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"},"type":{"const":"ref/prompt","type":"string"}},"required":["name","type"],"type":"object"},"ReadResourceRequest":{"description":"Sent from the client to the server, to read a specific resource URI.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"resources/read","type":"string"},"params":{"$ref":"#/$defs/ReadResourceRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"ReadResourceRequestParams":{"description":"Parameters for a `resources/read` request.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"inputResponses":{"$ref":"#/$defs/InputResponses"},"requestState":{"type":"string"},"uri":{"description":"The URI of the resource. The URI can use any protocol; it is up to the server how to interpret it.","format":"uri","type":"string"}},"required":["_meta","uri"],"type":"object"},"ReadResourceResult":{"description":"The result returned by the server for a {@link ReadResourceRequestresources/read} request.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"cacheScope":{"description":"Indicates the intended scope of the cached response, analogous to HTTP\n`Cache-Control: public` vs `Cache-Control: private`.\n\n- `\"public\"`: The response does not contain user-specific data. Any\n  client or intermediary (e.g., shared gateway, caching proxy) MAY cache\n  the response and serve it across authorization contexts.\n- `\"private\"`: The response MAY be cached and reused only within the\n  same authorization context. Caches MUST NOT be shared across\n  authorization contexts (e.g., a different access token requires a\n  different cache).","enum":["private","public"],"type":"string"},"contents":{"items":{"anyOf":[{"$ref":"#/$defs/TextResourceContents"},{"$ref":"#/$defs/BlobResourceContents"}]},"type":"array"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"},"ttlMs":{"description":"A hint from the server indicating how long (in milliseconds) the\nclient MAY cache this response before re-fetching. Semantics are\nanalogous to HTTP Cache-Control max-age.\n\n- If 0, The response SHOULD be considered immediately stale,\n  The client MAY re-fetch every time the result is needed.\n- If positive, the client SHOULD consider the result fresh for this many\n  milliseconds after receiving the response.","minimum":0,"type":"integer"}},"required":["cacheScope","contents","resultType","ttlMs"],"type":"object"},"ReadResourceResultResponse":{"description":"A successful response from the server for a {@link ReadResourceRequestresources/read} request.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"anyOf":[{"$ref":"#/$defs/InputRequiredResult"},{"$ref":"#/$defs/ReadResourceResult"}]}},"required":["id","jsonrpc","result"],"type":"object"},"Request":{"properties":{"method":{"type":"string"},"params":{"additionalProperties":{},"type":"object"}},"required":["method"],"type":"object"},"RequestId":{"description":"A uniquely identifying ID for a request in JSON-RPC.","type":["string","integer"]},"RequestMetaObject":{"description":"Extends {@link MetaObject} with additional request-specific fields. All key naming rules from `MetaObject` apply.","properties":{"io.modelcontextprotocol/clientCapabilities":{"$ref":"#/$defs/ClientCapabilities","description":"The client's capabilities for this specific request. Required.\n\nCapabilities are declared per-request rather than once at initialization;\nan empty object means the client supports no optional capabilities.\nServers MUST NOT infer capabilities from prior requests."},"io.modelcontextprotocol/clientInfo":{"$ref":"#/$defs/Implementation","description":"Identifies the client software making the request. Clients SHOULD\ninclude this field on every request unless specifically configured not\nto do so.\n\nThe {@link Implementation} schema requires `name` and `version`; other\nfields are optional.\n\nThe value is self-reported by the client and is not verified by the\nprotocol. It is intended for display, logging, and debugging. Servers\nSHOULD NOT use it to change their behavior, and SHOULD NOT rely on it for\nsecurity decisions."},"io.modelcontextprotocol/logLevel":{"$ref":"#/$defs/LoggingLevel","description":"The desired log level for this request. Optional.\n\nIf absent, the server MUST NOT send any {@link LoggingMessageNotificationnotifications/message}\nnotifications for this request. The client opts in to log messages by\nexplicitly setting a level. Replaces the former `logging/setLevel` RPC."},"io.modelcontextprotocol/protocolVersion":{"description":"The MCP Protocol Version being used for this request. Required.\n\nFor the HTTP transport, this value MUST match the `MCP-Protocol-Version`\nheader; otherwise the server MUST return a `400 Bad Request`. If the\nserver does not support the requested version, it MUST return an\n{@link UnsupportedProtocolVersionError}.","type":"string"},"progressToken":{"$ref":"#/$defs/ProgressToken","description":"If specified, the caller is requesting out-of-band progress notifications for this request (as represented by {@link ProgressNotificationnotifications/progress}). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications."}},"required":["io.modelcontextprotocol/clientCapabilities","io.modelcontextprotocol/protocolVersion"],"type":"object"},"RequestParams":{"description":"Common params for any request.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"}},"required":["_meta"],"type":"object"},"Resource":{"description":"A known resource that the server is capable of reading.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/Annotations","description":"Optional annotations for the client."},"description":{"description":"A description of what this resource represents.\n\nThis can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a \"hint\" to the model.","type":"string"},"icons":{"description":"Optional set of sized icons that the client can display in a user interface.\n\nClients that support rendering icons MUST support at least the following MIME types:\n- `image/png` - PNG images (safe, universal compatibility)\n- `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)\n\nClients that support rendering icons SHOULD also support:\n- `image/svg+xml` - SVG images (scalable but requires security precautions)\n- `image/webp` - WebP images (modern, efficient format)","items":{"$ref":"#/$defs/Icon"},"type":"array"},"mimeType":{"description":"The MIME type of this resource, if known.","type":"string"},"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"size":{"description":"The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.\n\nThis can be used by Hosts to display file sizes and estimate context window usage.","type":"integer"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"},"uri":{"description":"The URI of this resource.","format":"uri","type":"string"}},"required":["name","uri"],"type":"object"},"ResourceContents":{"description":"The contents of a specific resource or sub-resource.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"mimeType":{"description":"The MIME type of this resource, if known.","type":"string"},"uri":{"description":"The URI of this resource.","format":"uri","type":"string"}},"required":["uri"],"type":"object"},"ResourceLink":{"description":"A resource that the server is capable of reading, included in a prompt or tool call result.\n\nNote: resource links returned by tools are not guaranteed to appear in the results of {@link ListResourcesRequestresources/list} requests.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/Annotations","description":"Optional annotations for the client."},"description":{"description":"A description of what this resource represents.\n\nThis can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a \"hint\" to the model.","type":"string"},"icons":{"description":"Optional set of sized icons that the client can display in a user interface.\n\nClients that support rendering icons MUST support at least the following MIME types:\n- `image/png` - PNG images (safe, universal compatibility)\n- `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)\n\nClients that support rendering icons SHOULD also support:\n- `image/svg+xml` - SVG images (scalable but requires security precautions)\n- `image/webp` - WebP images (modern, efficient format)","items":{"$ref":"#/$defs/Icon"},"type":"array"},"mimeType":{"description":"The MIME type of this resource, if known.","type":"string"},"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"size":{"description":"The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.\n\nThis can be used by Hosts to display file sizes and estimate context window usage.","type":"integer"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"},"type":{"const":"resource_link","type":"string"},"uri":{"description":"The URI of this resource.","format":"uri","type":"string"}},"required":["name","type","uri"],"type":"object"},"ResourceListChangedNotification":{"description":"An optional notification from the server to the client, informing it that the list of resources it can read from has changed. This is only delivered on a {@link SubscriptionsListenRequestsubscriptions/listen} stream when the client requested it via the `resourcesListChanged` filter field.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/resources/list_changed","type":"string"},"params":{"$ref":"#/$defs/NotificationParams"}},"required":["jsonrpc","method"],"type":"object"},"ResourceRequestParams":{"description":"Common params for resource-related requests.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"uri":{"description":"The URI of the resource. The URI can use any protocol; it is up to the server how to interpret it.","format":"uri","type":"string"}},"required":["_meta","uri"],"type":"object"},"ResourceTemplate":{"description":"A template description for resources available on the server.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/Annotations","description":"Optional annotations for the client."},"description":{"description":"A description of what this template is for.\n\nThis can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a \"hint\" to the model.","type":"string"},"icons":{"description":"Optional set of sized icons that the client can display in a user interface.\n\nClients that support rendering icons MUST support at least the following MIME types:\n- `image/png` - PNG images (safe, universal compatibility)\n- `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)\n\nClients that support rendering icons SHOULD also support:\n- `image/svg+xml` - SVG images (scalable but requires security precautions)\n- `image/webp` - WebP images (modern, efficient format)","items":{"$ref":"#/$defs/Icon"},"type":"array"},"mimeType":{"description":"The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.","type":"string"},"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"},"uriTemplate":{"description":"A URI template (according to RFC 6570) that can be used to construct resource URIs.","format":"uri-template","type":"string"}},"required":["name","uriTemplate"],"type":"object"},"ResourceTemplateReference":{"description":"A reference to a resource or resource template definition.","properties":{"type":{"const":"ref/resource","type":"string"},"uri":{"description":"The URI or URI template of the resource.","format":"uri-template","type":"string"}},"required":["type","uri"],"type":"object"},"ResourceUpdatedNotification":{"description":"A notification from the server to the client, informing it that a resource has changed and may need to be read again. This is only sent for resources the client opted in to via the `resourceSubscriptions` field of a {@link SubscriptionsListenRequestsubscriptions/listen} request.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/resources/updated","type":"string"},"params":{"$ref":"#/$defs/ResourceUpdatedNotificationParams"}},"required":["jsonrpc","method","params"],"type":"object"},"ResourceUpdatedNotificationParams":{"description":"Parameters for a `notifications/resources/updated` notification.","properties":{"_meta":{"$ref":"#/$defs/NotificationMetaObject"},"uri":{"description":"The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.","format":"uri","type":"string"}},"required":["uri"],"type":"object"},"Result":{"additionalProperties":{},"description":"Common result fields.","properties":{"_meta":{"$ref":"#/$defs/ResultMetaObject"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"}},"required":["resultType"],"type":"object"},"ResultMetaObject":{"description":"Extends {@link MetaObject} with additional result-specific fields. All key naming rules from `MetaObject` apply.","properties":{"io.modelcontextprotocol/serverInfo":{"$ref":"#/$defs/Implementation","description":"Identifies the server software producing the response. Servers SHOULD\ninclude this field on every response unless specifically configured not\nto do so.\n\nThe {@link Implementation} schema requires `name` and `version`; other\nfields are optional.\n\nThe value is self-reported by the server and is not verified by the\nprotocol. It is intended for display, logging, and debugging. Clients\nSHOULD NOT use it to change their behavior, and SHOULD NOT rely on it for\nsecurity decisions."}},"type":"object"},"ResultType":{"description":"Indicates the type of a {@link Result} object, allowing the client to\ndetermine how to parse the response.\n\ncomplete - the request completed successfully and the result contains the final content.\ninput_required - the request requires additional input and the result contains an {@link InputRequiredResult} object with instructions for the client to provide additional input before retrying the original request.","type":"string"},"Role":{"description":"The sender or recipient of messages and data in a conversation.","enum":["assistant","user"],"type":"string"},"Root":{"description":"Represents a root directory or file that the server can operate on.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"name":{"description":"An optional name for the root. This can be used to provide a human-readable\nidentifier for the root, which may be useful for display purposes or for\nreferencing the root in other parts of the application.","type":"string"},"uri":{"description":"The URI identifying the root. This *must* start with `file://` for now.\nThis restriction may be relaxed in future versions of the protocol to allow\nother URI schemes.","format":"uri","type":"string"}},"required":["uri"],"type":"object"},"SamplingMessage":{"description":"Describes a message issued to or received from an LLM API.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"content":{"anyOf":[{"$ref":"#/$defs/TextContent"},{"$ref":"#/$defs/ImageContent"},{"$ref":"#/$defs/AudioContent"},{"$ref":"#/$defs/ToolUseContent"},{"$ref":"#/$defs/ToolResultContent"},{"items":{"$ref":"#/$defs/SamplingMessageContentBlock"},"type":"array"}]},"role":{"$ref":"#/$defs/Role"}},"required":["content","role"],"type":"object"},"SamplingMessageContentBlock":{"anyOf":[{"$ref":"#/$defs/TextContent"},{"$ref":"#/$defs/ImageContent"},{"$ref":"#/$defs/AudioContent"},{"$ref":"#/$defs/ToolUseContent"},{"$ref":"#/$defs/ToolResultContent"}]},"ServerCapabilities":{"description":"Capabilities that a server may support. Known capabilities are defined here, in this schema, but this is not a closed set: any server can define its own, additional capabilities.","properties":{"completions":{"$ref":"#/$defs/JSONObject","description":"Present if the server supports argument autocompletion suggestions."},"experimental":{"additionalProperties":{"$ref":"#/$defs/JSONObject"},"description":"Experimental, non-standard capabilities that the server supports.","type":"object"},"extensions":{"additionalProperties":{"$ref":"#/$defs/JSONObject"},"description":"Optional MCP extensions that the server supports. Keys are extension identifiers\n(e.g., \"io.modelcontextprotocol/tasks\"), and values are per-extension settings\nobjects. An empty object indicates support with no settings.\n\nKeys MUST follow the {@link MetaObject`_meta` key naming rules}, with a\nmandatory prefix.","type":"object"},"logging":{"$ref":"#/$defs/JSONObject","description":"Present if the server supports sending log messages to the client."},"prompts":{"description":"Present if the server offers any prompt templates.","properties":{"listChanged":{"description":"Whether this server supports notifications for changes to the prompt list.","type":"boolean"}},"type":"object"},"resources":{"description":"Present if the server offers any resources to read.","properties":{"listChanged":{"description":"Whether this server supports notifications for changes to the resource list.","type":"boolean"},"subscribe":{"description":"Whether this server supports subscribing to resource updates.","type":"boolean"}},"type":"object"},"tools":{"description":"Present if the server offers any tools to call.","properties":{"listChanged":{"description":"Whether this server supports notifications for changes to the tool list.","type":"boolean"}},"type":"object"}},"type":"object"},"ServerNotification":{"anyOf":[{"$ref":"#/$defs/CancelledNotification"},{"$ref":"#/$defs/ProgressNotification"},{"$ref":"#/$defs/ResourceListChangedNotification"},{"$ref":"#/$defs/SubscriptionsAcknowledgedNotification"},{"$ref":"#/$defs/ResourceUpdatedNotification"},{"$ref":"#/$defs/PromptListChangedNotification"},{"$ref":"#/$defs/ToolListChangedNotification"},{"$ref":"#/$defs/LoggingMessageNotification"}]},"ServerResult":{"anyOf":[{"$ref":"#/$defs/Result"},{"$ref":"#/$defs/InputRequiredResult"},{"$ref":"#/$defs/DiscoverResult"},{"$ref":"#/$defs/ListResourcesResult"},{"$ref":"#/$defs/ListResourceTemplatesResult"},{"$ref":"#/$defs/ReadResourceResult"},{"$ref":"#/$defs/SubscriptionsListenResult"},{"$ref":"#/$defs/ListPromptsResult"},{"$ref":"#/$defs/GetPromptResult"},{"$ref":"#/$defs/ListToolsResult"},{"$ref":"#/$defs/CallToolResult"},{"$ref":"#/$defs/CompleteResult"}]},"SingleSelectEnumSchema":{"anyOf":[{"$ref":"#/$defs/UntitledSingleSelectEnumSchema"},{"$ref":"#/$defs/TitledSingleSelectEnumSchema"}]},"StringSchema":{"properties":{"default":{"type":"string"},"description":{"type":"string"},"format":{"enum":["date","date-time","email","uri"],"type":"string"},"maxLength":{"type":"integer"},"minLength":{"type":"integer"},"title":{"type":"string"},"type":{"const":"string","type":"string"}},"required":["type"],"type":"object"},"SubscriptionFilter":{"description":"The set of notification types a client may opt in to on a\n{@link SubscriptionsListenRequestsubscriptions/listen} request.\n\nEach notification type is **opt-in**; the server **MUST NOT** send\nnotification types the client has not explicitly requested here.","properties":{"promptsListChanged":{"description":"If true, receive {@link PromptListChangedNotificationnotifications/prompts/list_changed}.","type":"boolean"},"resourceSubscriptions":{"description":"Subscribe to {@link ResourceUpdatedNotificationnotifications/resources/updated} for these resource URIs.\nReplaces the former `resources/subscribe` RPC.","items":{"type":"string"},"type":"array"},"resourcesListChanged":{"description":"If true, receive {@link ResourceListChangedNotificationnotifications/resources/list_changed}.","type":"boolean"},"toolsListChanged":{"description":"If true, receive {@link ToolListChangedNotificationnotifications/tools/list_changed}.","type":"boolean"}},"type":"object"},"SubscriptionsAcknowledgedNotification":{"description":"Sent by the server to acknowledge that a\n{@link SubscriptionsListenRequestsubscriptions/listen} subscription has been\nestablished and to report which notification types it agreed to honor.\n\nThis notification MUST be the first message the server sends carrying the\nsubscription's ID in `io.modelcontextprotocol/subscriptionId`. The server MUST\nNOT send any notification on the subscription before acknowledging it. On\nstdio, where every subscription shares one channel, this ordering is defined\nper subscription ID and not per channel: messages belonging to other\nsubscriptions MAY be interleaved before it.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/subscriptions/acknowledged","type":"string"},"params":{"$ref":"#/$defs/SubscriptionsAcknowledgedNotificationParams"}},"required":["jsonrpc","method","params"],"type":"object"},"SubscriptionsAcknowledgedNotificationParams":{"description":"Parameters for a {@link SubscriptionsAcknowledgedNotificationnotifications/subscriptions/acknowledged} notification.","properties":{"_meta":{"$ref":"#/$defs/NotificationMetaObject"},"notifications":{"$ref":"#/$defs/SubscriptionFilter","description":"The subset of requested notification types the server agreed to honor.\nOnly includes notification types the server actually supports; if the\nclient requested an unsupported type (e.g., `promptsListChanged` when\nthe server has no prompts), it is omitted from this set."}},"required":["notifications"],"type":"object"},"SubscriptionsListenRequest":{"description":"Sent from the client to open a long-lived channel for receiving notifications\noutside the context of a specific request. Replaces the previous HTTP GET\nendpoint and ensures consistent behavior between HTTP and STDIO.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"subscriptions/listen","type":"string"},"params":{"$ref":"#/$defs/SubscriptionsListenRequestParams"}},"required":["id","jsonrpc","method","params"],"type":"object"},"SubscriptionsListenRequestParams":{"description":"Parameters for a {@link SubscriptionsListenRequestsubscriptions/listen} request.","properties":{"_meta":{"$ref":"#/$defs/RequestMetaObject"},"notifications":{"$ref":"#/$defs/SubscriptionFilter","description":"The notifications the client opts in to on this stream. The server\n**MUST NOT** send notification types the client has not explicitly\nrequested."}},"required":["_meta","notifications"],"type":"object"},"SubscriptionsListenResult":{"description":"The response to a {@link SubscriptionsListenRequestsubscriptions/listen}\nrequest, signalling that the subscription has ended gracefully (for example,\nduring server shutdown). Because the listen stream is long-lived, this result\nis sent only when the server tears the subscription down; an abrupt transport\nclose carries no response. The result body is otherwise empty.","properties":{"_meta":{"$ref":"#/$defs/SubscriptionsListenResultMetaObject"},"resultType":{"description":"Indicates the type of the result, which allows the client to determine\nhow to parse the result object.\n\nServers implementing this protocol version MUST include this field.\nFor backward compatibility, when a client receives a result from a\nserver implementing an earlier protocol version (which does not include\n`resultType`), the client MUST treat the absent field as `\"complete\"`.","type":"string"}},"required":["_meta","resultType"],"type":"object"},"SubscriptionsListenResultMetaObject":{"description":"Extends {@link ResultMetaObject} with the subscription-stream identifier carried by a\n{@link SubscriptionsListenResult}. All key naming rules from `MetaObject` apply.","properties":{"io.modelcontextprotocol/serverInfo":{"$ref":"#/$defs/Implementation","description":"Identifies the server software producing the response. Servers SHOULD\ninclude this field on every response unless specifically configured not\nto do so.\n\nThe {@link Implementation} schema requires `name` and `version`; other\nfields are optional.\n\nThe value is self-reported by the server and is not verified by the\nprotocol. It is intended for display, logging, and debugging. Clients\nSHOULD NOT use it to change their behavior, and SHOULD NOT rely on it for\nsecurity decisions."},"io.modelcontextprotocol/subscriptionId":{"$ref":"#/$defs/RequestId","description":"Identifies the subscription stream this response closes, so the client can\ncorrelate it with the originating subscription — mirroring the same key on\nthe stream's notifications. The value is the JSON-RPC ID of the\n`subscriptions/listen` request that opened the stream (and equals this\nresponse's `id`)."}},"required":["io.modelcontextprotocol/subscriptionId"],"type":"object"},"SubscriptionsListenResultResponse":{"description":"A successful response from the server for a {@link SubscriptionsListenRequestsubscriptions/listen}\nrequest, sent when the server tears the subscription down gracefully.","properties":{"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"},"result":{"$ref":"#/$defs/SubscriptionsListenResult"}},"required":["id","jsonrpc","result"],"type":"object"},"TextContent":{"description":"Text provided to or from an LLM.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/Annotations","description":"Optional annotations for the client."},"text":{"description":"The text content of the message.","type":"string"},"type":{"const":"text","type":"string"}},"required":["text","type"],"type":"object"},"TextResourceContents":{"properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"mimeType":{"description":"The MIME type of this resource, if known.","type":"string"},"text":{"description":"The text of the item. This must only be set if the item can actually be represented as text (not binary data).","type":"string"},"uri":{"description":"The URI of this resource.","format":"uri","type":"string"}},"required":["text","uri"],"type":"object"},"TitledMultiSelectEnumSchema":{"description":"Schema for multiple-selection enumeration with display titles for each option.","properties":{"default":{"description":"Optional default value.","items":{"type":"string"},"type":"array"},"description":{"description":"Optional description for the enum field.","type":"string"},"items":{"description":"Schema for array items with enum options and display labels.","properties":{"anyOf":{"description":"Array of enum options with values and display labels.","items":{"properties":{"const":{"description":"The constant enum value.","type":"string"},"title":{"description":"Display title for this option.","type":"string"}},"required":["const","title"],"type":"object"},"type":"array"}},"required":["anyOf"],"type":"object"},"maxItems":{"description":"Maximum number of items to select.","type":"integer"},"minItems":{"description":"Minimum number of items to select.","type":"integer"},"title":{"description":"Optional title for the enum field.","type":"string"},"type":{"const":"array","type":"string"}},"required":["items","type"],"type":"object"},"TitledSingleSelectEnumSchema":{"description":"Schema for single-selection enumeration with display titles for each option.","properties":{"default":{"description":"Optional default value.","type":"string"},"description":{"description":"Optional description for the enum field.","type":"string"},"oneOf":{"description":"Array of enum options with values and display labels.","items":{"properties":{"const":{"description":"The enum value.","type":"string"},"title":{"description":"Display label for this option.","type":"string"}},"required":["const","title"],"type":"object"},"type":"array"},"title":{"description":"Optional title for the enum field.","type":"string"},"type":{"const":"string","type":"string"}},"required":["oneOf","type"],"type":"object"},"Tool":{"description":"Definition for a tool the client can call.","properties":{"_meta":{"$ref":"#/$defs/MetaObject"},"annotations":{"$ref":"#/$defs/ToolAnnotations","description":"Optional additional tool information.\n\nDisplay name precedence order is: `title`, `annotations.title`, then `name`."},"description":{"description":"A human-readable description of the tool.\n\nThis can be used by clients to improve the LLM's understanding of available tools. It can be thought of like a \"hint\" to the model.","type":"string"},"icons":{"description":"Optional set of sized icons that the client can display in a user interface.\n\nClients that support rendering icons MUST support at least the following MIME types:\n- `image/png` - PNG images (safe, universal compatibility)\n- `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)\n\nClients that support rendering icons SHOULD also support:\n- `image/svg+xml` - SVG images (scalable but requires security precautions)\n- `image/webp` - WebP images (modern, efficient format)","items":{"$ref":"#/$defs/Icon"},"type":"array"},"inputSchema":{"additionalProperties":{},"description":"A JSON Schema object defining the expected parameters for the tool.\n\nTool arguments are always JSON objects, so `type: \"object\"` is required at the root.\nBeyond that, any JSON Schema 2020-12 keyword may appear alongside `type` — including\ncomposition keywords (`oneOf`, `anyOf`, `allOf`, `not`), conditional keywords\n(`if`/`then`/`else`), reference keywords (`$ref`, `$defs`, `$anchor`), and any other\nstandard validation or annotation keywords.\n\nProperty schemas may carry an `x-mcp-header` annotation to mirror the\nargument value into an HTTP header on the Streamable HTTP transport. See\nthe Streamable HTTP transport specification for the validity and\nextraction rules.\n\nDefaults to JSON Schema 2020-12 when no explicit `$schema` is provided.","properties":{"$schema":{"type":"string"},"type":{"const":"object","type":"string"}},"required":["type"],"type":"object"},"name":{"description":"Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).","type":"string"},"outputSchema":{"additionalProperties":{},"description":"An optional JSON Schema object defining the structure of the tool's output returned in\nthe structuredContent field of a {@link CallToolResult}. This can be any valid JSON Schema 2020-12.\n\nDefaults to JSON Schema 2020-12 when no explicit `$schema` is provided.","properties":{"$schema":{"type":"string"}},"type":"object"},"title":{"description":"Intended for UI and end-user contexts — optimized to be human-readable and easily understood,\neven by those unfamiliar with domain-specific terminology.\n\nIf not provided, the name should be used for display (except for {@link Tool},\nwhere `annotations.title` should be given precedence over using `name`,\nif present).","type":"string"}},"required":["inputSchema","name"],"type":"object"},"ToolAnnotations":{"description":"Additional properties describing a {@link Tool} to clients.\n\nNOTE: all properties in `ToolAnnotations` are **hints**.\nThey are not guaranteed to provide a faithful description of\ntool behavior (including descriptive properties like `title`).\n\nClients should never make tool use decisions based on `ToolAnnotations`\nreceived from untrusted servers.","properties":{"destructiveHint":{"description":"If true, the tool may perform destructive updates to its environment.\nIf false, the tool performs only additive updates.\n\n(This property is meaningful only when `readOnlyHint == false`)\n\nDefault: true","type":"boolean"},"idempotentHint":{"description":"If true, calling the tool repeatedly with the same arguments\nwill have no additional effect on its environment.\n\n(This property is meaningful only when `readOnlyHint == false`)\n\nDefault: false","type":"boolean"},"openWorldHint":{"description":"If true, this tool may interact with an \"open world\" of external\nentities. If false, the tool's domain of interaction is closed.\nFor example, the world of a web search tool is open, whereas that\nof a memory tool is not.\n\nDefault: true","type":"boolean"},"readOnlyHint":{"description":"If true, the tool does not modify its environment.\n\nDefault: false","type":"boolean"},"title":{"description":"A human-readable title for the tool.","type":"string"}},"type":"object"},"ToolChoice":{"description":"Controls tool selection behavior for sampling requests.","properties":{"mode":{"description":"Controls the tool use ability of the model:\n- `\"auto\"`: Model decides whether to use tools (default)\n- `\"required\"`: Model MUST use at least one tool before completing\n- `\"none\"`: Model MUST NOT use any tools","enum":["auto","none","required"],"type":"string"}},"type":"object"},"ToolListChangedNotification":{"description":"An optional notification from the server to the client, informing it that the list of tools it offers has changed. This is only delivered on a {@link SubscriptionsListenRequestsubscriptions/listen} stream when the client requested it via the `toolsListChanged` filter field.","properties":{"jsonrpc":{"const":"2.0","type":"string"},"method":{"const":"notifications/tools/list_changed","type":"string"},"params":{"$ref":"#/$defs/NotificationParams"}},"required":["jsonrpc","method"],"type":"object"},"ToolResultContent":{"description":"The result of a tool use, provided by the user back to the assistant.","properties":{"_meta":{"$ref":"#/$defs/MetaObject","description":"Optional metadata about the tool result. Clients SHOULD preserve this field when\nincluding tool results in subsequent sampling requests to enable caching optimizations."},"content":{"description":"The unstructured result content of the tool use.\n\nThis has the same format as {@link CallToolResult.content} and can include text, images,\naudio, resource links, and embedded resources.","items":{"$ref":"#/$defs/ContentBlock"},"type":"array"},"isError":{"description":"Whether the tool use resulted in an error.\n\nIf true, the content typically describes the error that occurred.\nDefault: false","type":"boolean"},"structuredContent":{"description":"An optional structured result value.\n\nThis can be any JSON value (object, array, string, number, boolean, or null).\nIf the tool defined an {@link Tool.outputSchema}, this SHOULD conform to that schema."},"toolUseId":{"description":"The ID of the tool use this result corresponds to.\n\nThis MUST match the ID from a previous {@link ToolUseContent}.","type":"string"},"type":{"const":"tool_result","type":"string"}},"required":["content","toolUseId","type"],"type":"object"},"ToolUseContent":{"description":"A request from the assistant to call a tool.","properties":{"_meta":{"$ref":"#/$defs/MetaObject","description":"Optional metadata about the tool use. Clients SHOULD preserve this field when\nincluding tool uses in subsequent sampling requests to enable caching optimizations."},"id":{"description":"A unique identifier for this tool use.\n\nThis ID is used to match tool results to their corresponding tool uses.","type":"string"},"input":{"additionalProperties":{},"description":"The arguments to pass to the tool, conforming to the tool's input schema.","type":"object"},"name":{"description":"The name of the tool to call.","type":"string"},"type":{"const":"tool_use","type":"string"}},"required":["id","input","name","type"],"type":"object"},"UnsupportedProtocolVersionError":{"description":"Returned when the request's protocol version is unknown to the server or\nunsupported (e.g., a known experimental or draft version the server has\nchosen not to implement). For HTTP, the response status code MUST be\n`400 Bad Request`.","properties":{"error":{"allOf":[{"$ref":"#/$defs/Error"},{"properties":{"code":{"const":-32022,"type":"integer"},"data":{"properties":{"requested":{"description":"The protocol version that was requested by the client.","type":"string"},"supported":{"description":"Protocol versions the server supports. The client should choose a\nmutually supported version from this list and retry.","items":{"type":"string"},"type":"array"}},"required":["requested","supported"],"type":"object"}},"required":["code","data"],"type":"object"}]},"id":{"$ref":"#/$defs/RequestId"},"jsonrpc":{"const":"2.0","type":"string"}},"required":["error","jsonrpc"],"type":"object"},"UntitledMultiSelectEnumSchema":{"description":"Schema for multiple-selection enumeration without display titles for options.","properties":{"default":{"description":"Optional default value.","items":{"type":"string"},"type":"array"},"description":{"description":"Optional description for the enum field.","type":"string"},"items":{"description":"Schema for the array items.","properties":{"enum":{"description":"Array of enum values to choose from.","items":{"type":"string"},"type":"array"},"type":{"const":"string","type":"string"}},"required":["enum","type"],"type":"object"},"maxItems":{"description":"Maximum number of items to select.","type":"integer"},"minItems":{"description":"Minimum number of items to select.","type":"integer"},"title":{"description":"Optional title for the enum field.","type":"string"},"type":{"const":"array","type":"string"}},"required":["items","type"],"type":"object"},"UntitledSingleSelectEnumSchema":{"description":"Schema for single-selection enumeration without display titles for options.","properties":{"default":{"description":"Optional default value.","type":"string"},"description":{"description":"Optional description for the enum field.","type":"string"},"enum":{"description":"Array of enum values to choose from.","items":{"type":"string"},"type":"array"},"title":{"description":"Optional title for the enum field.","type":"string"},"type":{"const":"string","type":"string"}},"required":["enum","type"],"type":"object"}}})

// ------------------------------------------------------------------
// Annotations
// ------------------------------------------------------------------
const Annotations: Validator<Annotations> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Annotations' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((value.audience === undefined || (!("audience" in value) || (Array.isArray(value.audience) && value.audience.every((unique_0, index) => (check_1(unique_0)))))) && (value.lastModified === undefined || (!("lastModified" in value) || typeof value.lastModified === "string"))) && (value.priority === undefined || (!("priority" in value) || (Number.isFinite(value.priority) && (value.priority >= 0 && value.priority <= 1)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Annotations => check_0(value)
  const Parse = (value: unknown): Annotations => Check(value) ? value : Exceptions.TypeError('Annotations', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// AudioContent
// ------------------------------------------------------------------
const AudioContent: Validator<AudioContent> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/AudioContent' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("data" in value && "mimeType" in value) && "type" in value) && (((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && (typeof value.data === "string" && true)) && typeof value.mimeType === "string") && (typeof value.type === "string" && value.type === "audio")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is AudioContent => check_0(value)
  const Parse = (value: unknown): AudioContent => Check(value) ? value : Exceptions.TypeError('AudioContent', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// BaseMetadata
// ------------------------------------------------------------------
const BaseMetadata: Validator<BaseMetadata> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/BaseMetadata' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("name" in value && (typeof value.name === "string" && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is BaseMetadata => check_0(value)
  const Parse = (value: unknown): BaseMetadata => Check(value) ? value : Exceptions.TypeError('BaseMetadata', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// BlobResourceContents
// ------------------------------------------------------------------
const BlobResourceContents: Validator<BlobResourceContents> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/BlobResourceContents' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("blob" in value && "uri" in value) && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.blob === "string" && true)) && (value.mimeType === undefined || (!("mimeType" in value) || typeof value.mimeType === "string"))) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is BlobResourceContents => check_0(value)
  const Parse = (value: unknown): BlobResourceContents => Check(value) ? value : Exceptions.TypeError('BlobResourceContents', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// BooleanSchema
// ------------------------------------------------------------------
const BooleanSchema: Validator<BooleanSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/BooleanSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("type" in value && ((((value.default === undefined || (!("default" in value) || typeof value.default === "boolean")) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "boolean")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is BooleanSchema => check_0(value)
  const Parse = (value: unknown): BooleanSchema => Check(value) ? value : Exceptions.TypeError('BooleanSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CacheableResult
// ------------------------------------------------------------------
const CacheableResult: Validator<CacheableResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CacheableResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("cacheScope" in value && "resultType" in value) && "ttlMs" in value) && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.cacheScope === "string" && (value.cacheScope === "private" || value.cacheScope === "public"))) && typeof value.resultType === "string") && (Number.isInteger(value.ttlMs) && (!((Number.isFinite(value.ttlMs) || typeof value.ttlMs === "bigint")) || value.ttlMs >= 0))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CacheableResult => check_0(value)
  const Parse = (value: unknown): CacheableResult => Check(value) ? value : Exceptions.TypeError('CacheableResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CallToolRequest
// ------------------------------------------------------------------
const CallToolRequest: Validator<CallToolRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CallToolRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "tools/call")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CallToolRequest => check_0(value)
  const Parse = (value: unknown): CallToolRequest => Check(value) ? value : Exceptions.TypeError('CallToolRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CallToolRequestParams
// ------------------------------------------------------------------
const CallToolRequestParams: Validator<CallToolRequestParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CallToolRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("_meta" in value && "name" in value) && ((((check_1(value._meta) && (value.arguments === undefined || (!("arguments" in value) || ((typeof value.arguments === "object" && value.arguments !== null && !(Array.isArray(value.arguments))) && true)))) && (value.inputResponses === undefined || (!("inputResponses" in value) || check_1(value.inputResponses)))) && typeof value.name === "string") && (value.requestState === undefined || (!("requestState" in value) || typeof value.requestState === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CallToolRequestParams => check_0(value)
  const Parse = (value: unknown): CallToolRequestParams => Check(value) ? value : Exceptions.TypeError('CallToolRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CallToolResult
// ------------------------------------------------------------------
const CallToolResult: Validator<CallToolResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CallToolResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("content" in value && "resultType" in value) && (((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (Array.isArray(value.content) && value.content.every((unique_0, index) => (check_1(unique_0))))) && (value.isError === undefined || (!("isError" in value) || typeof value.isError === "boolean"))) && typeof value.resultType === "string") && (value.structuredContent === undefined || (!("structuredContent" in value) || true))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CallToolResult => check_0(value)
  const Parse = (value: unknown): CallToolResult => Check(value) ? value : Exceptions.TypeError('CallToolResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CallToolResultResponse
// ------------------------------------------------------------------
const CallToolResultResponse: Validator<CallToolResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CallToolResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (check_1(value.result) || check_1(value.result))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CallToolResultResponse => check_0(value)
  const Parse = (value: unknown): CallToolResultResponse => Check(value) ? value : Exceptions.TypeError('CallToolResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CancelledNotification
// ------------------------------------------------------------------
const CancelledNotification: Validator<CancelledNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CancelledNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("jsonrpc" in value && "method" in value) && "params" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/cancelled")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CancelledNotification => check_0(value)
  const Parse = (value: unknown): CancelledNotification => Check(value) ? value : Exceptions.TypeError('CancelledNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CancelledNotificationParams
// ------------------------------------------------------------------
const CancelledNotificationParams: Validator<CancelledNotificationParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CancelledNotificationParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("requestId" in value && (((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.reason === undefined || (!("reason" in value) || typeof value.reason === "string"))) && check_1(value.requestId)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CancelledNotificationParams => check_0(value)
  const Parse = (value: unknown): CancelledNotificationParams => Check(value) ? value : Exceptions.TypeError('CancelledNotificationParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ClientCapabilities
// ------------------------------------------------------------------
const ClientCapabilities: Validator<ClientCapabilities> = (() => {
  const External = [/(?!)/u, /(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ClientCapabilities' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((((value.elicitation === undefined || (!("elicitation" in value) || ((typeof value.elicitation === "object" && value.elicitation !== null && !(Array.isArray(value.elicitation))) && ((value.elicitation.form === undefined || (!("form" in value.elicitation) || check_1(value.elicitation.form))) && (value.elicitation.url === undefined || (!("url" in value.elicitation) || check_1(value.elicitation.url))))))) && (value.experimental === undefined || (!("experimental" in value) || ((typeof value.experimental === "object" && value.experimental !== null && !(Array.isArray(value.experimental))) && Object.getOwnPropertyNames(value.experimental).every((unique_0, unique_1) => ((External[0].test(unique_0) || check_1(value.experimental[unique_0])))))))) && (value.extensions === undefined || (!("extensions" in value) || ((typeof value.extensions === "object" && value.extensions !== null && !(Array.isArray(value.extensions))) && Object.getOwnPropertyNames(value.extensions).every((unique_2, unique_3) => ((External[1].test(unique_2) || check_1(value.extensions[unique_2])))))))) && (value.roots === undefined || (!("roots" in value) || ((typeof value.roots === "object" && value.roots !== null && !(Array.isArray(value.roots))) && true)))) && (value.sampling === undefined || (!("sampling" in value) || ((typeof value.sampling === "object" && value.sampling !== null && !(Array.isArray(value.sampling))) && ((value.sampling.context === undefined || (!("context" in value.sampling) || check_1(value.sampling.context))) && (value.sampling.tools === undefined || (!("tools" in value.sampling) || check_1(value.sampling.tools))))))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ClientCapabilities => check_0(value)
  const Parse = (value: unknown): ClientCapabilities => Check(value) ? value : Exceptions.TypeError('ClientCapabilities', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ClientNotification
// ------------------------------------------------------------------
const ClientNotification: Validator<ClientNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ClientNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("jsonrpc" in value && "method" in value) && "params" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/cancelled")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ClientNotification => check_0(value)
  const Parse = (value: unknown): ClientNotification => Check(value) ? value : Exceptions.TypeError('ClientNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ClientRequest
// ------------------------------------------------------------------
const ClientRequest: Validator<ClientRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ClientRequest' })
  // @ts-ignore
  const check_0 = ((value) => (((((((((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ClientRequest => check_0(value)
  const Parse = (value: unknown): ClientRequest => Check(value) ? value : Exceptions.TypeError('ClientRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ClientResult
// ------------------------------------------------------------------
const ClientResult: Validator<ClientResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ClientResult' })
  // @ts-ignore
  const check_0 = ((value) => check_1(value))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ClientResult => check_0(value)
  const Parse = (value: unknown): ClientResult => Check(value) ? value : Exceptions.TypeError('ClientResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CompleteRequest
// ------------------------------------------------------------------
const CompleteRequest: Validator<CompleteRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CompleteRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "completion/complete")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CompleteRequest => check_0(value)
  const Parse = (value: unknown): CompleteRequest => Check(value) ? value : Exceptions.TypeError('CompleteRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CompleteRequestParams
// ------------------------------------------------------------------
const CompleteRequestParams: Validator<CompleteRequestParams> = (() => {
  const External = [/(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CompleteRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("_meta" in value && "argument" in value) && "ref" in value) && (((check_1(value._meta) && ((typeof value.argument === "object" && value.argument !== null && !(Array.isArray(value.argument))) && (("name" in value.argument && "value" in value.argument) && (typeof value.argument.name === "string" && typeof value.argument.value === "string")))) && (value.context === undefined || (!("context" in value) || ((typeof value.context === "object" && value.context !== null && !(Array.isArray(value.context))) && (value.context.arguments === undefined || (!("arguments" in value.context) || ((typeof value.context.arguments === "object" && value.context.arguments !== null && !(Array.isArray(value.context.arguments))) && Object.getOwnPropertyNames(value.context.arguments).every((unique_0, unique_1) => ((External[0].test(unique_0) || typeof value.context.arguments[unique_0] === "string")))))))))) && (check_1(value.ref) || check_1(value.ref))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CompleteRequestParams => check_0(value)
  const Parse = (value: unknown): CompleteRequestParams => Check(value) ? value : Exceptions.TypeError('CompleteRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CompleteResult
// ------------------------------------------------------------------
const CompleteResult: Validator<CompleteResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CompleteResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("completion" in value && "resultType" in value) && (((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && ((typeof value.completion === "object" && value.completion !== null && !(Array.isArray(value.completion))) && ("values" in value.completion && (((value.completion.hasMore === undefined || (!("hasMore" in value.completion) || typeof value.completion.hasMore === "boolean")) && (value.completion.total === undefined || (!("total" in value.completion) || Number.isInteger(value.completion.total)))) && (Array.isArray(value.completion.values) && (value.completion.values.every((unique_0, index) => (typeof unique_0 === "string")) && value.completion.values.length <= 100)))))) && typeof value.resultType === "string"))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CompleteResult => check_0(value)
  const Parse = (value: unknown): CompleteResult => Check(value) ? value : Exceptions.TypeError('CompleteResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CompleteResultResponse
// ------------------------------------------------------------------
const CompleteResultResponse: Validator<CompleteResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CompleteResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CompleteResultResponse => check_0(value)
  const Parse = (value: unknown): CompleteResultResponse => Check(value) ? value : Exceptions.TypeError('CompleteResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ContentBlock
// ------------------------------------------------------------------
const ContentBlock: Validator<ContentBlock> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ContentBlock' })
  // @ts-ignore
  const check_0 = ((value) => ((((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ContentBlock => check_0(value)
  const Parse = (value: unknown): ContentBlock => Check(value) ? value : Exceptions.TypeError('ContentBlock', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CreateMessageRequest
// ------------------------------------------------------------------
const CreateMessageRequest: Validator<CreateMessageRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CreateMessageRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("method" in value && "params" in value) && ((typeof value.method === "string" && value.method === "sampling/createMessage") && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CreateMessageRequest => check_0(value)
  const Parse = (value: unknown): CreateMessageRequest => Check(value) ? value : Exceptions.TypeError('CreateMessageRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CreateMessageRequestParams
// ------------------------------------------------------------------
const CreateMessageRequestParams: Validator<CreateMessageRequestParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CreateMessageRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("maxTokens" in value && "messages" in value) && ((((((((((value.includeContext === undefined || (!("includeContext" in value) || (typeof value.includeContext === "string" && ((value.includeContext === "allServers" || value.includeContext === "none") || value.includeContext === "thisServer")))) && Number.isInteger(value.maxTokens)) && (Array.isArray(value.messages) && value.messages.every((unique_0, index) => (check_1(unique_0))))) && (value.metadata === undefined || (!("metadata" in value) || check_1(value.metadata)))) && (value.modelPreferences === undefined || (!("modelPreferences" in value) || check_1(value.modelPreferences)))) && (value.stopSequences === undefined || (!("stopSequences" in value) || (Array.isArray(value.stopSequences) && value.stopSequences.every((unique_1, index) => (typeof unique_1 === "string")))))) && (value.systemPrompt === undefined || (!("systemPrompt" in value) || typeof value.systemPrompt === "string"))) && (value.temperature === undefined || (!("temperature" in value) || Number.isFinite(value.temperature)))) && (value.toolChoice === undefined || (!("toolChoice" in value) || check_1(value.toolChoice)))) && (value.tools === undefined || (!("tools" in value) || (Array.isArray(value.tools) && value.tools.every((unique_2, index) => (check_1(unique_2))))))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CreateMessageRequestParams => check_0(value)
  const Parse = (value: unknown): CreateMessageRequestParams => Check(value) ? value : Exceptions.TypeError('CreateMessageRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// CreateMessageResult
// ------------------------------------------------------------------
const CreateMessageResult: Validator<CreateMessageResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/CreateMessageResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("content" in value && "model" in value) && "role" in value) && (((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (((((check_1(value.content) || check_1(value.content)) || check_1(value.content)) || check_1(value.content)) || check_1(value.content)) || (Array.isArray(value.content) && value.content.every((unique_0, index) => (check_1(unique_0)))))) && typeof value.model === "string") && check_1(value.role)) && (value.stopReason === undefined || (!("stopReason" in value) || typeof value.stopReason === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is CreateMessageResult => check_0(value)
  const Parse = (value: unknown): CreateMessageResult => Check(value) ? value : Exceptions.TypeError('CreateMessageResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Cursor
// ------------------------------------------------------------------
const Cursor: Validator<Cursor> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Cursor' })
  // @ts-ignore
  const check_0 = ((value) => typeof value === "string")
  const Schema = () => schema_0
  const Check = (value: unknown): value is Cursor => check_0(value)
  const Parse = (value: unknown): Cursor => Check(value) ? value : Exceptions.TypeError('Cursor', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// DiscoverRequest
// ------------------------------------------------------------------
const DiscoverRequest: Validator<DiscoverRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/DiscoverRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "server/discover")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is DiscoverRequest => check_0(value)
  const Parse = (value: unknown): DiscoverRequest => Check(value) ? value : Exceptions.TypeError('DiscoverRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// DiscoverResult
// ------------------------------------------------------------------
const DiscoverResult: Validator<DiscoverResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/DiscoverResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((((("cacheScope" in value && "capabilities" in value) && "resultType" in value) && "supportedVersions" in value) && "ttlMs" in value) && (((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.cacheScope === "string" && (value.cacheScope === "private" || value.cacheScope === "public"))) && check_1(value.capabilities)) && (value.instructions === undefined || (!("instructions" in value) || typeof value.instructions === "string"))) && typeof value.resultType === "string") && (Array.isArray(value.supportedVersions) && value.supportedVersions.every((unique_0, index) => (typeof unique_0 === "string")))) && (Number.isInteger(value.ttlMs) && (!((Number.isFinite(value.ttlMs) || typeof value.ttlMs === "bigint")) || value.ttlMs >= 0))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is DiscoverResult => check_0(value)
  const Parse = (value: unknown): DiscoverResult => Check(value) ? value : Exceptions.TypeError('DiscoverResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// DiscoverResultResponse
// ------------------------------------------------------------------
const DiscoverResultResponse: Validator<DiscoverResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/DiscoverResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is DiscoverResultResponse => check_0(value)
  const Parse = (value: unknown): DiscoverResultResponse => Check(value) ? value : Exceptions.TypeError('DiscoverResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ElicitRequest
// ------------------------------------------------------------------
const ElicitRequest: Validator<ElicitRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ElicitRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("method" in value && "params" in value) && ((typeof value.method === "string" && value.method === "elicitation/create") && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ElicitRequest => check_0(value)
  const Parse = (value: unknown): ElicitRequest => Check(value) ? value : Exceptions.TypeError('ElicitRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ElicitRequestFormParams
// ------------------------------------------------------------------
const ElicitRequestFormParams: Validator<ElicitRequestFormParams> = (() => {
  const External = [/(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ElicitRequestFormParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("message" in value && "requestedSchema" in value) && ((typeof value.message === "string" && (value.mode === undefined || (!("mode" in value) || (typeof value.mode === "string" && value.mode === "form")))) && ((typeof value.requestedSchema === "object" && value.requestedSchema !== null && !(Array.isArray(value.requestedSchema))) && (("properties" in value.requestedSchema && "type" in value.requestedSchema) && ((((value.requestedSchema.$schema === undefined || (!("$schema" in value.requestedSchema) || typeof value.requestedSchema.$schema === "string")) && ((typeof value.requestedSchema.properties === "object" && value.requestedSchema.properties !== null && !(Array.isArray(value.requestedSchema.properties))) && Object.getOwnPropertyNames(value.requestedSchema.properties).every((unique_0, unique_1) => ((External[0].test(unique_0) || check_1(value.requestedSchema.properties[unique_0])))))) && (value.requestedSchema.required === undefined || (!("required" in value.requestedSchema) || (Array.isArray(value.requestedSchema.required) && value.requestedSchema.required.every((unique_2, index) => (typeof unique_2 === "string")))))) && (typeof value.requestedSchema.type === "string" && value.requestedSchema.type === "object"))))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ElicitRequestFormParams => check_0(value)
  const Parse = (value: unknown): ElicitRequestFormParams => Check(value) ? value : Exceptions.TypeError('ElicitRequestFormParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ElicitRequestParams
// ------------------------------------------------------------------
const ElicitRequestParams: Validator<ElicitRequestParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ElicitRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => (check_1(value) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ElicitRequestParams => check_0(value)
  const Parse = (value: unknown): ElicitRequestParams => Check(value) ? value : Exceptions.TypeError('ElicitRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ElicitRequestURLParams
// ------------------------------------------------------------------
const ElicitRequestURLParams: Validator<ElicitRequestURLParams> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ElicitRequestURLParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("message" in value && "mode" in value) && "url" in value) && ((typeof value.message === "string" && (typeof value.mode === "string" && value.mode === "url")) && (typeof value.url === "string" && External[0](value.url))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ElicitRequestURLParams => check_0(value)
  const Parse = (value: unknown): ElicitRequestURLParams => Check(value) ? value : Exceptions.TypeError('ElicitRequestURLParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ElicitResult
// ------------------------------------------------------------------
const ElicitResult: Validator<ElicitResult> = (() => {
  const External = [/(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ElicitResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("action" in value && ((typeof value.action === "string" && ((value.action === "accept" || value.action === "cancel") || value.action === "decline")) && (value.content === undefined || (!("content" in value) || ((typeof value.content === "object" && value.content !== null && !(Array.isArray(value.content))) && Object.getOwnPropertyNames(value.content).every((unique_0, unique_1) => ((External[0].test(unique_0) || ((Array.isArray(value.content[unique_0]) && value.content[unique_0].every((unique_2, index) => (typeof unique_2 === "string"))) || ((typeof value.content[unique_0] === "string" || Number.isInteger(value.content[unique_0])) || typeof value.content[unique_0] === "boolean"))))))))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ElicitResult => check_0(value)
  const Parse = (value: unknown): ElicitResult => Check(value) ? value : Exceptions.TypeError('ElicitResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// EmbeddedResource
// ------------------------------------------------------------------
const EmbeddedResource: Validator<EmbeddedResource> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/EmbeddedResource' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("resource" in value && "type" in value) && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && (check_1(value.resource) || check_1(value.resource))) && (typeof value.type === "string" && value.type === "resource")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is EmbeddedResource => check_0(value)
  const Parse = (value: unknown): EmbeddedResource => Check(value) ? value : Exceptions.TypeError('EmbeddedResource', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// EmptyResult
// ------------------------------------------------------------------
const EmptyResult: Validator<EmptyResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/EmptyResult' })
  // @ts-ignore
  const check_0 = ((value) => check_1(value))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is EmptyResult => check_0(value)
  const Parse = (value: unknown): EmptyResult => Check(value) ? value : Exceptions.TypeError('EmptyResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// EnumSchema
// ------------------------------------------------------------------
const EnumSchema: Validator<EnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/EnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is EnumSchema => check_0(value)
  const Parse = (value: unknown): EnumSchema => Check(value) ? value : Exceptions.TypeError('EnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Error
// ------------------------------------------------------------------
const Error: Validator<Error> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Error' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("code" in value && "message" in value) && ((Number.isInteger(value.code) && (value.data === undefined || (!("data" in value) || true))) && typeof value.message === "string"))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is Error => check_0(value)
  const Parse = (value: unknown): Error => Check(value) ? value : Exceptions.TypeError('Error', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// GetPromptRequest
// ------------------------------------------------------------------
const GetPromptRequest: Validator<GetPromptRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/GetPromptRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "prompts/get")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is GetPromptRequest => check_0(value)
  const Parse = (value: unknown): GetPromptRequest => Check(value) ? value : Exceptions.TypeError('GetPromptRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// GetPromptRequestParams
// ------------------------------------------------------------------
const GetPromptRequestParams: Validator<GetPromptRequestParams> = (() => {
  const External = [/(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/GetPromptRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("_meta" in value && "name" in value) && ((((check_1(value._meta) && (value.arguments === undefined || (!("arguments" in value) || ((typeof value.arguments === "object" && value.arguments !== null && !(Array.isArray(value.arguments))) && Object.getOwnPropertyNames(value.arguments).every((unique_0, unique_1) => ((External[0].test(unique_0) || typeof value.arguments[unique_0] === "string"))))))) && (value.inputResponses === undefined || (!("inputResponses" in value) || check_1(value.inputResponses)))) && typeof value.name === "string") && (value.requestState === undefined || (!("requestState" in value) || typeof value.requestState === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is GetPromptRequestParams => check_0(value)
  const Parse = (value: unknown): GetPromptRequestParams => Check(value) ? value : Exceptions.TypeError('GetPromptRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// GetPromptResult
// ------------------------------------------------------------------
const GetPromptResult: Validator<GetPromptResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/GetPromptResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("messages" in value && "resultType" in value) && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (Array.isArray(value.messages) && value.messages.every((unique_0, index) => (check_1(unique_0))))) && typeof value.resultType === "string"))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is GetPromptResult => check_0(value)
  const Parse = (value: unknown): GetPromptResult => Check(value) ? value : Exceptions.TypeError('GetPromptResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// GetPromptResultResponse
// ------------------------------------------------------------------
const GetPromptResultResponse: Validator<GetPromptResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/GetPromptResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (check_1(value.result) || check_1(value.result))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is GetPromptResultResponse => check_0(value)
  const Parse = (value: unknown): GetPromptResultResponse => Check(value) ? value : Exceptions.TypeError('GetPromptResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// HeaderMismatchError
// ------------------------------------------------------------------
const HeaderMismatchError: Validator<HeaderMismatchError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/HeaderMismatchError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("error" in value && "jsonrpc" in value) && (((check_1(value.error) && ((typeof value.error === "object" && value.error !== null && !(Array.isArray(value.error))) && ("code" in value.error && (Number.isInteger(value.error.code) && value.error.code === -32020)))) && (value.id === undefined || (!("id" in value) || check_1(value.id)))) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is HeaderMismatchError => check_0(value)
  const Parse = (value: unknown): HeaderMismatchError => Check(value) ? value : Exceptions.TypeError('HeaderMismatchError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Icon
// ------------------------------------------------------------------
const Icon: Validator<Icon> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Icon' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("src" in value && ((((value.mimeType === undefined || (!("mimeType" in value) || typeof value.mimeType === "string")) && (value.sizes === undefined || (!("sizes" in value) || (Array.isArray(value.sizes) && value.sizes.every((unique_0, index) => (typeof unique_0 === "string")))))) && (typeof value.src === "string" && External[0](value.src))) && (value.theme === undefined || (!("theme" in value) || (typeof value.theme === "string" && (value.theme === "dark" || value.theme === "light"))))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is Icon => check_0(value)
  const Parse = (value: unknown): Icon => Check(value) ? value : Exceptions.TypeError('Icon', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Icons
// ------------------------------------------------------------------
const Icons: Validator<Icons> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Icons' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (value.icons === undefined || (!("icons" in value) || (Array.isArray(value.icons) && value.icons.every((unique_0, index) => (check_1(unique_0))))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Icons => check_0(value)
  const Parse = (value: unknown): Icons => Check(value) ? value : Exceptions.TypeError('Icons', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ImageContent
// ------------------------------------------------------------------
const ImageContent: Validator<ImageContent> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ImageContent' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("data" in value && "mimeType" in value) && "type" in value) && (((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && (typeof value.data === "string" && true)) && typeof value.mimeType === "string") && (typeof value.type === "string" && value.type === "image")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ImageContent => check_0(value)
  const Parse = (value: unknown): ImageContent => Check(value) ? value : Exceptions.TypeError('ImageContent', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Implementation
// ------------------------------------------------------------------
const Implementation: Validator<Implementation> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Implementation' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("name" in value && "version" in value) && ((((((value.description === undefined || (!("description" in value) || typeof value.description === "string")) && (value.icons === undefined || (!("icons" in value) || (Array.isArray(value.icons) && value.icons.every((unique_0, index) => (check_1(unique_0))))))) && typeof value.name === "string") && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && typeof value.version === "string") && (value.websiteUrl === undefined || (!("websiteUrl" in value) || (typeof value.websiteUrl === "string" && External[0](value.websiteUrl))))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Implementation => check_0(value)
  const Parse = (value: unknown): Implementation => Check(value) ? value : Exceptions.TypeError('Implementation', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InputRequest
// ------------------------------------------------------------------
const InputRequest: Validator<InputRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InputRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((check_1(value) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is InputRequest => check_0(value)
  const Parse = (value: unknown): InputRequest => Check(value) ? value : Exceptions.TypeError('InputRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InputRequests
// ------------------------------------------------------------------
const InputRequests: Validator<InputRequests> = (() => {
  const External = [/(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InputRequests' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && Object.getOwnPropertyNames(value).every((unique_0, unique_1) => ((External[0].test(unique_0) || check_1(value[unique_0]))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is InputRequests => check_0(value)
  const Parse = (value: unknown): InputRequests => Check(value) ? value : Exceptions.TypeError('InputRequests', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InputRequiredResult
// ------------------------------------------------------------------
const InputRequiredResult: Validator<InputRequiredResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InputRequiredResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("resultType" in value && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.inputRequests === undefined || (!("inputRequests" in value) || check_1(value.inputRequests)))) && (value.requestState === undefined || (!("requestState" in value) || typeof value.requestState === "string"))) && typeof value.resultType === "string"))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is InputRequiredResult => check_0(value)
  const Parse = (value: unknown): InputRequiredResult => Check(value) ? value : Exceptions.TypeError('InputRequiredResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InputResponse
// ------------------------------------------------------------------
const InputResponse: Validator<InputResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InputResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((check_1(value) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is InputResponse => check_0(value)
  const Parse = (value: unknown): InputResponse => Check(value) ? value : Exceptions.TypeError('InputResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InputResponseRequestParams
// ------------------------------------------------------------------
const InputResponseRequestParams: Validator<InputResponseRequestParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InputResponseRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("_meta" in value && ((check_1(value._meta) && (value.inputResponses === undefined || (!("inputResponses" in value) || check_1(value.inputResponses)))) && (value.requestState === undefined || (!("requestState" in value) || typeof value.requestState === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is InputResponseRequestParams => check_0(value)
  const Parse = (value: unknown): InputResponseRequestParams => Check(value) ? value : Exceptions.TypeError('InputResponseRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InputResponses
// ------------------------------------------------------------------
const InputResponses: Validator<InputResponses> = (() => {
  const External = [/(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InputResponses' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && Object.getOwnPropertyNames(value).every((unique_0, unique_1) => ((External[0].test(unique_0) || check_1(value[unique_0]))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is InputResponses => check_0(value)
  const Parse = (value: unknown): InputResponses => Check(value) ? value : Exceptions.TypeError('InputResponses', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InternalError
// ------------------------------------------------------------------
const InternalError: Validator<InternalError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InternalError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("code" in value && "message" in value) && (((Number.isInteger(value.code) && value.code === -32603) && (value.data === undefined || (!("data" in value) || true))) && typeof value.message === "string"))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is InternalError => check_0(value)
  const Parse = (value: unknown): InternalError => Check(value) ? value : Exceptions.TypeError('InternalError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InvalidParamsError
// ------------------------------------------------------------------
const InvalidParamsError: Validator<InvalidParamsError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InvalidParamsError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("code" in value && "message" in value) && (((Number.isInteger(value.code) && value.code === -32602) && (value.data === undefined || (!("data" in value) || true))) && typeof value.message === "string"))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is InvalidParamsError => check_0(value)
  const Parse = (value: unknown): InvalidParamsError => Check(value) ? value : Exceptions.TypeError('InvalidParamsError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// InvalidRequestError
// ------------------------------------------------------------------
const InvalidRequestError: Validator<InvalidRequestError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/InvalidRequestError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("code" in value && "message" in value) && (((Number.isInteger(value.code) && value.code === -32600) && (value.data === undefined || (!("data" in value) || true))) && typeof value.message === "string"))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is InvalidRequestError => check_0(value)
  const Parse = (value: unknown): InvalidRequestError => Check(value) ? value : Exceptions.TypeError('InvalidRequestError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONArray
// ------------------------------------------------------------------
const JSONArray: Validator<JSONArray> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONArray' })
  // @ts-ignore
  const check_0 = ((value) => (Array.isArray(value) && value.every((unique_0, index) => (check_1(unique_0)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONArray => check_0(value)
  const Parse = (value: unknown): JSONArray => Check(value) ? value : Exceptions.TypeError('JSONArray', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONObject
// ------------------------------------------------------------------
const JSONObject: Validator<JSONObject> = (() => {
  const External = [/(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONObject' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && Object.getOwnPropertyNames(value).every((unique_0, unique_1) => ((External[0].test(unique_0) || check_1(value[unique_0]))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONObject => check_0(value)
  const Parse = (value: unknown): JSONObject => Check(value) ? value : Exceptions.TypeError('JSONObject', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONRPCErrorResponse
// ------------------------------------------------------------------
const JSONRPCErrorResponse: Validator<JSONRPCErrorResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONRPCErrorResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("error" in value && "jsonrpc" in value) && ((check_1(value.error) && (value.id === undefined || (!("id" in value) || check_1(value.id)))) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONRPCErrorResponse => check_0(value)
  const Parse = (value: unknown): JSONRPCErrorResponse => Check(value) ? value : Exceptions.TypeError('JSONRPCErrorResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONRPCMessage
// ------------------------------------------------------------------
const JSONRPCMessage: Validator<JSONRPCMessage> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONRPCMessage' })
  // @ts-ignore
  const check_0 = ((value) => (((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONRPCMessage => check_0(value)
  const Parse = (value: unknown): JSONRPCMessage => Check(value) ? value : Exceptions.TypeError('JSONRPCMessage', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONRPCNotification
// ------------------------------------------------------------------
const JSONRPCNotification: Validator<JSONRPCNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONRPCNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("jsonrpc" in value && "method" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && typeof value.method === "string") && (value.params === undefined || (!("params" in value) || ((typeof value.params === "object" && value.params !== null && !(Array.isArray(value.params))) && true)))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONRPCNotification => check_0(value)
  const Parse = (value: unknown): JSONRPCNotification => Check(value) ? value : Exceptions.TypeError('JSONRPCNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONRPCRequest
// ------------------------------------------------------------------
const JSONRPCRequest: Validator<JSONRPCRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONRPCRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "method" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && typeof value.method === "string") && (value.params === undefined || (!("params" in value) || ((typeof value.params === "object" && value.params !== null && !(Array.isArray(value.params))) && true)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONRPCRequest => check_0(value)
  const Parse = (value: unknown): JSONRPCRequest => Check(value) ? value : Exceptions.TypeError('JSONRPCRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONRPCResponse
// ------------------------------------------------------------------
const JSONRPCResponse: Validator<JSONRPCResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONRPCResponse' })
  // @ts-ignore
  const check_0 = ((value) => (check_1(value) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONRPCResponse => check_0(value)
  const Parse = (value: unknown): JSONRPCResponse => Check(value) ? value : Exceptions.TypeError('JSONRPCResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONRPCResultResponse
// ------------------------------------------------------------------
const JSONRPCResultResponse: Validator<JSONRPCResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONRPCResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONRPCResultResponse => check_0(value)
  const Parse = (value: unknown): JSONRPCResultResponse => Check(value) ? value : Exceptions.TypeError('JSONRPCResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// JSONValue
// ------------------------------------------------------------------
const JSONValue: Validator<JSONValue> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/JSONValue' })
  // @ts-ignore
  const check_0 = ((value) => ((check_1(value) || (Array.isArray(value) && value.every((unique_0, index) => (check_1(unique_0))))) || ((typeof value === "string" || Number.isInteger(value)) || typeof value === "boolean")))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is JSONValue => check_0(value)
  const Parse = (value: unknown): JSONValue => Check(value) ? value : Exceptions.TypeError('JSONValue', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// LegacyTitledEnumSchema
// ------------------------------------------------------------------
const LegacyTitledEnumSchema: Validator<LegacyTitledEnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/LegacyTitledEnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("enum" in value && "type" in value) && ((((((value.default === undefined || (!("default" in value) || typeof value.default === "string")) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (Array.isArray(value.enum) && value.enum.every((unique_0, index) => (typeof unique_0 === "string")))) && (value.enumNames === undefined || (!("enumNames" in value) || (Array.isArray(value.enumNames) && value.enumNames.every((unique_1, index) => (typeof unique_1 === "string")))))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "string")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is LegacyTitledEnumSchema => check_0(value)
  const Parse = (value: unknown): LegacyTitledEnumSchema => Check(value) ? value : Exceptions.TypeError('LegacyTitledEnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListPromptsRequest
// ------------------------------------------------------------------
const ListPromptsRequest: Validator<ListPromptsRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListPromptsRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "prompts/list")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListPromptsRequest => check_0(value)
  const Parse = (value: unknown): ListPromptsRequest => Check(value) ? value : Exceptions.TypeError('ListPromptsRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListPromptsResult
// ------------------------------------------------------------------
const ListPromptsResult: Validator<ListPromptsResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListPromptsResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("cacheScope" in value && "prompts" in value) && "resultType" in value) && "ttlMs" in value) && ((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.cacheScope === "string" && (value.cacheScope === "private" || value.cacheScope === "public"))) && (value.nextCursor === undefined || (!("nextCursor" in value) || typeof value.nextCursor === "string"))) && (Array.isArray(value.prompts) && value.prompts.every((unique_0, index) => (check_1(unique_0))))) && typeof value.resultType === "string") && (Number.isInteger(value.ttlMs) && (!((Number.isFinite(value.ttlMs) || typeof value.ttlMs === "bigint")) || value.ttlMs >= 0))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListPromptsResult => check_0(value)
  const Parse = (value: unknown): ListPromptsResult => Check(value) ? value : Exceptions.TypeError('ListPromptsResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListPromptsResultResponse
// ------------------------------------------------------------------
const ListPromptsResultResponse: Validator<ListPromptsResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListPromptsResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListPromptsResultResponse => check_0(value)
  const Parse = (value: unknown): ListPromptsResultResponse => Check(value) ? value : Exceptions.TypeError('ListPromptsResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListResourceTemplatesRequest
// ------------------------------------------------------------------
const ListResourceTemplatesRequest: Validator<ListResourceTemplatesRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListResourceTemplatesRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "resources/templates/list")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListResourceTemplatesRequest => check_0(value)
  const Parse = (value: unknown): ListResourceTemplatesRequest => Check(value) ? value : Exceptions.TypeError('ListResourceTemplatesRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListResourceTemplatesResult
// ------------------------------------------------------------------
const ListResourceTemplatesResult: Validator<ListResourceTemplatesResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListResourceTemplatesResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("cacheScope" in value && "resourceTemplates" in value) && "resultType" in value) && "ttlMs" in value) && ((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.cacheScope === "string" && (value.cacheScope === "private" || value.cacheScope === "public"))) && (value.nextCursor === undefined || (!("nextCursor" in value) || typeof value.nextCursor === "string"))) && (Array.isArray(value.resourceTemplates) && value.resourceTemplates.every((unique_0, index) => (check_1(unique_0))))) && typeof value.resultType === "string") && (Number.isInteger(value.ttlMs) && (!((Number.isFinite(value.ttlMs) || typeof value.ttlMs === "bigint")) || value.ttlMs >= 0))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListResourceTemplatesResult => check_0(value)
  const Parse = (value: unknown): ListResourceTemplatesResult => Check(value) ? value : Exceptions.TypeError('ListResourceTemplatesResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListResourceTemplatesResultResponse
// ------------------------------------------------------------------
const ListResourceTemplatesResultResponse: Validator<ListResourceTemplatesResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListResourceTemplatesResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListResourceTemplatesResultResponse => check_0(value)
  const Parse = (value: unknown): ListResourceTemplatesResultResponse => Check(value) ? value : Exceptions.TypeError('ListResourceTemplatesResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListResourcesRequest
// ------------------------------------------------------------------
const ListResourcesRequest: Validator<ListResourcesRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListResourcesRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "resources/list")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListResourcesRequest => check_0(value)
  const Parse = (value: unknown): ListResourcesRequest => Check(value) ? value : Exceptions.TypeError('ListResourcesRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListResourcesResult
// ------------------------------------------------------------------
const ListResourcesResult: Validator<ListResourcesResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListResourcesResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("cacheScope" in value && "resources" in value) && "resultType" in value) && "ttlMs" in value) && ((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.cacheScope === "string" && (value.cacheScope === "private" || value.cacheScope === "public"))) && (value.nextCursor === undefined || (!("nextCursor" in value) || typeof value.nextCursor === "string"))) && (Array.isArray(value.resources) && value.resources.every((unique_0, index) => (check_1(unique_0))))) && typeof value.resultType === "string") && (Number.isInteger(value.ttlMs) && (!((Number.isFinite(value.ttlMs) || typeof value.ttlMs === "bigint")) || value.ttlMs >= 0))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListResourcesResult => check_0(value)
  const Parse = (value: unknown): ListResourcesResult => Check(value) ? value : Exceptions.TypeError('ListResourcesResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListResourcesResultResponse
// ------------------------------------------------------------------
const ListResourcesResultResponse: Validator<ListResourcesResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListResourcesResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListResourcesResultResponse => check_0(value)
  const Parse = (value: unknown): ListResourcesResultResponse => Check(value) ? value : Exceptions.TypeError('ListResourcesResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListRootsRequest
// ------------------------------------------------------------------
const ListRootsRequest: Validator<ListRootsRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListRootsRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("method" in value && ((typeof value.method === "string" && value.method === "roots/list") && (value.params === undefined || (!("params" in value) || ((typeof value.params === "object" && value.params !== null && !(Array.isArray(value.params))) && (value.params._meta === undefined || (!("_meta" in value.params) || check_1(value.params._meta))))))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListRootsRequest => check_0(value)
  const Parse = (value: unknown): ListRootsRequest => Check(value) ? value : Exceptions.TypeError('ListRootsRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListRootsResult
// ------------------------------------------------------------------
const ListRootsResult: Validator<ListRootsResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListRootsResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("roots" in value && (Array.isArray(value.roots) && value.roots.every((unique_0, index) => (check_1(unique_0)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListRootsResult => check_0(value)
  const Parse = (value: unknown): ListRootsResult => Check(value) ? value : Exceptions.TypeError('ListRootsResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListToolsRequest
// ------------------------------------------------------------------
const ListToolsRequest: Validator<ListToolsRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListToolsRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "tools/list")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListToolsRequest => check_0(value)
  const Parse = (value: unknown): ListToolsRequest => Check(value) ? value : Exceptions.TypeError('ListToolsRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListToolsResult
// ------------------------------------------------------------------
const ListToolsResult: Validator<ListToolsResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListToolsResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("cacheScope" in value && "resultType" in value) && "tools" in value) && "ttlMs" in value) && ((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.cacheScope === "string" && (value.cacheScope === "private" || value.cacheScope === "public"))) && (value.nextCursor === undefined || (!("nextCursor" in value) || typeof value.nextCursor === "string"))) && typeof value.resultType === "string") && (Array.isArray(value.tools) && value.tools.every((unique_0, index) => (check_1(unique_0))))) && (Number.isInteger(value.ttlMs) && (!((Number.isFinite(value.ttlMs) || typeof value.ttlMs === "bigint")) || value.ttlMs >= 0))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListToolsResult => check_0(value)
  const Parse = (value: unknown): ListToolsResult => Check(value) ? value : Exceptions.TypeError('ListToolsResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ListToolsResultResponse
// ------------------------------------------------------------------
const ListToolsResultResponse: Validator<ListToolsResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ListToolsResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ListToolsResultResponse => check_0(value)
  const Parse = (value: unknown): ListToolsResultResponse => Check(value) ? value : Exceptions.TypeError('ListToolsResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// LoggingLevel
// ------------------------------------------------------------------
const LoggingLevel: Validator<LoggingLevel> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/LoggingLevel' })
  // @ts-ignore
  const check_0 = ((value) => (typeof value === "string" && (((((((value === "alert" || value === "critical") || value === "debug") || value === "emergency") || value === "error") || value === "info") || value === "notice") || value === "warning")))
  const Schema = () => schema_0
  const Check = (value: unknown): value is LoggingLevel => check_0(value)
  const Parse = (value: unknown): LoggingLevel => Check(value) ? value : Exceptions.TypeError('LoggingLevel', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// LoggingMessageNotification
// ------------------------------------------------------------------
const LoggingMessageNotification: Validator<LoggingMessageNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/LoggingMessageNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("jsonrpc" in value && "method" in value) && "params" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/message")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is LoggingMessageNotification => check_0(value)
  const Parse = (value: unknown): LoggingMessageNotification => Check(value) ? value : Exceptions.TypeError('LoggingMessageNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// LoggingMessageNotificationParams
// ------------------------------------------------------------------
const LoggingMessageNotificationParams: Validator<LoggingMessageNotificationParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/LoggingMessageNotificationParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("data" in value && "level" in value) && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && true) && check_1(value.level)) && (value.logger === undefined || (!("logger" in value) || typeof value.logger === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is LoggingMessageNotificationParams => check_0(value)
  const Parse = (value: unknown): LoggingMessageNotificationParams => Check(value) ? value : Exceptions.TypeError('LoggingMessageNotificationParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// MetaObject
// ------------------------------------------------------------------
const MetaObject: Validator<MetaObject> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/MetaObject' })
  // @ts-ignore
  const check_0 = ((value) => (typeof value === "object" && value !== null && !(Array.isArray(value))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is MetaObject => check_0(value)
  const Parse = (value: unknown): MetaObject => Check(value) ? value : Exceptions.TypeError('MetaObject', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// MethodNotFoundError
// ------------------------------------------------------------------
const MethodNotFoundError: Validator<MethodNotFoundError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/MethodNotFoundError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("code" in value && "message" in value) && (((Number.isInteger(value.code) && value.code === -32601) && (value.data === undefined || (!("data" in value) || true))) && typeof value.message === "string"))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is MethodNotFoundError => check_0(value)
  const Parse = (value: unknown): MethodNotFoundError => Check(value) ? value : Exceptions.TypeError('MethodNotFoundError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// MissingRequiredClientCapabilityError
// ------------------------------------------------------------------
const MissingRequiredClientCapabilityError: Validator<MissingRequiredClientCapabilityError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/MissingRequiredClientCapabilityError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("error" in value && "jsonrpc" in value) && (((check_1(value.error) && ((typeof value.error === "object" && value.error !== null && !(Array.isArray(value.error))) && (("code" in value.error && "data" in value.error) && ((Number.isInteger(value.error.code) && value.error.code === -32021) && ((typeof value.error.data === "object" && value.error.data !== null && !(Array.isArray(value.error.data))) && ("requiredCapabilities" in value.error.data && check_1(value.error.data.requiredCapabilities))))))) && (value.id === undefined || (!("id" in value) || check_1(value.id)))) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is MissingRequiredClientCapabilityError => check_0(value)
  const Parse = (value: unknown): MissingRequiredClientCapabilityError => Check(value) ? value : Exceptions.TypeError('MissingRequiredClientCapabilityError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ModelHint
// ------------------------------------------------------------------
const ModelHint: Validator<ModelHint> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ModelHint' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (value.name === undefined || (!("name" in value) || typeof value.name === "string"))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ModelHint => check_0(value)
  const Parse = (value: unknown): ModelHint => Check(value) ? value : Exceptions.TypeError('ModelHint', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ModelPreferences
// ------------------------------------------------------------------
const ModelPreferences: Validator<ModelPreferences> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ModelPreferences' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((((value.costPriority === undefined || (!("costPriority" in value) || (Number.isFinite(value.costPriority) && (value.costPriority >= 0 && value.costPriority <= 1)))) && (value.hints === undefined || (!("hints" in value) || (Array.isArray(value.hints) && value.hints.every((unique_0, index) => (check_1(unique_0))))))) && (value.intelligencePriority === undefined || (!("intelligencePriority" in value) || (Number.isFinite(value.intelligencePriority) && (value.intelligencePriority >= 0 && value.intelligencePriority <= 1))))) && (value.speedPriority === undefined || (!("speedPriority" in value) || (Number.isFinite(value.speedPriority) && (value.speedPriority >= 0 && value.speedPriority <= 1)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ModelPreferences => check_0(value)
  const Parse = (value: unknown): ModelPreferences => Check(value) ? value : Exceptions.TypeError('ModelPreferences', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// MultiSelectEnumSchema
// ------------------------------------------------------------------
const MultiSelectEnumSchema: Validator<MultiSelectEnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/MultiSelectEnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => (check_1(value) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is MultiSelectEnumSchema => check_0(value)
  const Parse = (value: unknown): MultiSelectEnumSchema => Check(value) ? value : Exceptions.TypeError('MultiSelectEnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Notification
// ------------------------------------------------------------------
const Notification: Validator<Notification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Notification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("method" in value && (typeof value.method === "string" && (value.params === undefined || (!("params" in value) || ((typeof value.params === "object" && value.params !== null && !(Array.isArray(value.params))) && true)))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is Notification => check_0(value)
  const Parse = (value: unknown): Notification => Check(value) ? value : Exceptions.TypeError('Notification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// NotificationMetaObject
// ------------------------------------------------------------------
const NotificationMetaObject: Validator<NotificationMetaObject> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/NotificationMetaObject' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (value["io.modelcontextprotocol/subscriptionId"] === undefined || (!("io.modelcontextprotocol/subscriptionId" in value) || check_1(value["io.modelcontextprotocol/subscriptionId"])))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is NotificationMetaObject => check_0(value)
  const Parse = (value: unknown): NotificationMetaObject => Check(value) ? value : Exceptions.TypeError('NotificationMetaObject', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// NotificationParams
// ------------------------------------------------------------------
const NotificationParams: Validator<NotificationParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/NotificationParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (value._meta === undefined || (!("_meta" in value) || check_1(value._meta)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is NotificationParams => check_0(value)
  const Parse = (value: unknown): NotificationParams => Check(value) ? value : Exceptions.TypeError('NotificationParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// NumberSchema
// ------------------------------------------------------------------
const NumberSchema: Validator<NumberSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/NumberSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("type" in value && ((((((value.default === undefined || (!("default" in value) || Number.isFinite(value.default))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.maximum === undefined || (!("maximum" in value) || Number.isFinite(value.maximum)))) && (value.minimum === undefined || (!("minimum" in value) || Number.isFinite(value.minimum)))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && (value.type === "integer" || value.type === "number"))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is NumberSchema => check_0(value)
  const Parse = (value: unknown): NumberSchema => Check(value) ? value : Exceptions.TypeError('NumberSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PaginatedRequest
// ------------------------------------------------------------------
const PaginatedRequest: Validator<PaginatedRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PaginatedRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && typeof value.method === "string") && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is PaginatedRequest => check_0(value)
  const Parse = (value: unknown): PaginatedRequest => Check(value) ? value : Exceptions.TypeError('PaginatedRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PaginatedRequestParams
// ------------------------------------------------------------------
const PaginatedRequestParams: Validator<PaginatedRequestParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PaginatedRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("_meta" in value && (check_1(value._meta) && (value.cursor === undefined || (!("cursor" in value) || typeof value.cursor === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is PaginatedRequestParams => check_0(value)
  const Parse = (value: unknown): PaginatedRequestParams => Check(value) ? value : Exceptions.TypeError('PaginatedRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PaginatedResult
// ------------------------------------------------------------------
const PaginatedResult: Validator<PaginatedResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PaginatedResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("resultType" in value && (((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.nextCursor === undefined || (!("nextCursor" in value) || typeof value.nextCursor === "string"))) && typeof value.resultType === "string"))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is PaginatedResult => check_0(value)
  const Parse = (value: unknown): PaginatedResult => Check(value) ? value : Exceptions.TypeError('PaginatedResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ParseError
// ------------------------------------------------------------------
const ParseError: Validator<ParseError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ParseError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("code" in value && "message" in value) && (((Number.isInteger(value.code) && value.code === -32700) && (value.data === undefined || (!("data" in value) || true))) && typeof value.message === "string"))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ParseError => check_0(value)
  const Parse = (value: unknown): ParseError => Check(value) ? value : Exceptions.TypeError('ParseError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PrimitiveSchemaDefinition
// ------------------------------------------------------------------
const PrimitiveSchemaDefinition: Validator<PrimitiveSchemaDefinition> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PrimitiveSchemaDefinition' })
  // @ts-ignore
  const check_0 = ((value) => (((((((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is PrimitiveSchemaDefinition => check_0(value)
  const Parse = (value: unknown): PrimitiveSchemaDefinition => Check(value) ? value : Exceptions.TypeError('PrimitiveSchemaDefinition', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ProgressNotification
// ------------------------------------------------------------------
const ProgressNotification: Validator<ProgressNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ProgressNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("jsonrpc" in value && "method" in value) && "params" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/progress")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ProgressNotification => check_0(value)
  const Parse = (value: unknown): ProgressNotification => Check(value) ? value : Exceptions.TypeError('ProgressNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ProgressNotificationParams
// ------------------------------------------------------------------
const ProgressNotificationParams: Validator<ProgressNotificationParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ProgressNotificationParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("progress" in value && "progressToken" in value) && (((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.message === undefined || (!("message" in value) || typeof value.message === "string"))) && Number.isFinite(value.progress)) && check_1(value.progressToken)) && (value.total === undefined || (!("total" in value) || Number.isFinite(value.total)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ProgressNotificationParams => check_0(value)
  const Parse = (value: unknown): ProgressNotificationParams => Check(value) ? value : Exceptions.TypeError('ProgressNotificationParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ProgressToken
// ------------------------------------------------------------------
const ProgressToken: Validator<ProgressToken> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ProgressToken' })
  // @ts-ignore
  const check_0 = ((value) => (typeof value === "string" || Number.isInteger(value)))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ProgressToken => check_0(value)
  const Parse = (value: unknown): ProgressToken => Check(value) ? value : Exceptions.TypeError('ProgressToken', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Prompt
// ------------------------------------------------------------------
const Prompt: Validator<Prompt> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Prompt' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("name" in value && ((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.arguments === undefined || (!("arguments" in value) || (Array.isArray(value.arguments) && value.arguments.every((unique_0, index) => (check_1(unique_0))))))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.icons === undefined || (!("icons" in value) || (Array.isArray(value.icons) && value.icons.every((unique_1, index) => (check_1(unique_1))))))) && typeof value.name === "string") && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Prompt => check_0(value)
  const Parse = (value: unknown): Prompt => Check(value) ? value : Exceptions.TypeError('Prompt', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PromptArgument
// ------------------------------------------------------------------
const PromptArgument: Validator<PromptArgument> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PromptArgument' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("name" in value && ((((value.description === undefined || (!("description" in value) || typeof value.description === "string")) && typeof value.name === "string") && (value.required === undefined || (!("required" in value) || typeof value.required === "boolean"))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is PromptArgument => check_0(value)
  const Parse = (value: unknown): PromptArgument => Check(value) ? value : Exceptions.TypeError('PromptArgument', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PromptListChangedNotification
// ------------------------------------------------------------------
const PromptListChangedNotification: Validator<PromptListChangedNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PromptListChangedNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("jsonrpc" in value && "method" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/prompts/list_changed")) && (value.params === undefined || (!("params" in value) || check_1(value.params)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is PromptListChangedNotification => check_0(value)
  const Parse = (value: unknown): PromptListChangedNotification => Check(value) ? value : Exceptions.TypeError('PromptListChangedNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PromptMessage
// ------------------------------------------------------------------
const PromptMessage: Validator<PromptMessage> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PromptMessage' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("content" in value && "role" in value) && (check_1(value.content) && check_1(value.role)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is PromptMessage => check_0(value)
  const Parse = (value: unknown): PromptMessage => Check(value) ? value : Exceptions.TypeError('PromptMessage', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// PromptReference
// ------------------------------------------------------------------
const PromptReference: Validator<PromptReference> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/PromptReference' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("name" in value && "type" in value) && ((typeof value.name === "string" && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "ref/prompt")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is PromptReference => check_0(value)
  const Parse = (value: unknown): PromptReference => Check(value) ? value : Exceptions.TypeError('PromptReference', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ReadResourceRequest
// ------------------------------------------------------------------
const ReadResourceRequest: Validator<ReadResourceRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ReadResourceRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "resources/read")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ReadResourceRequest => check_0(value)
  const Parse = (value: unknown): ReadResourceRequest => Check(value) ? value : Exceptions.TypeError('ReadResourceRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ReadResourceRequestParams
// ------------------------------------------------------------------
const ReadResourceRequestParams: Validator<ReadResourceRequestParams> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ReadResourceRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("_meta" in value && "uri" in value) && (((check_1(value._meta) && (value.inputResponses === undefined || (!("inputResponses" in value) || check_1(value.inputResponses)))) && (value.requestState === undefined || (!("requestState" in value) || typeof value.requestState === "string"))) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ReadResourceRequestParams => check_0(value)
  const Parse = (value: unknown): ReadResourceRequestParams => Check(value) ? value : Exceptions.TypeError('ReadResourceRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ReadResourceResult
// ------------------------------------------------------------------
const ReadResourceResult: Validator<ReadResourceResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ReadResourceResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("cacheScope" in value && "contents" in value) && "resultType" in value) && "ttlMs" in value) && (((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.cacheScope === "string" && (value.cacheScope === "private" || value.cacheScope === "public"))) && (Array.isArray(value.contents) && value.contents.every((unique_0, index) => ((check_1(unique_0) || check_1(unique_0)))))) && typeof value.resultType === "string") && (Number.isInteger(value.ttlMs) && (!((Number.isFinite(value.ttlMs) || typeof value.ttlMs === "bigint")) || value.ttlMs >= 0))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ReadResourceResult => check_0(value)
  const Parse = (value: unknown): ReadResourceResult => Check(value) ? value : Exceptions.TypeError('ReadResourceResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ReadResourceResultResponse
// ------------------------------------------------------------------
const ReadResourceResultResponse: Validator<ReadResourceResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ReadResourceResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (check_1(value.result) || check_1(value.result))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ReadResourceResultResponse => check_0(value)
  const Parse = (value: unknown): ReadResourceResultResponse => Check(value) ? value : Exceptions.TypeError('ReadResourceResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Request
// ------------------------------------------------------------------
const Request: Validator<Request> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Request' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("method" in value && (typeof value.method === "string" && (value.params === undefined || (!("params" in value) || ((typeof value.params === "object" && value.params !== null && !(Array.isArray(value.params))) && true)))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is Request => check_0(value)
  const Parse = (value: unknown): Request => Check(value) ? value : Exceptions.TypeError('Request', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// RequestId
// ------------------------------------------------------------------
const RequestId: Validator<RequestId> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/RequestId' })
  // @ts-ignore
  const check_0 = ((value) => (typeof value === "string" || Number.isInteger(value)))
  const Schema = () => schema_0
  const Check = (value: unknown): value is RequestId => check_0(value)
  const Parse = (value: unknown): RequestId => Check(value) ? value : Exceptions.TypeError('RequestId', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// RequestMetaObject
// ------------------------------------------------------------------
const RequestMetaObject: Validator<RequestMetaObject> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/RequestMetaObject' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("io.modelcontextprotocol/clientCapabilities" in value && "io.modelcontextprotocol/protocolVersion" in value) && ((((check_1(value["io.modelcontextprotocol/clientCapabilities"]) && (value["io.modelcontextprotocol/clientInfo"] === undefined || (!("io.modelcontextprotocol/clientInfo" in value) || check_1(value["io.modelcontextprotocol/clientInfo"])))) && (value["io.modelcontextprotocol/logLevel"] === undefined || (!("io.modelcontextprotocol/logLevel" in value) || check_1(value["io.modelcontextprotocol/logLevel"])))) && typeof value["io.modelcontextprotocol/protocolVersion"] === "string") && (value.progressToken === undefined || (!("progressToken" in value) || check_1(value.progressToken)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is RequestMetaObject => check_0(value)
  const Parse = (value: unknown): RequestMetaObject => Check(value) ? value : Exceptions.TypeError('RequestMetaObject', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// RequestParams
// ------------------------------------------------------------------
const RequestParams: Validator<RequestParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/RequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("_meta" in value && check_1(value._meta))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is RequestParams => check_0(value)
  const Parse = (value: unknown): RequestParams => Check(value) ? value : Exceptions.TypeError('RequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Resource
// ------------------------------------------------------------------
const Resource: Validator<Resource> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Resource' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("name" in value && "uri" in value) && (((((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.icons === undefined || (!("icons" in value) || (Array.isArray(value.icons) && value.icons.every((unique_0, index) => (check_1(unique_0))))))) && (value.mimeType === undefined || (!("mimeType" in value) || typeof value.mimeType === "string"))) && typeof value.name === "string") && (value.size === undefined || (!("size" in value) || Number.isInteger(value.size)))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Resource => check_0(value)
  const Parse = (value: unknown): Resource => Check(value) ? value : Exceptions.TypeError('Resource', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceContents
// ------------------------------------------------------------------
const ResourceContents: Validator<ResourceContents> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceContents' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("uri" in value && (((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.mimeType === undefined || (!("mimeType" in value) || typeof value.mimeType === "string"))) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceContents => check_0(value)
  const Parse = (value: unknown): ResourceContents => Check(value) ? value : Exceptions.TypeError('ResourceContents', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceLink
// ------------------------------------------------------------------
const ResourceLink: Validator<ResourceLink> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceLink' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("name" in value && "type" in value) && "uri" in value) && ((((((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.icons === undefined || (!("icons" in value) || (Array.isArray(value.icons) && value.icons.every((unique_0, index) => (check_1(unique_0))))))) && (value.mimeType === undefined || (!("mimeType" in value) || typeof value.mimeType === "string"))) && typeof value.name === "string") && (value.size === undefined || (!("size" in value) || Number.isInteger(value.size)))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "resource_link")) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceLink => check_0(value)
  const Parse = (value: unknown): ResourceLink => Check(value) ? value : Exceptions.TypeError('ResourceLink', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceListChangedNotification
// ------------------------------------------------------------------
const ResourceListChangedNotification: Validator<ResourceListChangedNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceListChangedNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("jsonrpc" in value && "method" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/resources/list_changed")) && (value.params === undefined || (!("params" in value) || check_1(value.params)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceListChangedNotification => check_0(value)
  const Parse = (value: unknown): ResourceListChangedNotification => Check(value) ? value : Exceptions.TypeError('ResourceListChangedNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceRequestParams
// ------------------------------------------------------------------
const ResourceRequestParams: Validator<ResourceRequestParams> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("_meta" in value && "uri" in value) && (check_1(value._meta) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceRequestParams => check_0(value)
  const Parse = (value: unknown): ResourceRequestParams => Check(value) ? value : Exceptions.TypeError('ResourceRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceTemplate
// ------------------------------------------------------------------
const ResourceTemplate: Validator<ResourceTemplate> = (() => {
  const External = [Format.IsUriTemplate]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceTemplate' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("name" in value && "uriTemplate" in value) && ((((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.icons === undefined || (!("icons" in value) || (Array.isArray(value.icons) && value.icons.every((unique_0, index) => (check_1(unique_0))))))) && (value.mimeType === undefined || (!("mimeType" in value) || typeof value.mimeType === "string"))) && typeof value.name === "string") && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.uriTemplate === "string" && External[0](value.uriTemplate))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceTemplate => check_0(value)
  const Parse = (value: unknown): ResourceTemplate => Check(value) ? value : Exceptions.TypeError('ResourceTemplate', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceTemplateReference
// ------------------------------------------------------------------
const ResourceTemplateReference: Validator<ResourceTemplateReference> = (() => {
  const External = [Format.IsUriTemplate]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceTemplateReference' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("type" in value && "uri" in value) && ((typeof value.type === "string" && value.type === "ref/resource") && (typeof value.uri === "string" && External[0](value.uri))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceTemplateReference => check_0(value)
  const Parse = (value: unknown): ResourceTemplateReference => Check(value) ? value : Exceptions.TypeError('ResourceTemplateReference', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceUpdatedNotification
// ------------------------------------------------------------------
const ResourceUpdatedNotification: Validator<ResourceUpdatedNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceUpdatedNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("jsonrpc" in value && "method" in value) && "params" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/resources/updated")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceUpdatedNotification => check_0(value)
  const Parse = (value: unknown): ResourceUpdatedNotification => Check(value) ? value : Exceptions.TypeError('ResourceUpdatedNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResourceUpdatedNotificationParams
// ------------------------------------------------------------------
const ResourceUpdatedNotificationParams: Validator<ResourceUpdatedNotificationParams> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResourceUpdatedNotificationParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("uri" in value && ((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResourceUpdatedNotificationParams => check_0(value)
  const Parse = (value: unknown): ResourceUpdatedNotificationParams => Check(value) ? value : Exceptions.TypeError('ResourceUpdatedNotificationParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Result
// ------------------------------------------------------------------
const Result: Validator<Result> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Result' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("resultType" in value && true) && ((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && typeof value.resultType === "string"))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Result => check_0(value)
  const Parse = (value: unknown): Result => Check(value) ? value : Exceptions.TypeError('Result', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResultMetaObject
// ------------------------------------------------------------------
const ResultMetaObject: Validator<ResultMetaObject> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResultMetaObject' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (value["io.modelcontextprotocol/serverInfo"] === undefined || (!("io.modelcontextprotocol/serverInfo" in value) || check_1(value["io.modelcontextprotocol/serverInfo"])))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResultMetaObject => check_0(value)
  const Parse = (value: unknown): ResultMetaObject => Check(value) ? value : Exceptions.TypeError('ResultMetaObject', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ResultType
// ------------------------------------------------------------------
const ResultType: Validator<ResultType> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ResultType' })
  // @ts-ignore
  const check_0 = ((value) => typeof value === "string")
  const Schema = () => schema_0
  const Check = (value: unknown): value is ResultType => check_0(value)
  const Parse = (value: unknown): ResultType => Check(value) ? value : Exceptions.TypeError('ResultType', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Role
// ------------------------------------------------------------------
const Role: Validator<Role> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Role' })
  // @ts-ignore
  const check_0 = ((value) => (typeof value === "string" && (value === "assistant" || value === "user")))
  const Schema = () => schema_0
  const Check = (value: unknown): value is Role => check_0(value)
  const Parse = (value: unknown): Role => Check(value) ? value : Exceptions.TypeError('Role', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Root
// ------------------------------------------------------------------
const Root: Validator<Root> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Root' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("uri" in value && (((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.name === undefined || (!("name" in value) || typeof value.name === "string"))) && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Root => check_0(value)
  const Parse = (value: unknown): Root => Check(value) ? value : Exceptions.TypeError('Root', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SamplingMessage
// ------------------------------------------------------------------
const SamplingMessage: Validator<SamplingMessage> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SamplingMessage' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("content" in value && "role" in value) && (((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (((((check_1(value.content) || check_1(value.content)) || check_1(value.content)) || check_1(value.content)) || check_1(value.content)) || (Array.isArray(value.content) && value.content.every((unique_0, index) => (check_1(unique_0)))))) && check_1(value.role)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SamplingMessage => check_0(value)
  const Parse = (value: unknown): SamplingMessage => Check(value) ? value : Exceptions.TypeError('SamplingMessage', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SamplingMessageContentBlock
// ------------------------------------------------------------------
const SamplingMessageContentBlock: Validator<SamplingMessageContentBlock> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SamplingMessageContentBlock' })
  // @ts-ignore
  const check_0 = ((value) => ((((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SamplingMessageContentBlock => check_0(value)
  const Parse = (value: unknown): SamplingMessageContentBlock => Check(value) ? value : Exceptions.TypeError('SamplingMessageContentBlock', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ServerCapabilities
// ------------------------------------------------------------------
const ServerCapabilities: Validator<ServerCapabilities> = (() => {
  const External = [/(?!)/u, /(?!)/u]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ServerCapabilities' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((((((value.completions === undefined || (!("completions" in value) || check_1(value.completions))) && (value.experimental === undefined || (!("experimental" in value) || ((typeof value.experimental === "object" && value.experimental !== null && !(Array.isArray(value.experimental))) && Object.getOwnPropertyNames(value.experimental).every((unique_0, unique_1) => ((External[0].test(unique_0) || check_1(value.experimental[unique_0])))))))) && (value.extensions === undefined || (!("extensions" in value) || ((typeof value.extensions === "object" && value.extensions !== null && !(Array.isArray(value.extensions))) && Object.getOwnPropertyNames(value.extensions).every((unique_2, unique_3) => ((External[1].test(unique_2) || check_1(value.extensions[unique_2])))))))) && (value.logging === undefined || (!("logging" in value) || check_1(value.logging)))) && (value.prompts === undefined || (!("prompts" in value) || ((typeof value.prompts === "object" && value.prompts !== null && !(Array.isArray(value.prompts))) && (value.prompts.listChanged === undefined || (!("listChanged" in value.prompts) || typeof value.prompts.listChanged === "boolean")))))) && (value.resources === undefined || (!("resources" in value) || ((typeof value.resources === "object" && value.resources !== null && !(Array.isArray(value.resources))) && ((value.resources.listChanged === undefined || (!("listChanged" in value.resources) || typeof value.resources.listChanged === "boolean")) && (value.resources.subscribe === undefined || (!("subscribe" in value.resources) || typeof value.resources.subscribe === "boolean"))))))) && (value.tools === undefined || (!("tools" in value) || ((typeof value.tools === "object" && value.tools !== null && !(Array.isArray(value.tools))) && (value.tools.listChanged === undefined || (!("listChanged" in value.tools) || typeof value.tools.listChanged === "boolean"))))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ServerCapabilities => check_0(value)
  const Parse = (value: unknown): ServerCapabilities => Check(value) ? value : Exceptions.TypeError('ServerCapabilities', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ServerNotification
// ------------------------------------------------------------------
const ServerNotification: Validator<ServerNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ServerNotification' })
  // @ts-ignore
  const check_0 = ((value) => (((((((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ServerNotification => check_0(value)
  const Parse = (value: unknown): ServerNotification => Check(value) ? value : Exceptions.TypeError('ServerNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ServerResult
// ------------------------------------------------------------------
const ServerResult: Validator<ServerResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ServerResult' })
  // @ts-ignore
  const check_0 = ((value) => (((((((((((check_1(value) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ServerResult => check_0(value)
  const Parse = (value: unknown): ServerResult => Check(value) ? value : Exceptions.TypeError('ServerResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SingleSelectEnumSchema
// ------------------------------------------------------------------
const SingleSelectEnumSchema: Validator<SingleSelectEnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SingleSelectEnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => (check_1(value) || check_1(value)))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SingleSelectEnumSchema => check_0(value)
  const Parse = (value: unknown): SingleSelectEnumSchema => Check(value) ? value : Exceptions.TypeError('SingleSelectEnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// StringSchema
// ------------------------------------------------------------------
const StringSchema: Validator<StringSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/StringSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("type" in value && (((((((value.default === undefined || (!("default" in value) || typeof value.default === "string")) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.format === undefined || (!("format" in value) || (typeof value.format === "string" && (((value.format === "date" || value.format === "date-time") || value.format === "email") || value.format === "uri"))))) && (value.maxLength === undefined || (!("maxLength" in value) || Number.isInteger(value.maxLength)))) && (value.minLength === undefined || (!("minLength" in value) || Number.isInteger(value.minLength)))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "string")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is StringSchema => check_0(value)
  const Parse = (value: unknown): StringSchema => Check(value) ? value : Exceptions.TypeError('StringSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionFilter
// ------------------------------------------------------------------
const SubscriptionFilter: Validator<SubscriptionFilter> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionFilter' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((((value.promptsListChanged === undefined || (!("promptsListChanged" in value) || typeof value.promptsListChanged === "boolean")) && (value.resourceSubscriptions === undefined || (!("resourceSubscriptions" in value) || (Array.isArray(value.resourceSubscriptions) && value.resourceSubscriptions.every((unique_0, index) => (typeof unique_0 === "string")))))) && (value.resourcesListChanged === undefined || (!("resourcesListChanged" in value) || typeof value.resourcesListChanged === "boolean"))) && (value.toolsListChanged === undefined || (!("toolsListChanged" in value) || typeof value.toolsListChanged === "boolean")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionFilter => check_0(value)
  const Parse = (value: unknown): SubscriptionFilter => Check(value) ? value : Exceptions.TypeError('SubscriptionFilter', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionsAcknowledgedNotification
// ------------------------------------------------------------------
const SubscriptionsAcknowledgedNotification: Validator<SubscriptionsAcknowledgedNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionsAcknowledgedNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("jsonrpc" in value && "method" in value) && "params" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/subscriptions/acknowledged")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionsAcknowledgedNotification => check_0(value)
  const Parse = (value: unknown): SubscriptionsAcknowledgedNotification => Check(value) ? value : Exceptions.TypeError('SubscriptionsAcknowledgedNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionsAcknowledgedNotificationParams
// ------------------------------------------------------------------
const SubscriptionsAcknowledgedNotificationParams: Validator<SubscriptionsAcknowledgedNotificationParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionsAcknowledgedNotificationParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("notifications" in value && ((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && check_1(value.notifications)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionsAcknowledgedNotificationParams => check_0(value)
  const Parse = (value: unknown): SubscriptionsAcknowledgedNotificationParams => Check(value) ? value : Exceptions.TypeError('SubscriptionsAcknowledgedNotificationParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionsListenRequest
// ------------------------------------------------------------------
const SubscriptionsListenRequest: Validator<SubscriptionsListenRequest> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionsListenRequest' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "jsonrpc" in value) && "method" in value) && "params" in value) && (((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && (typeof value.method === "string" && value.method === "subscriptions/listen")) && check_1(value.params)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionsListenRequest => check_0(value)
  const Parse = (value: unknown): SubscriptionsListenRequest => Check(value) ? value : Exceptions.TypeError('SubscriptionsListenRequest', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionsListenRequestParams
// ------------------------------------------------------------------
const SubscriptionsListenRequestParams: Validator<SubscriptionsListenRequestParams> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionsListenRequestParams' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("_meta" in value && "notifications" in value) && (check_1(value._meta) && check_1(value.notifications)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionsListenRequestParams => check_0(value)
  const Parse = (value: unknown): SubscriptionsListenRequestParams => Check(value) ? value : Exceptions.TypeError('SubscriptionsListenRequestParams', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionsListenResult
// ------------------------------------------------------------------
const SubscriptionsListenResult: Validator<SubscriptionsListenResult> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionsListenResult' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("_meta" in value && "resultType" in value) && (check_1(value._meta) && typeof value.resultType === "string"))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionsListenResult => check_0(value)
  const Parse = (value: unknown): SubscriptionsListenResult => Check(value) ? value : Exceptions.TypeError('SubscriptionsListenResult', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionsListenResultMetaObject
// ------------------------------------------------------------------
const SubscriptionsListenResultMetaObject: Validator<SubscriptionsListenResultMetaObject> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionsListenResultMetaObject' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ("io.modelcontextprotocol/subscriptionId" in value && ((value["io.modelcontextprotocol/serverInfo"] === undefined || (!("io.modelcontextprotocol/serverInfo" in value) || check_1(value["io.modelcontextprotocol/serverInfo"]))) && check_1(value["io.modelcontextprotocol/subscriptionId"])))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionsListenResultMetaObject => check_0(value)
  const Parse = (value: unknown): SubscriptionsListenResultMetaObject => Check(value) ? value : Exceptions.TypeError('SubscriptionsListenResultMetaObject', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// SubscriptionsListenResultResponse
// ------------------------------------------------------------------
const SubscriptionsListenResultResponse: Validator<SubscriptionsListenResultResponse> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/SubscriptionsListenResultResponse' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("id" in value && "jsonrpc" in value) && "result" in value) && ((check_1(value.id) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")) && check_1(value.result)))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is SubscriptionsListenResultResponse => check_0(value)
  const Parse = (value: unknown): SubscriptionsListenResultResponse => Check(value) ? value : Exceptions.TypeError('SubscriptionsListenResultResponse', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// TextContent
// ------------------------------------------------------------------
const TextContent: Validator<TextContent> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/TextContent' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("text" in value && "type" in value) && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && typeof value.text === "string") && (typeof value.type === "string" && value.type === "text")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is TextContent => check_0(value)
  const Parse = (value: unknown): TextContent => Check(value) ? value : Exceptions.TypeError('TextContent', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// TextResourceContents
// ------------------------------------------------------------------
const TextResourceContents: Validator<TextResourceContents> = (() => {
  const External = [Format.IsUri]
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/TextResourceContents' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("text" in value && "uri" in value) && ((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.mimeType === undefined || (!("mimeType" in value) || typeof value.mimeType === "string"))) && typeof value.text === "string") && (typeof value.uri === "string" && External[0](value.uri))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is TextResourceContents => check_0(value)
  const Parse = (value: unknown): TextResourceContents => Check(value) ? value : Exceptions.TypeError('TextResourceContents', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// TitledMultiSelectEnumSchema
// ------------------------------------------------------------------
const TitledMultiSelectEnumSchema: Validator<TitledMultiSelectEnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/TitledMultiSelectEnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("items" in value && "type" in value) && (((((((value.default === undefined || (!("default" in value) || (Array.isArray(value.default) && value.default.every((unique_0, index) => (typeof unique_0 === "string"))))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && ((typeof value.items === "object" && value.items !== null && !(Array.isArray(value.items))) && ("anyOf" in value.items && (Array.isArray(value.items.anyOf) && value.items.anyOf.every((unique_1, index) => (((typeof unique_1 === "object" && unique_1 !== null && !(Array.isArray(unique_1))) && (("const" in unique_1 && "title" in unique_1) && (typeof unique_1.const === "string" && typeof unique_1.title === "string"))))))))) && (value.maxItems === undefined || (!("maxItems" in value) || Number.isInteger(value.maxItems)))) && (value.minItems === undefined || (!("minItems" in value) || Number.isInteger(value.minItems)))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "array")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is TitledMultiSelectEnumSchema => check_0(value)
  const Parse = (value: unknown): TitledMultiSelectEnumSchema => Check(value) ? value : Exceptions.TypeError('TitledMultiSelectEnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// TitledSingleSelectEnumSchema
// ------------------------------------------------------------------
const TitledSingleSelectEnumSchema: Validator<TitledSingleSelectEnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/TitledSingleSelectEnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("oneOf" in value && "type" in value) && (((((value.default === undefined || (!("default" in value) || typeof value.default === "string")) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (Array.isArray(value.oneOf) && value.oneOf.every((unique_0, index) => (((typeof unique_0 === "object" && unique_0 !== null && !(Array.isArray(unique_0))) && (("const" in unique_0 && "title" in unique_0) && (typeof unique_0.const === "string" && typeof unique_0.title === "string"))))))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "string")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is TitledSingleSelectEnumSchema => check_0(value)
  const Parse = (value: unknown): TitledSingleSelectEnumSchema => Check(value) ? value : Exceptions.TypeError('TitledSingleSelectEnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Tool
// ------------------------------------------------------------------
const Tool: Validator<Tool> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/Tool' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("inputSchema" in value && "name" in value) && ((((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (value.annotations === undefined || (!("annotations" in value) || check_1(value.annotations)))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (value.icons === undefined || (!("icons" in value) || (Array.isArray(value.icons) && value.icons.every((unique_0, index) => (check_1(unique_0))))))) && ((typeof value.inputSchema === "object" && value.inputSchema !== null && !(Array.isArray(value.inputSchema))) && (("type" in value.inputSchema && true) && ((value.inputSchema.$schema === undefined || (!("$schema" in value.inputSchema) || typeof value.inputSchema.$schema === "string")) && (typeof value.inputSchema.type === "string" && value.inputSchema.type === "object"))))) && typeof value.name === "string") && (value.outputSchema === undefined || (!("outputSchema" in value) || ((typeof value.outputSchema === "object" && value.outputSchema !== null && !(Array.isArray(value.outputSchema))) && (true && (value.outputSchema.$schema === undefined || (!("$schema" in value.outputSchema) || typeof value.outputSchema.$schema === "string"))))))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is Tool => check_0(value)
  const Parse = (value: unknown): Tool => Check(value) ? value : Exceptions.TypeError('Tool', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ToolAnnotations
// ------------------------------------------------------------------
const ToolAnnotations: Validator<ToolAnnotations> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ToolAnnotations' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((((value.destructiveHint === undefined || (!("destructiveHint" in value) || typeof value.destructiveHint === "boolean")) && (value.idempotentHint === undefined || (!("idempotentHint" in value) || typeof value.idempotentHint === "boolean"))) && (value.openWorldHint === undefined || (!("openWorldHint" in value) || typeof value.openWorldHint === "boolean"))) && (value.readOnlyHint === undefined || (!("readOnlyHint" in value) || typeof value.readOnlyHint === "boolean"))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ToolAnnotations => check_0(value)
  const Parse = (value: unknown): ToolAnnotations => Check(value) ? value : Exceptions.TypeError('ToolAnnotations', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ToolChoice
// ------------------------------------------------------------------
const ToolChoice: Validator<ToolChoice> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ToolChoice' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (value.mode === undefined || (!("mode" in value) || (typeof value.mode === "string" && ((value.mode === "auto" || value.mode === "none") || value.mode === "required"))))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is ToolChoice => check_0(value)
  const Parse = (value: unknown): ToolChoice => Check(value) ? value : Exceptions.TypeError('ToolChoice', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ToolListChangedNotification
// ------------------------------------------------------------------
const ToolListChangedNotification: Validator<ToolListChangedNotification> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ToolListChangedNotification' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("jsonrpc" in value && "method" in value) && (((typeof value.jsonrpc === "string" && value.jsonrpc === "2.0") && (typeof value.method === "string" && value.method === "notifications/tools/list_changed")) && (value.params === undefined || (!("params" in value) || check_1(value.params)))))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ToolListChangedNotification => check_0(value)
  const Parse = (value: unknown): ToolListChangedNotification => Check(value) ? value : Exceptions.TypeError('ToolListChangedNotification', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ToolResultContent
// ------------------------------------------------------------------
const ToolResultContent: Validator<ToolResultContent> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ToolResultContent' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && ((("content" in value && "toolUseId" in value) && "type" in value) && ((((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && (Array.isArray(value.content) && value.content.every((unique_0, index) => (check_1(unique_0))))) && (value.isError === undefined || (!("isError" in value) || typeof value.isError === "boolean"))) && (value.structuredContent === undefined || (!("structuredContent" in value) || true))) && typeof value.toolUseId === "string") && (typeof value.type === "string" && value.type === "tool_result")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ToolResultContent => check_0(value)
  const Parse = (value: unknown): ToolResultContent => Check(value) ? value : Exceptions.TypeError('ToolResultContent', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// ToolUseContent
// ------------------------------------------------------------------
const ToolUseContent: Validator<ToolUseContent> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/ToolUseContent' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (((("id" in value && "input" in value) && "name" in value) && "type" in value) && (((((value._meta === undefined || (!("_meta" in value) || check_1(value._meta))) && typeof value.id === "string") && ((typeof value.input === "object" && value.input !== null && !(Array.isArray(value.input))) && true)) && typeof value.name === "string") && (typeof value.type === "string" && value.type === "tool_use")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is ToolUseContent => check_0(value)
  const Parse = (value: unknown): ToolUseContent => Check(value) ? value : Exceptions.TypeError('ToolUseContent', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// UnsupportedProtocolVersionError
// ------------------------------------------------------------------
const UnsupportedProtocolVersionError: Validator<UnsupportedProtocolVersionError> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/UnsupportedProtocolVersionError' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("error" in value && "jsonrpc" in value) && (((check_1(value.error) && ((typeof value.error === "object" && value.error !== null && !(Array.isArray(value.error))) && (("code" in value.error && "data" in value.error) && ((Number.isInteger(value.error.code) && value.error.code === -32022) && ((typeof value.error.data === "object" && value.error.data !== null && !(Array.isArray(value.error.data))) && (("requested" in value.error.data && "supported" in value.error.data) && (typeof value.error.data.requested === "string" && (Array.isArray(value.error.data.supported) && value.error.data.supported.every((unique_0, index) => (typeof unique_0 === "string")))))))))) && (value.id === undefined || (!("id" in value) || check_1(value.id)))) && (typeof value.jsonrpc === "string" && value.jsonrpc === "2.0")))))
  // @ts-ignore
  const check_1 = ((value) => false)
  const Schema = () => schema_0
  const Check = (value: unknown): value is UnsupportedProtocolVersionError => check_0(value)
  const Parse = (value: unknown): UnsupportedProtocolVersionError => Check(value) ? value : Exceptions.TypeError('UnsupportedProtocolVersionError', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// UntitledMultiSelectEnumSchema
// ------------------------------------------------------------------
const UntitledMultiSelectEnumSchema: Validator<UntitledMultiSelectEnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/UntitledMultiSelectEnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("items" in value && "type" in value) && (((((((value.default === undefined || (!("default" in value) || (Array.isArray(value.default) && value.default.every((unique_0, index) => (typeof unique_0 === "string"))))) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && ((typeof value.items === "object" && value.items !== null && !(Array.isArray(value.items))) && (("enum" in value.items && "type" in value.items) && ((Array.isArray(value.items.enum) && value.items.enum.every((unique_1, index) => (typeof unique_1 === "string"))) && (typeof value.items.type === "string" && value.items.type === "string"))))) && (value.maxItems === undefined || (!("maxItems" in value) || Number.isInteger(value.maxItems)))) && (value.minItems === undefined || (!("minItems" in value) || Number.isInteger(value.minItems)))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "array")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is UntitledMultiSelectEnumSchema => check_0(value)
  const Parse = (value: unknown): UntitledMultiSelectEnumSchema => Check(value) ? value : Exceptions.TypeError('UntitledMultiSelectEnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// UntitledSingleSelectEnumSchema
// ------------------------------------------------------------------
const UntitledSingleSelectEnumSchema: Validator<UntitledSingleSelectEnumSchema> = (() => {
  const schema_0 = Object.freeze({ ...GlobalSchema, $ref: '#/$defs/UntitledSingleSelectEnumSchema' })
  // @ts-ignore
  const check_0 = ((value) => ((typeof value === "object" && value !== null && !(Array.isArray(value))) && (("enum" in value && "type" in value) && (((((value.default === undefined || (!("default" in value) || typeof value.default === "string")) && (value.description === undefined || (!("description" in value) || typeof value.description === "string"))) && (Array.isArray(value.enum) && value.enum.every((unique_0, index) => (typeof unique_0 === "string")))) && (value.title === undefined || (!("title" in value) || typeof value.title === "string"))) && (typeof value.type === "string" && value.type === "string")))))
  const Schema = () => schema_0
  const Check = (value: unknown): value is UntitledSingleSelectEnumSchema => check_0(value)
  const Parse = (value: unknown): UntitledSingleSelectEnumSchema => Check(value) ? value : Exceptions.TypeError('UntitledSingleSelectEnumSchema', value)
  return { Check, Parse, Schema }
})()

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
declare namespace Namespace {
  export type Annotations = { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object
  export type AudioContent = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object
  export type BaseMetadata = { title?: string, name: string } & {} & object
  export type BlobResourceContents = { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object
  export type BooleanSchema = { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object
  export type CacheableResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, cacheScope: "private" | "public" & string, resultType: string, ttlMs: number } & {} & object
  export type CallToolRequest = { id: string | number, jsonrpc: "2.0" & string, method: "tools/call" & string, params: { arguments?: { [key: string]: unknown } & object, inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, name: string } & {} & object } & {} & object
  export type CallToolRequestParams = { arguments?: { [key: string]: unknown } & object, inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, name: string } & {} & object
  export type CallToolResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, resultType: string } & {} & object
  export type CallToolResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, inputRequests?: { [key: string]: { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object | { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object | { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object } & object, requestState?: string, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, resultType: string } & {} & object } & {} & object
  export type CancelledNotification = { jsonrpc: "2.0" & string, method: "notifications/cancelled" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, reason?: string, requestId: string | number } & {} & object } & {} & object
  export type CancelledNotificationParams = { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, reason?: string, requestId: string | number } & {} & object
  export type ClientCapabilities = { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object
  export type ClientNotification = { jsonrpc: "2.0" & string, method: "notifications/cancelled" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, reason?: string, requestId: string | number } & {} & object } & {} & object
  export type ClientRequest = { id: string | number, jsonrpc: "2.0" & string, method: "server/discover" & string, params: { _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "resources/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "resources/templates/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "resources/read" & string, params: { inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, uri: string } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "subscriptions/listen" & string, params: { _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, notifications: { promptsListChanged?: boolean, resourceSubscriptions?: string[] & {}, resourcesListChanged?: boolean, toolsListChanged?: boolean } & object } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "prompts/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "prompts/get" & string, params: { arguments?: { [key: string]: string } & object, inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, name: string } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "tools/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "tools/call" & string, params: { arguments?: { [key: string]: unknown } & object, inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, name: string } & {} & object } & {} & object | { id: string | number, jsonrpc: "2.0" & string, method: "completion/complete" & string, params: { context?: { arguments?: { [key: string]: string } & object } & object, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, argument: { name: string, value: string } & {} & object, ref: { title?: string, name: string, type: "ref/prompt" & string } & {} & object | { type: "ref/resource" & string, uri: string } & {} & object } & {} & object } & {} & object
  export type ClientResult = { [key: string]: unknown } & { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, resultType: string } & {} & object
  export type CompleteRequest = { id: string | number, jsonrpc: "2.0" & string, method: "completion/complete" & string, params: { context?: { arguments?: { [key: string]: string } & object } & object, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, argument: { name: string, value: string } & {} & object, ref: { title?: string, name: string, type: "ref/prompt" & string } & {} & object | { type: "ref/resource" & string, uri: string } & {} & object } & {} & object } & {} & object
  export type CompleteRequestParams = { context?: { arguments?: { [key: string]: string } & object } & object, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, argument: { name: string, value: string } & {} & object, ref: { title?: string, name: string, type: "ref/prompt" & string } & {} & object | { type: "ref/resource" & string, uri: string } & {} & object } & {} & object
  export type CompleteResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, completion: { hasMore?: boolean, total?: number, values: string[] & {} } & {} & object, resultType: string } & {} & object
  export type CompleteResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, completion: { hasMore?: boolean, total?: number, values: string[] & {} } & {} & object, resultType: string } & {} & object } & {} & object
  export type ContentBlock = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object
  export type CreateMessageRequest = { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object
  export type CreateMessageRequestParams = { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object
  export type CreateMessageResult = { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object
  export type Cursor = string
  export type DiscoverRequest = { id: string | number, jsonrpc: "2.0" & string, method: "server/discover" & string, params: { _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object
  export type DiscoverResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, instructions?: string, cacheScope: "private" | "public" & string, capabilities: { completions?: { [key: string]: any | any[] & {} | string | number | boolean } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, logging?: { [key: string]: any | any[] & {} | string | number | boolean } & object, prompts?: { listChanged?: boolean } & object, resources?: { listChanged?: boolean, subscribe?: boolean } & object, tools?: { listChanged?: boolean } & object } & object, resultType: string, supportedVersions: string[] & {}, ttlMs: number } & {} & object
  export type DiscoverResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, instructions?: string, cacheScope: "private" | "public" & string, capabilities: { completions?: { [key: string]: any | any[] & {} | string | number | boolean } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, logging?: { [key: string]: any | any[] & {} | string | number | boolean } & object, prompts?: { listChanged?: boolean } & object, resources?: { listChanged?: boolean, subscribe?: boolean } & object, tools?: { listChanged?: boolean } & object } & object, resultType: string, supportedVersions: string[] & {}, ttlMs: number } & {} & object } & {} & object
  export type ElicitRequest = { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object
  export type ElicitRequestFormParams = { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object
  export type ElicitRequestParams = { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object
  export type ElicitRequestURLParams = { message: string, mode: "url" & string, url: string } & {} & object
  export type ElicitResult = { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object
  export type EmbeddedResource = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object
  export type EmptyResult = { [key: string]: unknown } & { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, resultType: string } & {} & object
  export type EnumSchema = { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object
  export type Error = { data?: unknown, code: number, message: string } & {} & object
  export type GetPromptRequest = { id: string | number, jsonrpc: "2.0" & string, method: "prompts/get" & string, params: { arguments?: { [key: string]: string } & object, inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, name: string } & {} & object } & {} & object
  export type GetPromptRequestParams = { arguments?: { [key: string]: string } & object, inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, name: string } & {} & object
  export type GetPromptResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, description?: string, messages: { content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object, role: "assistant" | "user" & string } & {} & object[] & {}, resultType: string } & {} & object
  export type GetPromptResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, inputRequests?: { [key: string]: { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object | { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object | { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object } & object, requestState?: string, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, description?: string, messages: { content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object, role: "assistant" | "user" & string } & {} & object[] & {}, resultType: string } & {} & object } & {} & object
  export type HeaderMismatchError = { id?: string | number, error: { data?: unknown, code: number, message: string } & {} & object & { code: -32020 & number } & {} & object, jsonrpc: "2.0" & string } & {} & object
  export type Icon = { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object
  export type Icons = { icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {} } & object
  export type ImageContent = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object
  export type Implementation = { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object
  export type InputRequest = { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object | { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object | { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object
  export type InputRequests = { [key: string]: { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object | { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object | { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object } & object
  export type InputRequiredResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, inputRequests?: { [key: string]: { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object | { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object | { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object } & object, requestState?: string, resultType: string } & {} & object
  export type InputResponse = { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object
  export type InputResponseRequestParams = { inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object
  export type InputResponses = { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object
  export type InternalError = { data?: unknown, code: -32603 & number, message: string } & {} & object
  export type InvalidParamsError = { data?: unknown, code: -32602 & number, message: string } & {} & object
  export type InvalidRequestError = { data?: unknown, code: -32600 & number, message: string } & {} & object
  export type JSONArray = { [key: string]: any } & object | { [key: string]: any } & object | any[] & {} | string | number | boolean[] & {} | string | number | boolean[] & {}
  export type JSONObject = { [key: string]: { [key: string]: any } & object | any | any[] & {} | string | number | boolean[] & {} | string | number | boolean } & object
  export type JSONRPCErrorResponse = { id?: string | number, error: { data?: unknown, code: number, message: string } & {} & object, jsonrpc: "2.0" & string } & {} & object
  export type JSONRPCMessage = { params?: { [key: string]: unknown } & object, id: string | number, jsonrpc: "2.0" & string, method: string } & {} & object | { params?: { [key: string]: unknown } & object, jsonrpc: "2.0" & string, method: string } & {} & object | { id: string | number, jsonrpc: "2.0" & string, result: { [key: string]: unknown } & { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, resultType: string } & {} & object } & {} & object | { id?: string | number, error: { data?: unknown, code: number, message: string } & {} & object, jsonrpc: "2.0" & string } & {} & object
  export type JSONRPCNotification = { params?: { [key: string]: unknown } & object, jsonrpc: "2.0" & string, method: string } & {} & object
  export type JSONRPCRequest = { params?: { [key: string]: unknown } & object, id: string | number, jsonrpc: "2.0" & string, method: string } & {} & object
  export type JSONRPCResponse = { id: string | number, jsonrpc: "2.0" & string, result: { [key: string]: unknown } & { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, resultType: string } & {} & object } & {} & object | { id?: string | number, error: { data?: unknown, code: number, message: string } & {} & object, jsonrpc: "2.0" & string } & {} & object
  export type JSONRPCResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { [key: string]: unknown } & { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, resultType: string } & {} & object } & {} & object
  export type JSONValue = { [key: string]: any | any[] & {} | string | number | boolean } & object | { [key: string]: any } & object | { [key: string]: any } & object | any[] & {} | string | number | boolean[] & {} | string | number | boolean[] & {} | string | number | boolean
  export type LegacyTitledEnumSchema = { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object
  export type ListPromptsRequest = { id: string | number, jsonrpc: "2.0" & string, method: "prompts/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object
  export type ListPromptsResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, prompts: { _meta?: object, arguments?: { description?: string, required?: boolean, title?: string, name: string } & {} & object[] & {}, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, name: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object
  export type ListPromptsResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, prompts: { _meta?: object, arguments?: { description?: string, required?: boolean, title?: string, name: string } & {} & object[] & {}, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, name: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object } & {} & object
  export type ListResourceTemplatesRequest = { id: string | number, jsonrpc: "2.0" & string, method: "resources/templates/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object
  export type ListResourceTemplatesResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resourceTemplates: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, title?: string, name: string, uriTemplate: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object
  export type ListResourceTemplatesResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resourceTemplates: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, title?: string, name: string, uriTemplate: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object } & {} & object
  export type ListResourcesRequest = { id: string | number, jsonrpc: "2.0" & string, method: "resources/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object
  export type ListResourcesResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resources: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, uri: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object
  export type ListResourcesResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resources: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, uri: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object } & {} & object
  export type ListRootsRequest = { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object
  export type ListRootsResult = { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object
  export type ListToolsRequest = { id: string | number, jsonrpc: "2.0" & string, method: "tools/list" & string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object
  export type ListToolsResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resultType: string, tools: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, ttlMs: number } & {} & object
  export type ListToolsResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resultType: string, tools: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, ttlMs: number } & {} & object } & {} & object
  export type LoggingLevel = "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string
  export type LoggingMessageNotification = { jsonrpc: "2.0" & string, method: "notifications/message" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, logger?: string, data: unknown, level: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string } & {} & object } & {} & object
  export type LoggingMessageNotificationParams = { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, logger?: string, data: unknown, level: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string } & {} & object
  export type MetaObject = object
  export type MethodNotFoundError = { data?: unknown, code: -32601 & number, message: string } & {} & object
  export type MissingRequiredClientCapabilityError = { id?: string | number, error: { data?: unknown, code: number, message: string } & {} & object & { code: -32021 & number, data: { requiredCapabilities: { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object } & {} & object } & {} & object, jsonrpc: "2.0" & string } & {} & object
  export type ModelHint = { name?: string } & object
  export type ModelPreferences = { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object
  export type MultiSelectEnumSchema = { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object
  export type Notification = { params?: { [key: string]: unknown } & object, method: string } & {} & object
  export type NotificationMetaObject = { "io.modelcontextprotocol/subscriptionId"?: string | number } & object
  export type NotificationParams = { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object } & object
  export type NumberSchema = { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object
  export type PaginatedRequest = { id: string | number, jsonrpc: "2.0" & string, method: string, params: { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object } & {} & object
  export type PaginatedRequestParams = { cursor?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object
  export type PaginatedResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, resultType: string } & {} & object
  export type ParseError = { data?: unknown, code: -32700 & number, message: string } & {} & object
  export type PrimitiveSchemaDefinition = { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object
  export type ProgressNotification = { jsonrpc: "2.0" & string, method: "notifications/progress" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, message?: string, total?: number, progress: number, progressToken: string | number } & {} & object } & {} & object
  export type ProgressNotificationParams = { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, message?: string, total?: number, progress: number, progressToken: string | number } & {} & object
  export type ProgressToken = string | number
  export type Prompt = { _meta?: object, arguments?: { description?: string, required?: boolean, title?: string, name: string } & {} & object[] & {}, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, name: string } & {} & object
  export type PromptArgument = { description?: string, required?: boolean, title?: string, name: string } & {} & object
  export type PromptListChangedNotification = { params?: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object } & object, jsonrpc: "2.0" & string, method: "notifications/prompts/list_changed" & string } & {} & object
  export type PromptMessage = { content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object, role: "assistant" | "user" & string } & {} & object
  export type PromptReference = { title?: string, name: string, type: "ref/prompt" & string } & {} & object
  export type ReadResourceRequest = { id: string | number, jsonrpc: "2.0" & string, method: "resources/read" & string, params: { inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, uri: string } & {} & object } & {} & object
  export type ReadResourceRequestParams = { inputResponses?: { [key: string]: { _meta?: object, stopReason?: string, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, model: string, role: "assistant" | "user" & string } & {} & object | { roots: { _meta?: object, name?: string, uri: string } & {} & object[] & {} } & {} & object | { content?: { [key: string]: string[] & {} | string | number | boolean } & object, action: "accept" | "cancel" | "decline" & string } & {} & object } & object, requestState?: string, _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, uri: string } & {} & object
  export type ReadResourceResult = { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, cacheScope: "private" | "public" & string, contents: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object
  export type ReadResourceResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, inputRequests?: { [key: string]: { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object | { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object | { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object } & object, requestState?: string, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, cacheScope: "private" | "public" & string, contents: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object } & {} & object
  export type Request = { params?: { [key: string]: unknown } & object, method: string } & {} & object
  export type RequestId = string | number
  export type RequestMetaObject = { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object
  export type RequestParams = { _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object } & {} & object
  export type Resource = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, uri: string } & {} & object
  export type ResourceContents = { _meta?: object, mimeType?: string, uri: string } & {} & object
  export type ResourceLink = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object
  export type ResourceListChangedNotification = { params?: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object } & object, jsonrpc: "2.0" & string, method: "notifications/resources/list_changed" & string } & {} & object
  export type ResourceRequestParams = { _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, uri: string } & {} & object
  export type ResourceTemplate = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, title?: string, name: string, uriTemplate: string } & {} & object
  export type ResourceTemplateReference = { type: "ref/resource" & string, uri: string } & {} & object
  export type ResourceUpdatedNotification = { jsonrpc: "2.0" & string, method: "notifications/resources/updated" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, uri: string } & {} & object } & {} & object
  export type ResourceUpdatedNotificationParams = { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, uri: string } & {} & object
  export type Result = { [key: string]: unknown } & { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, resultType: string } & {} & object
  export type ResultMetaObject = { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object
  export type ResultType = string
  export type Role = "assistant" | "user" & string
  export type Root = { _meta?: object, name?: string, uri: string } & {} & object
  export type SamplingMessage = { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object
  export type SamplingMessageContentBlock = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object
  export type ServerCapabilities = { completions?: { [key: string]: any | any[] & {} | string | number | boolean } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, logging?: { [key: string]: any | any[] & {} | string | number | boolean } & object, prompts?: { listChanged?: boolean } & object, resources?: { listChanged?: boolean, subscribe?: boolean } & object, tools?: { listChanged?: boolean } & object } & object
  export type ServerNotification = { jsonrpc: "2.0" & string, method: "notifications/cancelled" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, reason?: string, requestId: string | number } & {} & object } & {} & object | { jsonrpc: "2.0" & string, method: "notifications/progress" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, message?: string, total?: number, progress: number, progressToken: string | number } & {} & object } & {} & object | { params?: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object } & object, jsonrpc: "2.0" & string, method: "notifications/resources/list_changed" & string } & {} & object | { jsonrpc: "2.0" & string, method: "notifications/subscriptions/acknowledged" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, notifications: { promptsListChanged?: boolean, resourceSubscriptions?: string[] & {}, resourcesListChanged?: boolean, toolsListChanged?: boolean } & object } & {} & object } & {} & object | { jsonrpc: "2.0" & string, method: "notifications/resources/updated" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, uri: string } & {} & object } & {} & object | { params?: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object } & object, jsonrpc: "2.0" & string, method: "notifications/prompts/list_changed" & string } & {} & object | { params?: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object } & object, jsonrpc: "2.0" & string, method: "notifications/tools/list_changed" & string } & {} & object | { jsonrpc: "2.0" & string, method: "notifications/message" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, logger?: string, data: unknown, level: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string } & {} & object } & {} & object
  export type ServerResult = { [key: string]: unknown } & { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, inputRequests?: { [key: string]: { method: "sampling/createMessage" & string, params: { includeContext?: "allServers" | "none" | "thisServer" & string, metadata?: { [key: string]: any | any[] & {} | string | number | boolean } & object, modelPreferences?: { costPriority?: number, hints?: { name?: string } & object[] & {}, intelligencePriority?: number, speedPriority?: number } & object, stopSequences?: string[] & {}, systemPrompt?: string, temperature?: number, toolChoice?: { mode?: "auto" | "none" | "required" & string } & object, tools?: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, maxTokens: number, messages: { _meta?: object, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object | { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object[] & {}, role: "assistant" | "user" & string } & {} & object[] & {} } & {} & object } & {} & object | { params?: { _meta?: object } & object, method: "roots/list" & string } & {} & object | { method: "elicitation/create" & string, params: { mode?: "form" & string, message: string, requestedSchema: { $schema?: string, required?: string[] & {}, properties: { [key: string]: { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object | { default?: number, description?: string, maximum?: number, minimum?: number, title?: string, type: "integer" | "number" & string } & {} & object | { default?: boolean, description?: string, title?: string, type: "boolean" & string } & {} & object | { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object | { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object | { default?: string, description?: string, enumNames?: string[] & {}, title?: string, enum: string[] & {}, type: "string" & string } & {} & object } & object, type: "object" & string } & {} & object } & {} & object | { message: string, mode: "url" & string, url: string } & {} & object } & {} & object } & object, requestState?: string, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, instructions?: string, cacheScope: "private" | "public" & string, capabilities: { completions?: { [key: string]: any | any[] & {} | string | number | boolean } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, logging?: { [key: string]: any | any[] & {} | string | number | boolean } & object, prompts?: { listChanged?: boolean } & object, resources?: { listChanged?: boolean, subscribe?: boolean } & object, tools?: { listChanged?: boolean } & object } & object, resultType: string, supportedVersions: string[] & {}, ttlMs: number } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resources: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, uri: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resourceTemplates: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, title?: string, name: string, uriTemplate: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, cacheScope: "private" | "public" & string, contents: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object | { _meta: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/subscriptionId": string | number } & {} & object, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, prompts: { _meta?: object, arguments?: { description?: string, required?: boolean, title?: string, name: string } & {} & object[] & {}, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, name: string } & {} & object[] & {}, resultType: string, ttlMs: number } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, description?: string, messages: { content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object, role: "assistant" | "user" & string } & {} & object[] & {}, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, nextCursor?: string, cacheScope: "private" | "public" & string, resultType: string, tools: { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object[] & {}, ttlMs: number } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, resultType: string } & {} & object | { _meta?: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object } & object, completion: { hasMore?: boolean, total?: number, values: string[] & {} } & {} & object, resultType: string } & {} & object
  export type SingleSelectEnumSchema = { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object | { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object
  export type StringSchema = { default?: string, description?: string, format?: "date" | "date-time" | "email" | "uri" & string, maxLength?: number, minLength?: number, title?: string, type: "string" & string } & {} & object
  export type SubscriptionFilter = { promptsListChanged?: boolean, resourceSubscriptions?: string[] & {}, resourcesListChanged?: boolean, toolsListChanged?: boolean } & object
  export type SubscriptionsAcknowledgedNotification = { jsonrpc: "2.0" & string, method: "notifications/subscriptions/acknowledged" & string, params: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, notifications: { promptsListChanged?: boolean, resourceSubscriptions?: string[] & {}, resourcesListChanged?: boolean, toolsListChanged?: boolean } & object } & {} & object } & {} & object
  export type SubscriptionsAcknowledgedNotificationParams = { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object, notifications: { promptsListChanged?: boolean, resourceSubscriptions?: string[] & {}, resourcesListChanged?: boolean, toolsListChanged?: boolean } & object } & {} & object
  export type SubscriptionsListenRequest = { id: string | number, jsonrpc: "2.0" & string, method: "subscriptions/listen" & string, params: { _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, notifications: { promptsListChanged?: boolean, resourceSubscriptions?: string[] & {}, resourcesListChanged?: boolean, toolsListChanged?: boolean } & object } & {} & object } & {} & object
  export type SubscriptionsListenRequestParams = { _meta: { "io.modelcontextprotocol/clientInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/logLevel"?: "alert" | "critical" | "debug" | "emergency" | "error" | "info" | "notice" | "warning" & string, progressToken?: string | number, "io.modelcontextprotocol/clientCapabilities": { elicitation?: { form?: { [key: string]: any | any[] & {} | string | number | boolean } & object, url?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, experimental?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, extensions?: { [key: string]: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object, roots?: {} & object, sampling?: { context?: { [key: string]: any | any[] & {} | string | number | boolean } & object, tools?: { [key: string]: any | any[] & {} | string | number | boolean } & object } & object } & object, "io.modelcontextprotocol/protocolVersion": string } & {} & object, notifications: { promptsListChanged?: boolean, resourceSubscriptions?: string[] & {}, resourcesListChanged?: boolean, toolsListChanged?: boolean } & object } & {} & object
  export type SubscriptionsListenResult = { _meta: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/subscriptionId": string | number } & {} & object, resultType: string } & {} & object
  export type SubscriptionsListenResultMetaObject = { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/subscriptionId": string | number } & {} & object
  export type SubscriptionsListenResultResponse = { id: string | number, jsonrpc: "2.0" & string, result: { _meta: { "io.modelcontextprotocol/serverInfo"?: { description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, title?: string, websiteUrl?: string, name: string, version: string } & {} & object, "io.modelcontextprotocol/subscriptionId": string | number } & {} & object, resultType: string } & {} & object } & {} & object
  export type TextContent = { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object
  export type TextResourceContents = { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object
  export type TitledMultiSelectEnumSchema = { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { anyOf: { const: string, title: string } & {} & object[] & {} } & {} & object, type: "array" & string } & {} & object
  export type TitledSingleSelectEnumSchema = { default?: string, description?: string, title?: string, oneOf: { const: string, title: string } & {} & object[] & {}, type: "string" & string } & {} & object
  export type Tool = { _meta?: object, annotations?: { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, outputSchema?: { [key: string]: unknown } & { $schema?: string } & object, title?: string, inputSchema: { [key: string]: unknown } & { $schema?: string, type: "object" & string } & {} & object, name: string } & {} & object
  export type ToolAnnotations = { destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean, readOnlyHint?: boolean, title?: string } & object
  export type ToolChoice = { mode?: "auto" | "none" | "required" & string } & object
  export type ToolListChangedNotification = { params?: { _meta?: { "io.modelcontextprotocol/subscriptionId"?: string | number } & object } & object, jsonrpc: "2.0" & string, method: "notifications/tools/list_changed" & string } & {} & object
  export type ToolResultContent = { _meta?: object, isError?: boolean, structuredContent?: unknown, content: { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, text: string, type: "text" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "image" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, data: string, mimeType: string, type: "audio" & string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, description?: string, icons?: { mimeType?: string, sizes?: string[] & {}, theme?: "dark" | "light" & string, src: string } & {} & object[] & {}, mimeType?: string, size?: number, title?: string, name: string, type: "resource_link" & string, uri: string } & {} & object | { _meta?: object, annotations?: { audience?: "assistant" | "user" & string[] & {}, lastModified?: string, priority?: number } & object, resource: { _meta?: object, mimeType?: string, text: string, uri: string } & {} & object | { _meta?: object, mimeType?: string, blob: string, uri: string } & {} & object, type: "resource" & string } & {} & object[] & {}, toolUseId: string, type: "tool_result" & string } & {} & object
  export type ToolUseContent = { _meta?: object, id: string, input: { [key: string]: unknown } & object, name: string, type: "tool_use" & string } & {} & object
  export type UnsupportedProtocolVersionError = { id?: string | number, error: { data?: unknown, code: number, message: string } & {} & object & { code: -32022 & number, data: { requested: string, supported: string[] & {} } & {} & object } & {} & object, jsonrpc: "2.0" & string } & {} & object
  export type UntitledMultiSelectEnumSchema = { default?: string[] & {}, description?: string, maxItems?: number, minItems?: number, title?: string, items: { enum: string[] & {}, type: "string" & string } & {} & object, type: "array" & string } & {} & object
  export type UntitledSingleSelectEnumSchema = { default?: string, description?: string, title?: string, enum: string[] & {}, type: "string" & string } & {} & object
}
type Annotations = Namespace.Annotations
type AudioContent = Namespace.AudioContent
type BaseMetadata = Namespace.BaseMetadata
type BlobResourceContents = Namespace.BlobResourceContents
type BooleanSchema = Namespace.BooleanSchema
type CacheableResult = Namespace.CacheableResult
type CallToolRequest = Namespace.CallToolRequest
type CallToolRequestParams = Namespace.CallToolRequestParams
type CallToolResult = Namespace.CallToolResult
type CallToolResultResponse = Namespace.CallToolResultResponse
type CancelledNotification = Namespace.CancelledNotification
type CancelledNotificationParams = Namespace.CancelledNotificationParams
type ClientCapabilities = Namespace.ClientCapabilities
type ClientNotification = Namespace.ClientNotification
type ClientRequest = Namespace.ClientRequest
type ClientResult = Namespace.ClientResult
type CompleteRequest = Namespace.CompleteRequest
type CompleteRequestParams = Namespace.CompleteRequestParams
type CompleteResult = Namespace.CompleteResult
type CompleteResultResponse = Namespace.CompleteResultResponse
type ContentBlock = Namespace.ContentBlock
type CreateMessageRequest = Namespace.CreateMessageRequest
type CreateMessageRequestParams = Namespace.CreateMessageRequestParams
type CreateMessageResult = Namespace.CreateMessageResult
type Cursor = Namespace.Cursor
type DiscoverRequest = Namespace.DiscoverRequest
type DiscoverResult = Namespace.DiscoverResult
type DiscoverResultResponse = Namespace.DiscoverResultResponse
type ElicitRequest = Namespace.ElicitRequest
type ElicitRequestFormParams = Namespace.ElicitRequestFormParams
type ElicitRequestParams = Namespace.ElicitRequestParams
type ElicitRequestURLParams = Namespace.ElicitRequestURLParams
type ElicitResult = Namespace.ElicitResult
type EmbeddedResource = Namespace.EmbeddedResource
type EmptyResult = Namespace.EmptyResult
type EnumSchema = Namespace.EnumSchema
type Error = Namespace.Error
type GetPromptRequest = Namespace.GetPromptRequest
type GetPromptRequestParams = Namespace.GetPromptRequestParams
type GetPromptResult = Namespace.GetPromptResult
type GetPromptResultResponse = Namespace.GetPromptResultResponse
type HeaderMismatchError = Namespace.HeaderMismatchError
type Icon = Namespace.Icon
type Icons = Namespace.Icons
type ImageContent = Namespace.ImageContent
type Implementation = Namespace.Implementation
type InputRequest = Namespace.InputRequest
type InputRequests = Namespace.InputRequests
type InputRequiredResult = Namespace.InputRequiredResult
type InputResponse = Namespace.InputResponse
type InputResponseRequestParams = Namespace.InputResponseRequestParams
type InputResponses = Namespace.InputResponses
type InternalError = Namespace.InternalError
type InvalidParamsError = Namespace.InvalidParamsError
type InvalidRequestError = Namespace.InvalidRequestError
type JSONArray = Namespace.JSONArray
type JSONObject = Namespace.JSONObject
type JSONRPCErrorResponse = Namespace.JSONRPCErrorResponse
type JSONRPCMessage = Namespace.JSONRPCMessage
type JSONRPCNotification = Namespace.JSONRPCNotification
type JSONRPCRequest = Namespace.JSONRPCRequest
type JSONRPCResponse = Namespace.JSONRPCResponse
type JSONRPCResultResponse = Namespace.JSONRPCResultResponse
type JSONValue = Namespace.JSONValue
type LegacyTitledEnumSchema = Namespace.LegacyTitledEnumSchema
type ListPromptsRequest = Namespace.ListPromptsRequest
type ListPromptsResult = Namespace.ListPromptsResult
type ListPromptsResultResponse = Namespace.ListPromptsResultResponse
type ListResourceTemplatesRequest = Namespace.ListResourceTemplatesRequest
type ListResourceTemplatesResult = Namespace.ListResourceTemplatesResult
type ListResourceTemplatesResultResponse = Namespace.ListResourceTemplatesResultResponse
type ListResourcesRequest = Namespace.ListResourcesRequest
type ListResourcesResult = Namespace.ListResourcesResult
type ListResourcesResultResponse = Namespace.ListResourcesResultResponse
type ListRootsRequest = Namespace.ListRootsRequest
type ListRootsResult = Namespace.ListRootsResult
type ListToolsRequest = Namespace.ListToolsRequest
type ListToolsResult = Namespace.ListToolsResult
type ListToolsResultResponse = Namespace.ListToolsResultResponse
type LoggingLevel = Namespace.LoggingLevel
type LoggingMessageNotification = Namespace.LoggingMessageNotification
type LoggingMessageNotificationParams = Namespace.LoggingMessageNotificationParams
type MetaObject = Namespace.MetaObject
type MethodNotFoundError = Namespace.MethodNotFoundError
type MissingRequiredClientCapabilityError = Namespace.MissingRequiredClientCapabilityError
type ModelHint = Namespace.ModelHint
type ModelPreferences = Namespace.ModelPreferences
type MultiSelectEnumSchema = Namespace.MultiSelectEnumSchema
type Notification = Namespace.Notification
type NotificationMetaObject = Namespace.NotificationMetaObject
type NotificationParams = Namespace.NotificationParams
type NumberSchema = Namespace.NumberSchema
type PaginatedRequest = Namespace.PaginatedRequest
type PaginatedRequestParams = Namespace.PaginatedRequestParams
type PaginatedResult = Namespace.PaginatedResult
type ParseError = Namespace.ParseError
type PrimitiveSchemaDefinition = Namespace.PrimitiveSchemaDefinition
type ProgressNotification = Namespace.ProgressNotification
type ProgressNotificationParams = Namespace.ProgressNotificationParams
type ProgressToken = Namespace.ProgressToken
type Prompt = Namespace.Prompt
type PromptArgument = Namespace.PromptArgument
type PromptListChangedNotification = Namespace.PromptListChangedNotification
type PromptMessage = Namespace.PromptMessage
type PromptReference = Namespace.PromptReference
type ReadResourceRequest = Namespace.ReadResourceRequest
type ReadResourceRequestParams = Namespace.ReadResourceRequestParams
type ReadResourceResult = Namespace.ReadResourceResult
type ReadResourceResultResponse = Namespace.ReadResourceResultResponse
type Request = Namespace.Request
type RequestId = Namespace.RequestId
type RequestMetaObject = Namespace.RequestMetaObject
type RequestParams = Namespace.RequestParams
type Resource = Namespace.Resource
type ResourceContents = Namespace.ResourceContents
type ResourceLink = Namespace.ResourceLink
type ResourceListChangedNotification = Namespace.ResourceListChangedNotification
type ResourceRequestParams = Namespace.ResourceRequestParams
type ResourceTemplate = Namespace.ResourceTemplate
type ResourceTemplateReference = Namespace.ResourceTemplateReference
type ResourceUpdatedNotification = Namespace.ResourceUpdatedNotification
type ResourceUpdatedNotificationParams = Namespace.ResourceUpdatedNotificationParams
type Result = Namespace.Result
type ResultMetaObject = Namespace.ResultMetaObject
type ResultType = Namespace.ResultType
type Role = Namespace.Role
type Root = Namespace.Root
type SamplingMessage = Namespace.SamplingMessage
type SamplingMessageContentBlock = Namespace.SamplingMessageContentBlock
type ServerCapabilities = Namespace.ServerCapabilities
type ServerNotification = Namespace.ServerNotification
type ServerResult = Namespace.ServerResult
type SingleSelectEnumSchema = Namespace.SingleSelectEnumSchema
type StringSchema = Namespace.StringSchema
type SubscriptionFilter = Namespace.SubscriptionFilter
type SubscriptionsAcknowledgedNotification = Namespace.SubscriptionsAcknowledgedNotification
type SubscriptionsAcknowledgedNotificationParams = Namespace.SubscriptionsAcknowledgedNotificationParams
type SubscriptionsListenRequest = Namespace.SubscriptionsListenRequest
type SubscriptionsListenRequestParams = Namespace.SubscriptionsListenRequestParams
type SubscriptionsListenResult = Namespace.SubscriptionsListenResult
type SubscriptionsListenResultMetaObject = Namespace.SubscriptionsListenResultMetaObject
type SubscriptionsListenResultResponse = Namespace.SubscriptionsListenResultResponse
type TextContent = Namespace.TextContent
type TextResourceContents = Namespace.TextResourceContents
type TitledMultiSelectEnumSchema = Namespace.TitledMultiSelectEnumSchema
type TitledSingleSelectEnumSchema = Namespace.TitledSingleSelectEnumSchema
type Tool = Namespace.Tool
type ToolAnnotations = Namespace.ToolAnnotations
type ToolChoice = Namespace.ToolChoice
type ToolListChangedNotification = Namespace.ToolListChangedNotification
type ToolResultContent = Namespace.ToolResultContent
type ToolUseContent = Namespace.ToolUseContent
type UnsupportedProtocolVersionError = Namespace.UnsupportedProtocolVersionError
type UntitledMultiSelectEnumSchema = Namespace.UntitledMultiSelectEnumSchema
type UntitledSingleSelectEnumSchema = Namespace.UntitledSingleSelectEnumSchema
export { Annotations }
export { AudioContent }
export { BaseMetadata }
export { BlobResourceContents }
export { BooleanSchema }
export { CacheableResult }
export { CallToolRequest }
export { CallToolRequestParams }
export { CallToolResult }
export { CallToolResultResponse }
export { CancelledNotification }
export { CancelledNotificationParams }
export { ClientCapabilities }
export { ClientNotification }
export { ClientRequest }
export { ClientResult }
export { CompleteRequest }
export { CompleteRequestParams }
export { CompleteResult }
export { CompleteResultResponse }
export { ContentBlock }
export { CreateMessageRequest }
export { CreateMessageRequestParams }
export { CreateMessageResult }
export { Cursor }
export { DiscoverRequest }
export { DiscoverResult }
export { DiscoverResultResponse }
export { ElicitRequest }
export { ElicitRequestFormParams }
export { ElicitRequestParams }
export { ElicitRequestURLParams }
export { ElicitResult }
export { EmbeddedResource }
export { EmptyResult }
export { EnumSchema }
export { Error }
export { GetPromptRequest }
export { GetPromptRequestParams }
export { GetPromptResult }
export { GetPromptResultResponse }
export { HeaderMismatchError }
export { Icon }
export { Icons }
export { ImageContent }
export { Implementation }
export { InputRequest }
export { InputRequests }
export { InputRequiredResult }
export { InputResponse }
export { InputResponseRequestParams }
export { InputResponses }
export { InternalError }
export { InvalidParamsError }
export { InvalidRequestError }
export { JSONArray }
export { JSONObject }
export { JSONRPCErrorResponse }
export { JSONRPCMessage }
export { JSONRPCNotification }
export { JSONRPCRequest }
export { JSONRPCResponse }
export { JSONRPCResultResponse }
export { JSONValue }
export { LegacyTitledEnumSchema }
export { ListPromptsRequest }
export { ListPromptsResult }
export { ListPromptsResultResponse }
export { ListResourceTemplatesRequest }
export { ListResourceTemplatesResult }
export { ListResourceTemplatesResultResponse }
export { ListResourcesRequest }
export { ListResourcesResult }
export { ListResourcesResultResponse }
export { ListRootsRequest }
export { ListRootsResult }
export { ListToolsRequest }
export { ListToolsResult }
export { ListToolsResultResponse }
export { LoggingLevel }
export { LoggingMessageNotification }
export { LoggingMessageNotificationParams }
export { MetaObject }
export { MethodNotFoundError }
export { MissingRequiredClientCapabilityError }
export { ModelHint }
export { ModelPreferences }
export { MultiSelectEnumSchema }
export { Notification }
export { NotificationMetaObject }
export { NotificationParams }
export { NumberSchema }
export { PaginatedRequest }
export { PaginatedRequestParams }
export { PaginatedResult }
export { ParseError }
export { PrimitiveSchemaDefinition }
export { ProgressNotification }
export { ProgressNotificationParams }
export { ProgressToken }
export { Prompt }
export { PromptArgument }
export { PromptListChangedNotification }
export { PromptMessage }
export { PromptReference }
export { ReadResourceRequest }
export { ReadResourceRequestParams }
export { ReadResourceResult }
export { ReadResourceResultResponse }
export { Request }
export { RequestId }
export { RequestMetaObject }
export { RequestParams }
export { Resource }
export { ResourceContents }
export { ResourceLink }
export { ResourceListChangedNotification }
export { ResourceRequestParams }
export { ResourceTemplate }
export { ResourceTemplateReference }
export { ResourceUpdatedNotification }
export { ResourceUpdatedNotificationParams }
export { Result }
export { ResultMetaObject }
export { ResultType }
export { Role }
export { Root }
export { SamplingMessage }
export { SamplingMessageContentBlock }
export { ServerCapabilities }
export { ServerNotification }
export { ServerResult }
export { SingleSelectEnumSchema }
export { StringSchema }
export { SubscriptionFilter }
export { SubscriptionsAcknowledgedNotification }
export { SubscriptionsAcknowledgedNotificationParams }
export { SubscriptionsListenRequest }
export { SubscriptionsListenRequestParams }
export { SubscriptionsListenResult }
export { SubscriptionsListenResultMetaObject }
export { SubscriptionsListenResultResponse }
export { TextContent }
export { TextResourceContents }
export { TitledMultiSelectEnumSchema }
export { TitledSingleSelectEnumSchema }
export { Tool }
export { ToolAnnotations }
export { ToolChoice }
export { ToolListChangedNotification }
export { ToolResultContent }
export { ToolUseContent }
export { UnsupportedProtocolVersionError }
export { UntitledMultiSelectEnumSchema }
export { UntitledSingleSelectEnumSchema }
const Namespace = { Annotations, AudioContent, BaseMetadata, BlobResourceContents, BooleanSchema, CacheableResult, CallToolRequest, CallToolRequestParams, CallToolResult, CallToolResultResponse, CancelledNotification, CancelledNotificationParams, ClientCapabilities, ClientNotification, ClientRequest, ClientResult, CompleteRequest, CompleteRequestParams, CompleteResult, CompleteResultResponse, ContentBlock, CreateMessageRequest, CreateMessageRequestParams, CreateMessageResult, Cursor, DiscoverRequest, DiscoverResult, DiscoverResultResponse, ElicitRequest, ElicitRequestFormParams, ElicitRequestParams, ElicitRequestURLParams, ElicitResult, EmbeddedResource, EmptyResult, EnumSchema, Error, GetPromptRequest, GetPromptRequestParams, GetPromptResult, GetPromptResultResponse, HeaderMismatchError, Icon, Icons, ImageContent, Implementation, InputRequest, InputRequests, InputRequiredResult, InputResponse, InputResponseRequestParams, InputResponses, InternalError, InvalidParamsError, InvalidRequestError, JSONArray, JSONObject, JSONRPCErrorResponse, JSONRPCMessage, JSONRPCNotification, JSONRPCRequest, JSONRPCResponse, JSONRPCResultResponse, JSONValue, LegacyTitledEnumSchema, ListPromptsRequest, ListPromptsResult, ListPromptsResultResponse, ListResourceTemplatesRequest, ListResourceTemplatesResult, ListResourceTemplatesResultResponse, ListResourcesRequest, ListResourcesResult, ListResourcesResultResponse, ListRootsRequest, ListRootsResult, ListToolsRequest, ListToolsResult, ListToolsResultResponse, LoggingLevel, LoggingMessageNotification, LoggingMessageNotificationParams, MetaObject, MethodNotFoundError, MissingRequiredClientCapabilityError, ModelHint, ModelPreferences, MultiSelectEnumSchema, Notification, NotificationMetaObject, NotificationParams, NumberSchema, PaginatedRequest, PaginatedRequestParams, PaginatedResult, ParseError, PrimitiveSchemaDefinition, ProgressNotification, ProgressNotificationParams, ProgressToken, Prompt, PromptArgument, PromptListChangedNotification, PromptMessage, PromptReference, ReadResourceRequest, ReadResourceRequestParams, ReadResourceResult, ReadResourceResultResponse, Request, RequestId, RequestMetaObject, RequestParams, Resource, ResourceContents, ResourceLink, ResourceListChangedNotification, ResourceRequestParams, ResourceTemplate, ResourceTemplateReference, ResourceUpdatedNotification, ResourceUpdatedNotificationParams, Result, ResultMetaObject, ResultType, Role, Root, SamplingMessage, SamplingMessageContentBlock, ServerCapabilities, ServerNotification, ServerResult, SingleSelectEnumSchema, StringSchema, SubscriptionFilter, SubscriptionsAcknowledgedNotification, SubscriptionsAcknowledgedNotificationParams, SubscriptionsListenRequest, SubscriptionsListenRequestParams, SubscriptionsListenResult, SubscriptionsListenResultMetaObject, SubscriptionsListenResultResponse, TextContent, TextResourceContents, TitledMultiSelectEnumSchema, TitledSingleSelectEnumSchema, Tool, ToolAnnotations, ToolChoice, ToolListChangedNotification, ToolResultContent, ToolUseContent, UnsupportedProtocolVersionError, UntitledMultiSelectEnumSchema, UntitledSingleSelectEnumSchema }
export default Namespace