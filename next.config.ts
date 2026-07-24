import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota só o necessário em .next/standalone — imagem Docker menor e sem
  // precisar de node_modules no runtime.
  output: "standalone",
  experimental: {
    // Upload de foto de perfil via Server Action passa do 1MB padrão.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
