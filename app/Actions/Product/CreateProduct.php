<?php

namespace App\Actions\Product;

use App\Actions\Product\Concerns\HandlesProductImages;
use App\Models\Product;
use App\Repositories\CategoryRepository;
use App\Repositories\ProductRepository;

class CreateProduct
{
    use HandlesProductImages;

    public function __construct(
        private readonly ProductRepository $products,
        private readonly CategoryRepository $categories,
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): Product
    {
        $categoryNames = $data['categories'] ?? [];
        $imagePath = $this->persistImage($data['image'] ?? null);
        unset($data['image']);
        unset($data['categories']);

        if ($imagePath) {
            $data['image_path'] = $imagePath;
        }

        $product = $this->products->create($data);

        $this->categories->syncForProduct($product, (array) $categoryNames);

        return $product;
    }
}
