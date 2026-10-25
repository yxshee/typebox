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

import * as Schema from '../../schema/index.ts'
// import * as Format from '../../format/index.ts'

export interface BuildInfo {
  // Sections
  UseCheckContext: boolean
  UseHashingModule: boolean
  UseIdnaModule: boolean
  UseFormatModule: boolean
  UseGlobalGuardModule: boolean
  // Formats
  UseDateTime: boolean
  UseDate: boolean
  UseDuration: boolean
  UseEmail: boolean
  UseHostname: boolean
  UseIdnEmail: boolean
  UseIdnHostname: boolean
  UseIpv4: boolean
  UseIpv6: boolean
  UseIriRefernece: boolean
  UseIri: boolean
  UseJsonPointerFragment: boolean
  UseJsonPointer: boolean
  UseRegEx: boolean
  UseRelativeJsonPointer: boolean
  UseTime: boolean
  UseUriReference: boolean
  UseUriTemplate: boolean
  UseUri: boolean
  UseUrl: boolean
  UseUuid: boolean
}

function Inspect(_build: Schema.BuildResult, info: BuildInfo): BuildInfo {
  return info
}
// ------------------------------------------------------------------
// BuildInfo
// ------------------------------------------------------------------
export function BuildInfo(initial: boolean): BuildInfo {
  return {
    // Hashing
    UseCheckContext: initial,
    UseFormatModule: initial,
    UseHashingModule: initial,
    UseIdnaModule: initial,
    UseGlobalGuardModule: initial,
    // Formats
    UseDateTime: initial,
    UseDate: initial,
    UseDuration: initial,
    UseEmail: initial,
    UseHostname: initial,
    UseIdnEmail: initial,
    UseIdnHostname: initial,
    UseIpv4: initial,
    UseIpv6: initial,
    UseIriRefernece: initial,
    UseIri: initial,
    UseJsonPointerFragment: initial,
    UseJsonPointer: initial,
    UseRegEx: initial,
    UseRelativeJsonPointer: initial,
    UseTime: initial,
    UseUriReference: initial,
    UseUriTemplate: initial,
    UseUri: initial,
    UseUrl: initial,
    UseUuid: initial
  }
}
// ------------------------------------------------------------------
// DeriveBuildInfo
// ------------------------------------------------------------------
export function DeriveBuildInfo(builds: Schema.BuildResult[]): BuildInfo {
  return builds.reduce<BuildInfo>((info, build) => Inspect(build, info), BuildInfo(false))
}
