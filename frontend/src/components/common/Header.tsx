export function Header(): React.ReactElement {
  return (
    <header className="p-4">
      <span className="text-[#16A34A] font-bold text-2xl">GroceryCompare</span>
      <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full ml-2">Beta</span>
      <p className="text-zinc-500 text-sm">Compare prices across Australian supermarkets</p>
    </header>
  );
}
