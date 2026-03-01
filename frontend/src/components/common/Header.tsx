interface HeaderProps {
  showEdit?: boolean;
  onEditList?: () => void;
}

export function Header({ showEdit, onEditList }: HeaderProps): React.ReactElement {
  return (
    <header className="p-4 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[#16A34A] font-bold text-2xl">GroceryCompare</span>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <p className="text-zinc-500 text-sm">Compare prices across Australian supermarkets</p>
      </div>
      {showEdit && onEditList && (
        <button
          type="button"
          onClick={onEditList}
          className="md:hidden bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5"
          aria-label="Edit list"
        >
          Edit
        </button>
      )}
    </header>
  );
}
