/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Matamos los errores de Solana y Mobile de un tiro
        "@solana/wallet-adapter-react": false,
        "@solana/web3.js": false,
        "@farcaster/mini-app-solana": false,
        "@react-native-async-storage/async-storage": false,
        "fs": false,
        "net": false,
        "tls": false,
      };
    }
    return config;
  },
};

export default nextConfig;