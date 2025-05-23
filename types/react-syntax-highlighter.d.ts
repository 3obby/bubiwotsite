declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';
  
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    PreTag?: string | ComponentType<any>;
    children: string;
    [key: string]: any;
  }
  
  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
  export default ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/cjs/styles/prism' {
  export const ghcolors: any;
  export const github: any;
  export const tomorrow: any;
  export const twilight: any;
  export const prism: any;
  export const atomDark: any;
  export const base16AteliersulphurpoolLight: any;
  export const cb: any;
  export const coldarkCold: any;
  export const coldarkDark: any;
  export const coy: any;
  export const darcula: any;
  export const dark: any;
  export const duotoneDark: any;
  export const duotoneEarth: any;
  export const duotoneForest: any;
  export const duotoneLight: any;
  export const duotoneSea: any;
  export const duotoneSpace: any;
  export const funky: any;
  export const hopscotch: any;
  export const lucario: any;
  export const materialDark: any;
  export const materialLight: any;
  export const materialOceanic: any;
  export const nord: any;
  export const okaidia: any;
  export const oneDark: any;
  export const oneLight: any;
  export const pojoaque: any;
  export const shadesOfPurple: any;
  export const solarizedlight: any;
  export const synthwave84: any;
  export const vs: any;
  export const vscDarkPlus: any;
  export const xonokai: any;
} 