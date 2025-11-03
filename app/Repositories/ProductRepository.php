<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class ProductRepository
{
    /**
     * Retrieve paginated products with optional search filtering.
     *
     * @param  string|null  $search
     * @param  int  $perPage
     */
    public function paginateWithSupplier(?string $search, int $perPage): LengthAwarePaginator
    {
        return Product::query()
            ->with([
                'supplier:id,name,contact_name,email,phone,image_path',
                'categories' => function ($query) {
                    $query->orderBy('name');
                },
            ])
            ->when($search !== null && $search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $like = "%{$search}%";

                    $innerQuery
                        ->where('name', 'like', $like)
                        ->orWhere('sku', 'like', $like);
                });
            })
            ->orderBy('name')
            ->paginate($perPage, [
                'id',
                'supplier_id',
                'name',
                'sku',
                'description',
                'price',
                'stock',
                'image_path',
                'created_at',
                'updated_at',
            ])
            ->withQueryString()
            ->through(function (Product $product) {
                return [
                    'id' => $product->id,
                    'supplier_id' => $product->supplier_id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'description' => $product->description,
                    'price' => $product->price,
                    'stock' => $product->stock,
                    'image_url' => $this->imageUrl($product->image_path),
                    'supplier' => $product->supplier
                        ? [
                            'id' => $product->supplier->id,
                            'name' => $product->supplier->name,
                            'contact_name' => $product->supplier->contact_name,
                            'email' => $product->supplier->email,
                            'phone' => $product->supplier->phone,
                            'image_url' => $this->imageUrl($product->supplier->image_path),
                        ]
                        : null,
                    'categories' => $product->categories
                        ->map(fn ($category) => [
                            'id' => $category->id,
                            'name' => $category->name,
                        ])
                        ->all(),
                ];
            });
    }

    /**
     * Persist a new product.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Product
    {
        return Product::create($attributes);
    }

    /**
     * Update the given product.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(Product $product, array $attributes): Product
    {
        $product->update($attributes);

        return $product;
    }

    /**
     * Delete the given product.
     */
    public function delete(Product $product): void
    {
        $product->delete();
    }

    private function imageUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
