export default function EmptyState({ message = 'Nenhum dado encontrado' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted">
      <div className="w-16 h-16 rounded-full bg-s2 flex items-center justify-center mb-4 text-2xl">📭</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
