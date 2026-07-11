import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Consumer — Tiêu dùng thông minh",
  description: "Hành trình học tập tương tác môn GDCD 9: nhận diện quảng cáo, xử lí tình huống và lập kế hoạch chi tiêu.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
