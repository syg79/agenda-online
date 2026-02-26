/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['react-leaflet', 'leaflet'],
    experimental: {
        serverComponentsExternalPackages: ['playwright-core'],
    },
};

export default nextConfig;
