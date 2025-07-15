import { createFileRoute } from '@tanstack/react-router';
import { CompanyConfigForm } from '@/components/CompanyConfigForm';

export const Route = createFileRoute('/company-config/')({
  component: CompanyConfig,
});

function CompanyConfig() {
  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white rounded-lg border shadow p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">
        Company Configuration
      </h1>
      <p className="text-gray-600 mb-3">
        Configure your company information, addresses, and vehicle fleet for
        route optimization.
      </p>
      <CompanyConfigForm />
    </div>

  );
}
