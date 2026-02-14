import { PatientsList } from "@/components/PatientsList";
import "./styles.css";

export default function Home() {
  return (
    <div className="relative flex h-screen w-full flex-col items-start justify-start">
      <div className="card relative w-full min-h-[600px] overflow-hidden rounded-2xl p-8 text-xl font-bold text-[#ddffdc] md:text-4xl">
        <PatientsList />
      </div>
    </div>
  );
}
