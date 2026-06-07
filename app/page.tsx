import { ScheduleDashboard } from "@/components/ScheduleDashboard";
import { FavoritesProvider } from "@/context/FavoritesContext";

export default function Home() {
  return (
    <FavoritesProvider>
      <ScheduleDashboard />
    </FavoritesProvider>
  );
}
