interface HeaderProps {
  generatedAt?: string;
  bankCount?: number;
  rateCount?: number;
}

export default function Header({ generatedAt, bankCount, rateCount }: HeaderProps) {
  return (
    <header className="bg-indigo-700 text-white px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Australian Mortgage Rate Comparator</h1>
      <p className="mt-1 text-indigo-200">Compare residential mortgage rates from Australian banks using open banking data</p>
      {generatedAt && (
        <p className="mt-3 text-sm text-indigo-300">
          Last updated: {new Date(generatedAt).toLocaleString()} &middot; {bankCount} banks, {rateCount} rates
        </p>
      )}
    </header>
  );
}
