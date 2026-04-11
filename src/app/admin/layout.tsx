import { Navbar } from "@/components/navbar";

export const metadata = {
  title: "Admin Panel - Cloud Canvas",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}
