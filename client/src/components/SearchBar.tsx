import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchContent } from "@/lib/api";

interface SearchBarProps {
  onSearch?: (results: any) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    if (onSearch && value.trim()) {
      const results = searchContent(value);
      onSearch(results);
    }
  };

  return (
    <div className="relative hidden sm:block">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-64 bg-muted border-border pl-10 focus:ring-primary/50 focus:border-primary"
        data-testid="input-search"
      />
    </div>
  );
}
