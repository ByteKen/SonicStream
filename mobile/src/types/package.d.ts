// Allow importing version from package.json
declare module '*/package.json' {
  export const version: string;
  export const name: string;
}
