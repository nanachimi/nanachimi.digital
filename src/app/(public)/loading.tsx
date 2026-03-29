export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#111318]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFC62C] border-t-transparent" />
        <p className="text-sm text-[#8B8F97]">Laden...</p>
      </div>
    </div>
  );
}
