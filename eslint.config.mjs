import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";

const config = [...next, ...ts, { ignores: [".next/**", "out/**", "node_modules/**", "public/sw.js", "next-env.d.ts"] }];
export default config;
