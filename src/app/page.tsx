import { Navbar } from "@/components/navbar";
import { ServicesDashboard } from "@/components/services-dashboard";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <ServicesDashboard />
    </div>
  );
}
