<?php

namespace App\Http\Controllers;

use App\Actions\Product\CreateProduct;
use App\Actions\Product\DeleteProduct;
use App\Actions\Product\UpdateProduct;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use App\Repositories\CategoryRepository;
use App\Repositories\ProductRepository;
use App\Repositories\SupplierRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly SupplierRepository $suppliers,
        private readonly CategoryRepository $categories,
        private readonly CreateProduct $createProduct,
        private readonly UpdateProduct $updateProduct,
        private readonly DeleteProduct $deleteProduct,
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $perPage = $request->integer('perPage', 10);
        $perPageOptions = [5, 10, 20, 50];

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = 10;
        }

        $search = trim((string) $request->input('search', ''));

        $products = $this->products->paginateWithSupplier($search !== '' ? $search : null, $perPage);
        $suppliers = $this->suppliers->listForProductSelection();
        $categories = $this->categories->listOptions();

        return Inertia::render('products/index', [
            'products' => $products,
            'suppliers' => $suppliers,
            'categories' => $categories,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'perPage' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->createProduct->handle($request->validated());

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->updateProduct->handle($product, $request->validated());

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $this->deleteProduct->handle($product);

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }
}
