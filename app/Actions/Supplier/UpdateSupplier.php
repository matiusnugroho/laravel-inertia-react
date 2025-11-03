<?php

namespace App\Actions\Supplier;

use App\Actions\Supplier\Concerns\HandlesSupplierImages;
use App\Models\Supplier;
use App\Repositories\SupplierRepository;

class UpdateSupplier
{
    use HandlesSupplierImages;

    public function __construct(
        private readonly SupplierRepository $suppliers,
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Supplier $supplier, array $data): Supplier
    {
        $imagePath = $this->persistImage($data['image'] ?? null, $supplier->image_path);
        unset($data['image']);

        $data['image_path'] = $imagePath;

        return $this->suppliers->update($supplier, $data);
    }
}

