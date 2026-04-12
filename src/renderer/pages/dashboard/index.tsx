import AppLayout from '@components/layout/AppLayout';

export default function Dashboard() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to the dashboard!</p>
      </div>
    </AppLayout>
  );
}
