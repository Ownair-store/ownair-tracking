import "./globals.css";

export const metadata = {
  title: "Track your Ownair order",
  description: "Live shipment tracking for your Ownair order.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
