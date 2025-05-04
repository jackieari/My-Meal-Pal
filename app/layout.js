import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

/* ---------- Google fonts ---------- */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ---------- Site‑wide metadata ---------- */
export const metadata = {
  title: {
    default: "MyMealPal",
    template: "%s | MyMealPal",
  },
  description:
    "Snap a photo of your fridge and let MyMealPal build personalized meal plans.",
  icons: {
    icon: "/mymealpal.png", // file is in /public
  },
};

/* ---------- Root layout ---------- */
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`} // expose CSS vars
    >
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
