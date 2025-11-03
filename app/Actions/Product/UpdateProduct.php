<?php

namespace App\Actions\Product;

use App\Actions\Product\Concerns\HandlesProductImages;
use App\Models\Product;
use App\Repositories\CategoryRepository;
use App\Repositories\ProductRepository;

class UpdateProduct
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
    public function handle(Product $product, array $data): Product
    {
        $categoryNames = $data['categories'] ?? [];
        $imagePath = $this->persistImage($data['image'] ?? null, $product->image_path);
        unset($data['image']);
        unset($data['categories']);

        $data['image_path'] = $imagePath;

        $updated = $this->products->update($product, $data);

        $this->categories->syncForProduct($updated, (array) $categoryNames);

        return $updated;
    }
}
