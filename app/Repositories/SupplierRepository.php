<?php

namespace App\Repositories;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class SupplierRepository
{
    /**
     * Retrieve paginated suppliers with optional search filtering and product counts.
     *
     * @param  string|null  $search
     * @param  int  $perPage
     */
    public function paginateWithProductCount(?string $search, int $perPage): LengthAwarePaginator
    {
        return Supplier::query()
            ->withCount('products')
            ->when($search !== null && $search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $like = "%{$search}%";

                    $innerQuery
                        ->where('name', 'like', $like)
                        ->orWhere('contact_name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhere('address', 'like', $like);
                });
            })
            ->orderBy('name')
            ->paginate($perPage, [
                'id',
                'name',
                'contact_name',
                'email',
                'phone',
                'address',
                'image_path',
                'created_at',
                'updated_at',
            ])
            ->withQueryString()
            ->through(function (Supplier $supplier) {
                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'contact_name' => $supplier->contact_name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'address' => $supplier->address,
                    'products_count' => $supplier->products_count,
                    'image_url' => $this->imageUrl($supplier->image_path),
                ];
            });
    }

    /**
     * Retrieve suppliers formatted for product selection lists.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function listForProductSelection(): Collection
    {
        return Supplier::query()
            ->orderBy('name')
            ->get(['id', 'name', 'contact_name', 'email', 'phone', 'image_path'])
            ->map(function (Supplier $supplier) {
                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'contact_name' => $supplier->contact_name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'image_url' => $this->imageUrl($supplier->image_path),
                ];
            })
            ->values();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Supplier
    {
        return Supplier::create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Supplier $supplier, array $attributes): Supplier
    {
        $supplier->update($attributes);

        return $supplier;
    }

    public function delete(Supplier $supplier): void
    {
        $supplier->delete();
    }

    private function imageUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}

