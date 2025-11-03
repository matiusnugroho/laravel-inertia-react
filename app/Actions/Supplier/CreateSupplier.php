<?php

namespace App\Actions\Supplier;

use App\Actions\Supplier\Concerns\HandlesSupplierImages;
use App\Models\Supplier;
use App\Repositories\SupplierRepository;

class CreateSupplier
{
    use HandlesSupplierImages;

    public function __construct(
        private readonly SupplierRepository $suppliers,
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): Supplier
    {
        $imagePath = $this->persistImage($data['image'] ?? null);
        unset($data['image']);

        if ($imagePath) {
            $data['image_path'] = $imagePath;
        }

        return $this->suppliers->create($data);
    }
}

