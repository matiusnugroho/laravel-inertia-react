<?php

namespace App\Http\Controllers;

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

class SupplierController extends Controller
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

        $suppliers = Supplier::query()
            ->withCount('products')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $like = "%{$search}%";

                    $innerQuery
                        ->where('name', 'like', $like)
                        ->orWhere('contact_name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhere('address', 'like', $like);
                });
            })
            ->orderBy('name')
            ->paginate($perPage, [
                'id',
                'name',
                'contact_name',
                'email',
                'phone',
                'address',
                'image_path',
                'created_at',
                'updated_at',
            ])
            ->withQueryString()
            ->through(function (Supplier $supplier) {
                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'contact_name' => $supplier->contact_name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'address' => $supplier->address,
                    'products_count' => $supplier->products_count,
                    'image_url' => $this->imageUrl($supplier->image_path),
                ];
            });

        return Inertia::render('suppliers/index', [
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
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('suppliers', 'email')],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'image' => ['nullable', File::image()->max(4096)],
        ]);

        $imagePath = null;

        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $imagePath = $this->storeSupplierImage($data['image']);
        }

        unset($data['image']);

        if ($imagePath) {
            $data['image_path'] = $imagePath;
        }

        Supplier::create($data);

        return redirect()->back()->with('success', 'Supplier created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('suppliers', 'email')->ignore($supplier->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'image' => ['nullable', File::image()->max(4096)],
        ]);

        $imagePath = $supplier->image_path;

        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $imagePath = $this->storeSupplierImage($data['image'], $supplier->image_path);
        }

        unset($data['image']);

        $supplier->update(array_merge($data, [
            'image_path' => $imagePath,
        ]));

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->back()->with('success', 'Supplier deleted successfully.');
    }

    /**
     * Persist the uploaded image as WebP and return its storage path.
     *
     * @throws ValidationException
     */
    private function storeSupplierImage(UploadedFile $file, ?string $existingPath = null): string
    {
        try {
            return WebpImage::storeFromUploadedFile($file, 'suppliers', $existingPath);
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
