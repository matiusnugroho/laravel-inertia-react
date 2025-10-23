<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Supplier;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard overview.
     */
    public function __invoke(): Response
    {
        $totalProducts = Product::count();
        $totalSuppliers = Supplier::count();

        $lowStockProducts = Product::query()
            ->with('supplier:id,name')
            ->orderBy('stock')
            ->orderBy('name')
            ->limit(5)
            ->get([
                'id',
                'supplier_id',
                'name',
                'sku',
                'stock',
            ])
            ->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'stock' => $product->stock,
                    'supplier' => $product->supplier
                        ? [
                            'id' => $product->supplier->id,
                            'name' => $product->supplier->name,
                        ]
                        : null,
                ];
            })
            ->values();

        $recentProducts = Product::query()
            ->with('supplier:id,name')
            ->latest()
            ->limit(5)
            ->get([
                'id',
                'supplier_id',
                'name',
                'sku',
                'stock',
                'created_at',
            ])
            ->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'stock' => $product->stock,
                    'created_at' => optional($product->created_at)->toIso8601String(),
                    'supplier' => $product->supplier
                        ? [
                            'id' => $product->supplier->id,
                            'name' => $product->supplier->name,
                        ]
                        : null,
                ];
            })
            ->values();

        return Inertia::render('dashboard', [
            'stats' => [
                'totalProducts' => $totalProducts,
                'totalSuppliers' => $totalSuppliers,
            ],
            'lowStockProducts' => $lowStockProducts,
            'recentProducts' => $recentProducts,
        ]);
    }
}
