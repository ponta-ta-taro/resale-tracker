/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Handle canvas module for pdfjs-dist
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                canvas: false,
                fs: false,
                path: false,
            };
        }
        
        // Ignore canvas for server-side as well
        config.resolve.alias = {
            ...config.resolve.alias,
            canvas: false,
        };
        
        return config;
    },
}

module.exports = nextConfig
