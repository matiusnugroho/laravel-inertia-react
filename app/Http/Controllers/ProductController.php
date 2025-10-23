<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Supplier;
use App\Support\WebpImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ProductController extends Controller
{
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

        $products = Product::query()
            ->with('supplier:id,name,contact_name,email,phone,image_path')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $like = "%{$search}%";

                    $innerQuery
                        ->where('name', 'like', $like)
                        ->orWhere('sku', 'like', $like);
                });
            })
            ->orderBy('name')
            ->paginate($perPage, [
                'id',
                'supplier_id',
                'name',
                'sku',
                'description',
                'price',
                'stock',
                'image_path',
                'created_at',
                'updated_at',
            ])
            ->withQueryString()
            ->through(function (Product $product) {
                return [
                    'id' => $product->id,
                    'supplier_id' => $product->supplier_id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'description' => $product->description,
                    'price' => $product->price,
                    'stock' => $product->stock,
                    'image_url' => $this->imageUrl($product->image_path),
                    'supplier' => $product->supplier
                        ? [
                            'id' => $product->supplier->id,
                            'name' => $product->supplier->name,
                            'contact_name' => $product->supplier->contact_name,
                            'email' => $product->supplier->email,
                            'phone' => $product->supplier->phone,
                            'image_url' => $this->imageUrl($product->supplier->image_path),
                        ]
                        : null,
                ];
            });

        $suppliers = Supplier::query()
            ->orderBy('name')
            ->get(['id', 'name', 'contact_name', 'email', 'phone', 'image_path'])
            ->map(function (Supplier $supplier) {
                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'contact_name' => $supplier->contact_name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'image_url' => $this->imageUrl($supplier->image_path),
                ];
            })
            ->values();

        return Inertia::render('products/index', [
            'products' => $products,
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'perPage' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'uuid', 'exists:suppliers,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'between:0,999999.99'],
            'stock' => ['required', 'integer', 'min:0'],
            'image' => ['nullable', File::image()->max(4096)],
        ]);

        $imagePath = null;

        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $imagePath = $this->storeProductImage($data['image']);
        }

        unset($data['image']);

        if ($imagePath) {
            $data['image_path'] = $imagePath;
        }

        Product::create($data);

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'uuid', 'exists:suppliers,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'between:0,999999.99'],
            'stock' => ['required', 'integer', 'min:0'],
            'image' => ['nullable', File::image()->max(4096)],
        ]);

        $imagePath = $product->image_path;

        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $imagePath = $this->storeProductImage($data['image'], $product->image_path);
        }

        unset($data['image']);

        $product->update(array_merge($data, [
            'image_path' => $imagePath,
        ]));

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }

    /**
     * Persist the uploaded image as WebP and return its storage path.
     *
     * @throws ValidationException
     */
    private function storeProductImage(UploadedFile $file, ?string $existingPath = null): string
    {
        try {
            return WebpImage::storeFromUploadedFile($file, 'products', $existingPath);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'image' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Generate a public URL for the stored image.
     */
    private function imageUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
