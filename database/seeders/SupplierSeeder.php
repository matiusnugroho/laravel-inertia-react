<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Supplier;
use App\Support\WebpImage;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dummyImage = database_path('seeders/images/dummy.webp');

        Supplier::factory()
            ->count(8)
            ->create()
            ->each(function (Supplier $supplier) use ($dummyImage): void {
                Product::factory()
                    ->count(random_int(2, 6))
                    ->for($supplier)
                    ->create()
                    ->each(function (Product $product) use ($dummyImage): void {
                        $product->forceFill([
                            'image_path' => WebpImage::storeFromPath($dummyImage, 'products'),
                        ])->save();
                    });
            });
    }
}
