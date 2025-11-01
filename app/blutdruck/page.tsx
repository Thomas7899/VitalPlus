import { BloodPressureClientView } from '@/components/health/BloodPressureClientView';

export default function BloodPressurePage() {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Blutdruck Monitor</h1>
      <BloodPressureClientView />
    </div>
  );
}