<?php

namespace App\Repositories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CategoryRepository
{
    /**
     * Retrieve all categories ordered by name.
     *
     * @return Collection<int, array{id: string, name: string}>
     */
    public function listOptions(): Collection
    {
        return Category::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
            ]);
    }

    /**
     * Sync the provided category names to the product.
     *
     * @param  array<int, string>  $names
     */
    public function syncForProduct(Product $product, array $names): void
    {
        $normalized = collect($names)
            ->map(fn (string $name) => trim($name))
            ->filter()
            ->unique(function (string $value) {
                return Str::slug($value);
            })
            ->values();

        if ($normalized->isEmpty()) {
            $product->categories()->sync([]);

            return;
        }

        $slugs = $normalized
            ->map(fn (string $value) => Str::slug($value));

        $existing = Category::query()
            ->whereIn('slug', $slugs)
            ->get()
            ->keyBy(fn (Category $category) => $category->slug);

        $categoryIds = [];

        foreach ($normalized as $name) {
            $slug = Str::slug($name);

            if (! $existing->has($slug)) {
                $category = Category::create([
                    'name' => Str::title($name),
                    'slug' => $slug,
                ]);

                $existing->put($slug, $category);
            }

            $categoryIds[] = $existing->get($slug)->id;
        }

        $product->categories()->sync($categoryIds);
    }
}
