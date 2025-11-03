import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

type CategoryOption = {
    id: string;
    name: string;
};

type CategorySelection = {
    id: string | null;
    name: string;
};

type CategorySelectorProps = {
    options: CategoryOption[];
    initialSelected?: CategoryOption[];
    inputName?: string;
    inputId?: string;
    error?: string;
};

const normalize = (value: string): string => value.trim().toLowerCase();

export function CategorySelector({
    options,
    initialSelected = [],
    inputName = 'categories[]',
    inputId,
    error,
}: CategorySelectorProps) {
    const [selected, setSelected] = useState<CategorySelection[]>(
        () =>
            initialSelected.map((category) => ({
                id: category.id ?? null,
                name: category.name,
            })),
    );
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const sortedOptions = useMemo(
        () => [...options].sort((a, b) => a.name.localeCompare(b.name)),
        [options],
    );

    const selectedKeySet = useMemo(
        () =>
            new Set(
                selected.map((category) => normalize(category.name)),
            ),
        [selected],
    );

    const availableOptions = useMemo(
        () =>
            sortedOptions.filter(
                (option) => !selectedKeySet.has(normalize(option.name)),
            ),
        [sortedOptions, selectedKeySet],
    );

    const filteredSuggestions = useMemo(() => {
        const query = normalize(inputValue);

        if (!query) {
            return availableOptions.slice(0, 8);
        }

        return availableOptions
            .filter((option) => normalize(option.name).includes(query))
            .slice(0, 8);
    }, [availableOptions, inputValue]);

    const addCategory = (name: string, id: string | null = null) => {
        const safeName = name.replace(/\s+/g, ' ').trim();

        if (safeName.length === 0) {
            return;
        }

        const key = normalize(safeName);

        if (selectedKeySet.has(key)) {
            setInputValue('');
            return;
        }

        setSelected((current) => [
            ...current,
            {
                id,
                name: safeName,
            },
        ]);
        setInputValue('');
    };

    const handleOptionSelect = (option: CategoryOption) => {
        addCategory(option.name, option.id);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
        event,
    ) => {
        if (event.key === 'Backspace' && inputValue === '' && selected.length) {
            event.preventDefault();
            setSelected((current) => current.slice(0, -1));
            return;
        }

        if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
            const trimmed = inputValue.trim();

            if (trimmed !== '') {
                event.preventDefault();

                const existing = availableOptions.find(
                    (option) => normalize(option.name) === normalize(trimmed),
                );

                if (existing) {
                    handleOptionSelect(existing);
                } else {
                    addCategory(trimmed);
                }
            }
        }
    };

    const removeCategory = (name: string) => {
        const key = normalize(name);
        setSelected((current) =>
            current.filter(
                (category) => normalize(category.name) !== key,
            ),
        );
    };

    return (
        <div className="grid gap-2">
            {selected.map((category, index) => (
                <input
                    key={`${category.name}-${index}`}
                    type="hidden"
                    name={inputName}
                    value={category.name}
                />
            ))}

            <div className="min-h-10 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                <div className="flex flex-wrap gap-2">
                    {selected.map((category, index) => (
                        <Badge
                            key={`${category.name}-${index}-badge`}
                            variant="secondary"
                            className="gap-1 pr-1"
                        >
                            {category.name}
                            <button
                                type="button"
                                onClick={() => removeCategory(category.name)}
                                className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Remove ${category.name}`}
                            >
                                <X className="size-3.5" />
                            </button>
                        </Badge>
                    ))}

                    <Input
                        id={inputId}
                        value={inputValue}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            // Delay blur to allow suggestion click
                            setTimeout(() => setIsFocused(false), 100);
                        }}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            selected.length === 0 ? 'Add categories…' : 'Add more…'
                        }
                        className="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
                    />
                </div>
            </div>

            {error ? (
                <span className="text-xs text-destructive">{error}</span>
            ) : null}

            {isFocused && filteredSuggestions.length > 0 ? (
                <ul className="max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-sm shadow-md">
                    {filteredSuggestions.map((option) => (
                        <li key={option.id}>
                            <button
                                type="button"
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleOptionSelect(option)}
                            >
                                <span>{option.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    press enter
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}

            <p className="text-xs text-muted-foreground">
                Tekan <kbd className="rounded bg-muted px-1">Enter</kbd> atau{' '}
                <kbd className="rounded bg-muted px-1">,</kbd> untuk menambahkan
                kategori baru. Gunakan Backspace untuk menghapus tag terakhir.
            </p>
        </div>
    );
}
