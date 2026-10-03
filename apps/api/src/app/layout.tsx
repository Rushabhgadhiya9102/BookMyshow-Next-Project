export const metadata = {
  title: "BookMyShow API Service",
  description: "Dedicated backend API service for BookMyShow monorepo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
