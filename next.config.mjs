/** @type {import('next').NextConfig} */
const nextConfig = {
    // Konfigurasi Next.js Anda bisa ditambahkan di sini
    // Misalnya, untuk gambar dari domain eksternal:
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
};

export default nextConfig;
