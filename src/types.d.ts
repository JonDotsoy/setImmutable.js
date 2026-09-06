declare module 'lodash.setwith' {
  function setWith (obj: any, path: any, value: any, customizer?: (objValue: any, srcValue: any) => any): any
  export = setWith
}

declare module 'decompose.js' {
  export function decompose (objArg: any): Array<[any[], any]>
}
