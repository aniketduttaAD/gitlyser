import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const baseUrl = "https://gitlyser.aniketdutta.space";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GitLyser - GitHub Profile Analyzer",
    template: "%s | GitLyser",
  },
  description:
    "Analyze GitHub profiles with comprehensive insights: repository summaries, tech stack detection, PR analytics, code quality metrics, and contribution visualizations. Free GitHub profile analyzer tool.",
  keywords: [
    "GitHub analyzer",
    "GitHub profile analyzer",
    "GitHub stats",
    "repository analyzer",
    "code quality metrics",
    "PR analytics",
    "GitHub insights",
    "developer analytics",
    "GitHub profile viewer",
    "tech stack analyzer",
    "contribution analyzer",
    "GitHub metrics",
  ],
  authors: [{ name: "Aniket Dutta", url: "https://github.com/aniketduttaAD" }],
  creator: "Aniket Dutta",
  publisher: "GitLyser",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "GitLyser",
    title: "GitLyser - GitHub Profile Analyzer",
    description:
      "Analyze GitHub profiles with comprehensive insights: repository summaries, tech stack detection, PR analytics, code quality metrics, and contribution visualizations.",
    images: [
      {
        url: "/icon.png",
        width: 1200,
        height: 630,
        alt: "GitLyser - GitHub Profile Analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitLyser - GitHub Profile Analyzer",
    description:
      "Analyze GitHub profiles with comprehensive insights: repository summaries, tech stack detection, PR analytics, and more.",
    images: ["/icon.png"],
    creator: "@aniketduttaAD",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {},
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = "https://gitlyser.aniketdutta.space";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GitLyser",
    description:
      "GitHub Profile Analyzer - Comprehensive analysis tool for GitHub users and organizations",
    url: baseUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Person",
      name: "Aniket Dutta",
      url: "https://github.com/aniketduttaAD",
    },
    featureList: [
      "GitHub Profile Analysis",
      "Repository Summaries",
      "Tech Stack Detection",
      "PR Analytics",
      "Code Quality Metrics",
      "Contribution Visualizations",
      "Profile Comparison",
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.github.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
