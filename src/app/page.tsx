import { Navbar } from "@/components/navbar";
import { ServicesDashboard } from "@/components/services-dashboard";
import { getCachedServicesGroupedByCategory } from "@/lib/cached-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { servicesByCategory, stats } =
    await getCachedServicesGroupedByCategory();

  return (
    <div className="min-h-screen">
      <Navbar />
      <ServicesDashboard
        servicesByCategory={servicesByCategory}
        serviceStats={stats}
      />
    </div>
  );
}
