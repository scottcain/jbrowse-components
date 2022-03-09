import { Call } from '@material-ui/icons'

export interface Call {
  name: string
  args: unknown[]
}

export enum CallDataType {
  STRING,
  FLOAT,
  BOOL,
  FOLLOWING_ARGUMENTS_OPTIONAL,
}

export const setterDataTypes = {
  strokeStyle: CallDataType.STRING,
  font: CallDataType.STRING,
  fillStyle: CallDataType.STRING,
}

export const methodSignatures = {
  arc: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FOLLOWING_ARGUMENTS_OPTIONAL,
    CallDataType.BOOL,
  ],
  arcTo: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  beginPath: [],
  clearRect: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  closePath: [],
  ellipse: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FOLLOWING_ARGUMENTS_OPTIONAL,
    CallDataType.BOOL,
  ],
  fill: [CallDataType.FOLLOWING_ARGUMENTS_OPTIONAL, CallDataType.STRING],
  fillRect: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  fillText: [
    CallDataType.STRING,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FOLLOWING_ARGUMENTS_OPTIONAL,
    CallDataType.FLOAT,
  ],
  lineTo: [CallDataType.FLOAT, CallDataType.FLOAT],
  moveTo: [CallDataType.FLOAT, CallDataType.FLOAT],
  quadraticCurveTo: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  rect: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  restore: [],
  rotate: [CallDataType.FLOAT],
  save: [],
  setTransform: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  scale: [CallDataType.FLOAT, CallDataType.FLOAT],
  strokeRect: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  strokeText: [
    CallDataType.STRING,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FOLLOWING_ARGUMENTS_OPTIONAL,
    CallDataType.FLOAT,
  ],
  transform: [
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
    CallDataType.FLOAT,
  ],
  translate: [CallDataType.FLOAT, CallDataType.FLOAT],
}

export type SetterName = keyof typeof setterDataTypes
export type MethodName = keyof typeof methodSignatures

export interface SetterCall extends Call {
  name: SetterName
}

export interface MethodCall extends Call {
  name: MethodName
}

export function isMethodCall(call: Call): call is MethodCall {
  return Boolean(call.name in methodSignatures)
}
export function isSetterCall(call: Call): call is SetterCall {
  return Boolean(call.name in setterDataTypes)
}
