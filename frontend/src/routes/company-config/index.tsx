import { createFileRoute } from '@tanstack/react-router';
import { CompanyConfigForm } from '@/components/CompanyConfigForm';

export const Route = createFileRoute('/company-config/')({
  component: CompanyConfig,
});

function CompanyConfig() {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Company Configuration
        </h1>
        <p className="text-gray-600 mb-3">
          Configure your company information, addresses, and vehicle fleet for
          route optimization.
        </p>
        <CompanyConfigForm />
      </div>
    </div>
  );
}
