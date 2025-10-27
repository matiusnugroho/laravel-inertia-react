import ProductController from '@/actions/App/Http/Controllers/ProductController';
import InputError from '@/components/input-error';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as productsIndex } from '@/routes/products';
import { PageProps, type BreadcrumbItem } from '@/types';
import { Form, Head, router, usePage } from '@inertiajs/react';
import { Eye, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

type SupplierOption = {
    id: string;
    name: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    image_url?: string | null;
};

type Product = {
    id: string;
    name: string;
    sku: string;
    description?: string | null;
    price: string;
    stock: number;
    image_url?: string | null;
    supplier: SupplierOption | null;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type PaginationSummary = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Paginated<T> = {
    data: T[];
    meta?: PaginationMeta;
    links?: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
} & Partial<PaginationSummary>;

type ProductsPageFilters = {
    search?: string | null;
    perPage?: number | null;
};

type ProductsPageProps = {
    products: Paginated<Product>;
    suppliers: SupplierOption[];
    filters: ProductsPageFilters;
};

type ConfirmState = {
    title: string;
    description: string;
    onConfirm: () => void;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Products',
        href: productsIndex().url,
    },
];

const priceFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'IDR',
});

export default function ProductsPage({ products, suppliers, filters }: ProductsPageProps) {
    const [dialogState, setDialogState] = useState<
        | { mode: 'create' }
        | { mode: 'edit'; product: Product }
        | null
    >(null);
    const [viewProduct, setViewProduct] = useState<Product | null>(null);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
    const {flash} = usePage<PageProps>().props;

    const initialSearch = filters.search ?? '';
    const productRows = products?.data ?? [];
    const fallbackPerPage =
        filters.perPage ??
        products?.meta?.per_page ??
        products?.per_page ??
        10;
    const safeMeta: PaginationMeta = products?.meta ?? {
        current_page: products?.current_page ?? 1,
        last_page: products?.last_page ?? 1,
        per_page: fallbackPerPage,
        total: products?.total ?? productRows.length ?? 0,
        from: products?.from ?? (productRows.length > 0 ? 1 : 0),
        to: products?.to ?? productRows.length ?? 0,
    };
    const initialPerPage = filters.perPage ?? safeMeta.per_page ?? fallbackPerPage;

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [itemsPerPage, setItemsPerPage] = useState<number>(initialPerPage);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setSearchTerm(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        setItemsPerPage(initialPerPage);
    }, [initialPerPage]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

    const hasSuppliers = suppliers.length > 0;

    const dialogKey = useMemo(() => {
        if (!dialogState) {
            return 'closed';
        }

        if (dialogState.mode === 'edit') {
            return `edit-${dialogState.product.id}`;
        }

        return 'create';
    }, [dialogState]);

    const closeDialog = () => setDialogState(null);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const trimmed = value.trim();

            router.get(
                productsIndex().url,
                {
                    search: trimmed !== '' ? trimmed : undefined,
                    perPage: itemsPerPage,
                    page: 1,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        }, 300);
    };

    const handlePerPageChange = (value: number) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }

        setItemsPerPage(value);

        router.get(
            productsIndex().url,
            {
                search:
                    searchTerm.trim() !== ''
                        ? searchTerm.trim()
                        : undefined,
                perPage: value,
                page: 1,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const changePage = (page: number) => {
        if (page === safeMeta.current_page) {
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }

        router.get(
            productsIndex().url,
            {
                search:
                    searchTerm.trim() !== ''
                        ? searchTerm.trim()
                        : undefined,
                perPage: itemsPerPage,
                page,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const currentPage = safeMeta.current_page;
    const totalPages = safeMeta.last_page;
    const hasProducts = productRows.length > 0;
    const paginationRange = {
        start: safeMeta.from ?? 0,
        end: safeMeta.to ?? 0,
        total: safeMeta.total,
    };
    const isFiltered = Boolean(filters.search && filters.search.length > 0);

    const openDeleteConfirm = (
        product: Product,
        submit: () => void,
    ) => {
        setConfirmState({
            title: 'Delete product',
            description: `Are you sure you want to delete “${product.name}”? This action cannot be undone.`,
            onConfirm: () => {
                submit();
                setConfirmState(null);
            },
        });
    };

    const formConfig = dialogState
        ? dialogState.mode === 'edit'
            ? ProductController.update.form({
                  product: dialogState.product.id,
              })
            : ProductController.store.form()
        : null;

    const formatPrice = (value: string) => {
        const numeric = Number.parseFloat(value);

        if (Number.isNaN(numeric)) {
            return value;
        }

        return priceFormatter.format(numeric);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            Product catalog
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Track your inventory and supplier assignments.
                        </p>
                    </div>

                    <Button
                        onClick={() => setDialogState({ mode: 'create' })}
                        disabled={!hasSuppliers}
                    >
                        <Plus className="size-4" />
                        Add product
                    </Button>
                </div>

                {!hasSuppliers && (
                    <div className="flex items-center gap-3 rounded-md border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-500/10 dark:text-amber-200">
                        <PackagePlus className="size-4" />
                        <span>
                            Add at least one supplier before creating products.
                        </span>
                    </div>
                )}

                {flash.success && <Toaster position='top-right' />}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                        value={searchTerm}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        placeholder="Search by name or SKU..."
                        className="w-full sm:max-w-xs"
                        aria-label="Search products"
                    />

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="hidden sm:inline">Rows per page</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) =>
                                handlePerPageChange(Number(value))
                            }
                        >
                            <SelectTrigger className="w-[110px]" aria-label="Rows per page">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 20, 50].map((option) => (
                                    <SelectItem key={option} value={option.toString()}>
                                        {option} / page
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                    <table className="min-w-full divide-y divide-border text-left text-sm">
                        <thead className="bg-muted/60">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Photo
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Product
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    SKU
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Supplier
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Price
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Stock
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70 bg-background">
                            {!hasProducts ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-center text-sm text-muted-foreground"
                                        colSpan={7}
                                    >
                                        {isFiltered
                                            ? 'No products match your search.'
                                            : 'No products found.'}
                                    </td>
                                </tr>
                            ) : (
                                productRows.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-4 py-3 align-top">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={`${product.name} photo`}
                                                    className="h-12 w-12 rounded-md border border-border/70 object-cover shadow-sm"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border/70 text-[10px] uppercase tracking-wide text-muted-foreground">
                                                    No image
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="font-medium text-foreground">
                                                {product.name}
                                            </div>
                                            {product.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {product.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                                            {product.sku}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="text-sm text-foreground">
                                                {product.supplier?.name ?? '—'}
                                            </div>
                                            {product.supplier?.email && (
                                                <div className="text-xs text-muted-foreground">
                                                    {product.supplier.email}
                                                </div>
                                            )}
                                            {product.supplier?.contact_name && (
                                                <div className="text-xs text-muted-foreground">
                                                    Contact: {product.supplier.contact_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                                            {formatPrice(product.price)}
                                        </td>
                                        <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                                            {product.stock}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`View ${product.name} details`}
                                                    onClick={() => setViewProduct(product)}
                                                >
                                                    <Eye className="size-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Edit ${product.name}`}
                                                    onClick={() =>
                                                        setDialogState({
                                                            mode: 'edit',
                                                            product,
                                                        })
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>

                                                <Button
    type="button"
    variant="ghost"
    size="icon"
    className="text-destructive"
    onClick={() =>
        openDeleteConfirm(product, () =>
            router.delete(ProductController.destroy({ product: product.id }).url)
        )
    }
>
    <Trash2 className="size-4" />
</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {!hasProducts
                                ? 'No products to display.'
                                : `Showing ${paginationRange.start}-${paginationRange.end} of ${paginationRange.total} products`}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    changePage(Math.max(1, currentPage - 1))
                                }
                                disabled={!hasProducts || currentPage <= 1}
                            >
                                Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Page {hasProducts ? currentPage : 1} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    changePage(
                                        Math.min(totalPages, currentPage + 1),
                                    )
                                }
                                disabled={!hasProducts || currentPage >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={dialogState !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDialog();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogState?.mode === 'edit'
                                ? 'Edit product'
                                : 'Create product'}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogState?.mode === 'edit'
                                ? 'Update the product information.'
                                : 'Add a new product to your inventory.'}
                        </DialogDescription>
                    </DialogHeader>

                    {formConfig && (
                        <Form
                            key={dialogKey}
                            {...formConfig}
                            encType="multipart/form-data"
                            className="space-y-4"
                            onSuccess={closeDialog}
                        >
                            {({
                                errors,
                                processing,
                                resetAndClearErrors,
                            }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Product name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.product.name
                                                    : ''
                                            }
                                            placeholder="Wireless headphones"
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="sku">SKU</Label>
                                        <Input
                                            id="sku"
                                            name="sku"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.product.sku
                                                    : ''
                                            }
                                            placeholder="SKU-001"
                                            required
                                        />
                                        <InputError message={errors.sku} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="supplier_id">Supplier</Label>
                                        <select
                                            id="supplier_id"
                                            name="supplier_id"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.product
                                                          .supplier?.id ?? ''
                                                    : ''
                                            }
                                            required
                                            className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            <option value="" disabled>
                                                Select supplier
                                            </option>
                                            {suppliers.map((supplier) => (
                                                <option
                                                    key={supplier.id}
                                                    value={supplier.id}
                                                >
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.supplier_id} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="image">Product photo</Label>
                                        <Input
                                            id="image"
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Images are automatically converted to WebP format.
                                        </p>
                                        <InputError message={errors.image} />
                                        {dialogState?.mode === 'edit' &&
                                            dialogState.product.image_url && (
                                                <div className="flex items-center gap-3 rounded-md border border-border/70 bg-muted/40 p-2">
                                                    <img
                                                        src={dialogState.product.image_url}
                                                        alt={`${dialogState.product.name} current photo`}
                                                        className="h-12 w-12 rounded-md object-cover"
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        Current photo
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Price</Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.product.price
                                                    : ''
                                            }
                                            placeholder="99.00"
                                            required
                                        />
                                        <InputError message={errors.price} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="stock">Stock</Label>
                                        <Input
                                            id="stock"
                                            name="stock"
                                            type="number"
                                            min="0"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? String(dialogState.product.stock)
                                                    : ''
                                            }
                                            placeholder="50"
                                            required
                                        />
                                        <InputError message={errors.stock} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.product
                                                          .description ?? ''
                                                    : ''
                                            }
                                            placeholder="Short product description"
                                            className="min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => {
                                                resetAndClearErrors();
                                                closeDialog();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {dialogState?.mode === 'edit'
                                                ? 'Save changes'
                                                : 'Create product'}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={viewProduct !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewProduct(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Product details</DialogTitle>
                        <DialogDescription>
                            Review comprehensive information about this product.
                        </DialogDescription>
                    </DialogHeader>

                    {viewProduct && (
                        <div className="grid gap-4 text-sm">
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Photo
                                </span>
                                {viewProduct.image_url ? (
                                    <img
                                        src={viewProduct.image_url}
                                        alt={`${viewProduct.name} photo`}
                                        className="h-40 w-full max-w-xs rounded-md border border-border/70 object-cover shadow-sm"
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        No image uploaded.
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Name
                                </span>
                                <span className="font-medium text-foreground">
                                    {viewProduct.name}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    SKU
                                </span>
                                <span className="text-foreground">
                                    {viewProduct.sku}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Supplier
                                </span>
                                <span className="text-foreground">
                                    {viewProduct.supplier?.name ?? '—'}
                                </span>
                                {viewProduct.supplier?.image_url && (
                                    <img
                                        src={viewProduct.supplier.image_url}
                                        alt={`${viewProduct.supplier.name ?? 'Supplier'} logo`}
                                        className="mt-1 h-16 w-16 rounded-full border border-border/70 object-cover"
                                    />
                                )}
                                {viewProduct.supplier?.email && (
                                    <span className="text-muted-foreground">
                                        {viewProduct.supplier.email}
                                    </span>
                                )}
                                {viewProduct.supplier?.contact_name && (
                                    <span className="text-muted-foreground">
                                        Contact: {viewProduct.supplier.contact_name}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Price
                                </span>
                                <span className="text-foreground">
                                    {formatPrice(viewProduct.price)}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Stock
                                </span>
                                <span className="text-foreground">
                                    {viewProduct.stock}
                                </span>
                            </div>
                            {viewProduct.description && (
                                <div className="grid gap-1">
                                    <span className="text-xs uppercase text-muted-foreground">
                                        Description
                                    </span>
                                    <span className="text-foreground">
                                        {viewProduct.description}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmState !== null}
                title={confirmState?.title ?? ''}
                description={confirmState?.description}
                confirmLabel="Delete"
                onConfirm={confirmState?.onConfirm ?? (() => undefined)}
                onCancel={() => setConfirmState(null)}
            />
        </AppLayout>
    );
}
