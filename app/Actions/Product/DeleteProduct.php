<?php

namespace App\Actions\Product;

use App\Models\Product;
use App\Repositories\ProductRepository;

class DeleteProduct
{
    public function __construct(
        private readonly ProductRepository $products,
    ) {
    }

    public function handle(Product $product): void
    {
        $this->products->delete($product);
    }
}

