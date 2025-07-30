import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AkselAI: Akselerator Inovasi Anda',
  description: 'AkselAI adalah platform untuk membangun, melatih, dan menerapkan Partner AI khusus dalam hitungan menit. Ubah keahlian Anda menjadi pekerja digital yang andal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
