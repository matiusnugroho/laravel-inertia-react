<?php

namespace App\Actions\Supplier;

use App\Models\Supplier;
use App\Repositories\SupplierRepository;

class DeleteSupplier
{
    public function __construct(
        private readonly SupplierRepository $suppliers,
    ) {
    }

    public function handle(Supplier $supplier): void
    {
        $this->suppliers->delete($supplier);
    }
}

