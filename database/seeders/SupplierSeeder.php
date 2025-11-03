<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Support\WebpImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dummyImage = database_path('seeders/images/dummy.webp');
        $categoryIds = Category::query()->pluck('id')->all();

        Supplier::factory()
            ->count(8)
            ->create()
            ->each(function (Supplier $supplier) use ($dummyImage, $categoryIds): void {
                Product::factory()
                    ->count(random_int(2, 6))
                    ->for($supplier)
                    ->create()
                    ->each(function (Product $product) use ($dummyImage, $categoryIds): void {
                        $product->forceFill([
                            'image_path' => WebpImage::storeFromPath($dummyImage, 'products'),
                        ])->save();

                        if (! empty($categoryIds)) {
                            $max = min(count($categoryIds), 3);
                            $count = max(1, random_int(1, $max));
                            $selection = $count === 1
                                ? [Arr::random($categoryIds)]
                                : Arr::random($categoryIds, $count);

                            $product->categories()->sync(Arr::wrap($selection));
                        }
                    });
            });
    }
}
