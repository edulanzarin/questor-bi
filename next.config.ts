import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota só o necessário em .next/standalone — imagem Docker menor e sem
  // precisar de node_modules no runtime.
  output: "standalone",
};

export default nextConfig;
