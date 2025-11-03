<?php

namespace App\Http\Controllers;

use App\Actions\Supplier\CreateSupplier;
use App\Actions\Supplier\DeleteSupplier;
use App\Actions\Supplier\UpdateSupplier;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Repositories\SupplierRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierRepository $suppliers,
        private readonly CreateSupplier $createSupplier,
        private readonly UpdateSupplier $updateSupplier,
        private readonly DeleteSupplier $deleteSupplier,
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

        $suppliers = $this->suppliers->paginateWithProductCount($search !== '' ? $search : null, $perPage);

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
    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $this->createSupplier->handle($request->validated());

        return redirect()->back()->with('success', 'Supplier created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $this->updateSupplier->handle($supplier, $request->validated());

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier): RedirectResponse
    {
        $this->deleteSupplier->handle($supplier);

        return redirect()->back()->with('success', 'Supplier deleted successfully.');
    }
}
