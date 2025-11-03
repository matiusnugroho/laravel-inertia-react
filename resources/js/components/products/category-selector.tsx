import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

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

const normalize = (value: string): string =>
    value.trim().toLowerCase();

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

    const sortedOptions = useMemo(
        () => [...options].sort((a, b) => a.name.localeCompare(b.name)),
        [options],
    );

    const isSelected = (name: string): boolean =>
        selected.some((item) => normalize(item.name) === normalize(name));

    const toggleExisting = (option: CategoryOption) => {
        setSelected((current) => {
            if (current.some((item) => normalize(item.name) === normalize(option.name))) {
                return current.filter(
                    (item) => normalize(item.name) !== normalize(option.name),
                );
            }

            return [
                ...current,
                {
                    id: option.id,
                    name: option.name,
                },
            ];
        });
    };

    const addNewCategory = () => {
        const trimmed = inputValue.trim();

        if (trimmed.length === 0) {
            return;
        }

        if (isSelected(trimmed)) {
            setInputValue('');

            return;
        }

        setSelected((current) => [
            ...current,
            {
                id: null,
                name: trimmed.replace(/\s+/g, ' '),
            },
        ]);
        setInputValue('');
    };

    const removeCategory = (name: string) => {
        setSelected((current) =>
            current.filter((item) => normalize(item.name) !== normalize(name)),
        );
    };

    return (
        <div className="grid gap-3">
            {selected.map((category, index) => (
                <input
                    key={`${category.name}-${index}`}
                    type="hidden"
                    name={inputName}
                    value={category.name}
                />
            ))}

            <div className="flex flex-wrap gap-2">
                {selected.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                        No categories selected.
                    </span>
                ) : (
                    selected.map((category, index) => (
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
                    ))
                )}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input
                        id={inputId}
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                addNewCategory();
                            }
                        }}
                        placeholder="Type a category and press Enter"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addNewCategory}
                        disabled={inputValue.trim().length === 0}
                    >
                        <Plus className="size-4" />
                        Add
                    </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                    Select existing categories or add a new one.
                </span>
                {error ? (
                    <span className="text-xs text-destructive">{error}</span>
                ) : null}
            </div>

            {sortedOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {sortedOptions.map((option) => (
                        <Button
                            key={option.id}
                            type="button"
                            variant={isSelected(option.name) ? 'default' : 'outline'}
                            className="h-8 rounded-full px-3 text-xs"
                            onClick={() => toggleExisting(option)}
                            aria-pressed={isSelected(option.name)}
                        >
                            {option.name}
                        </Button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
