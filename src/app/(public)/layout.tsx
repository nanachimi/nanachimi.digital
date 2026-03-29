import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ABProvider } from "@/components/ab/ABProvider";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsentProvider>
      <ABProvider>
        <AnalyticsTracker />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </ABProvider>
    </ConsentProvider>
  );
}
