import SupplierController from '@/actions/App/Http/Controllers/SupplierController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
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
import { index as suppliersIndex } from '@/routes/suppliers';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Supplier = {
    id: string;
    name: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    products_count: number;
    image_url?: string | null;
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

type SuppliersPageFilters = {
    search?: string | null;
    perPage?: number | null;
};

type SuppliersPageProps = {
    suppliers: Paginated<Supplier>;
    filters: SuppliersPageFilters;
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
        title: 'Suppliers',
        href: suppliersIndex().url,
    },
];

export default function SuppliersPage({ suppliers, filters }: SuppliersPageProps) {
    const [dialogState, setDialogState] = useState<
        | { mode: 'create' }
        | { mode: 'edit'; supplier: Supplier }
        | null
    >(null);
    const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const initialSearch = filters.search ?? '';
    const supplierRows = suppliers?.data ?? [];
    const fallbackPerPage =
        filters.perPage ??
        suppliers?.meta?.per_page ??
        suppliers?.per_page ??
        10;
    const safeMeta: PaginationMeta = suppliers?.meta ?? {
        current_page: suppliers?.current_page ?? 1,
        last_page: suppliers?.last_page ?? 1,
        per_page: fallbackPerPage,
        total: suppliers?.total ?? supplierRows.length ?? 0,
        from: suppliers?.from ?? (supplierRows.length > 0 ? 1 : 0),
        to: suppliers?.to ?? supplierRows.length ?? 0,
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

    const dialogKey = useMemo(() => {
        if (!dialogState) {
            return 'closed';
        }

        if (dialogState.mode === 'edit') {
            return `edit-${dialogState.supplier.id}`;
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
                suppliersIndex().url,
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
            suppliersIndex().url,
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
            suppliersIndex().url,
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
    const hasRows = supplierRows.length > 0;
    const paginationRange = {
        start: safeMeta.from ?? 0,
        end: safeMeta.to ?? 0,
        total: safeMeta.total,
    };
    const isFiltered = Boolean(filters.search && filters.search.length > 0);

    const openDeleteConfirm = (
        supplier: Supplier,
        submit: () => void,
    ) => {
        setConfirmState({
            title: 'Delete supplier',
            description:
                'Deleting this supplier will also remove their related products. This action cannot be undone.',
            onConfirm: () => {
                submit();
                setConfirmState(null);
            },
        });
    };

    const formConfig = dialogState
        ? dialogState.mode === 'edit'
            ? SupplierController.update.form({
                  supplier: dialogState.supplier.id,
              })
            : SupplierController.store.form()
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            Supplier directory
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage supplier contacts and relationships.
                        </p>
                    </div>

                    <Button onClick={() => setDialogState({ mode: 'create' })}>
                        <Plus className="size-4" />
                        Add supplier
                    </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                        value={searchTerm}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        placeholder="Search suppliers..."
                        className="w-full sm:max-w-xs"
                        aria-label="Search suppliers"
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
                                    Supplier
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Contact
                                </th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">
                                    Products
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70 bg-background">
                            {!hasRows ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-center text-sm text-muted-foreground"
                                        colSpan={5}
                                    >
                                        {isFiltered
                                            ? 'No suppliers match your search.'
                                            : 'No suppliers found.'}
                                    </td>
                                </tr>
                            ) : (
                                supplierRows.map((supplier) => (
                                    <tr key={supplier.id}>
                                        <td className="px-4 py-3 align-top">
                                            {supplier.image_url ? (
                                                <img
                                                    src={supplier.image_url}
                                                    alt={`${supplier.name} photo`}
                                                    className="h-12 w-12 rounded-full border border-border/70 object-cover shadow-sm"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border/70 text-[10px] uppercase tracking-wide text-muted-foreground">
                                                    No image
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="font-medium text-foreground">
                                                {supplier.name}
                                            </div>
                                            {supplier.address && (
                                                <p className="text-xs text-muted-foreground">
                                                    {supplier.address}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="text-sm text-foreground">
                                                {supplier.contact_name ?? '—'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {supplier.email ?? '—'}
                                            </div>
                                            {supplier.phone && (
                                                <div className="text-xs text-muted-foreground">
                                                    {supplier.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                                            {supplier.products_count}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`View ${supplier.name} details`}
                                                    onClick={() => setViewSupplier(supplier)}
                                                >
                                                    <Eye className="size-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Edit ${supplier.name}`}
                                                    onClick={() =>
                                                        setDialogState({
                                                            mode: 'edit',
                                                            supplier,
                                                        })
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>

                                                <Form
                                                    {...SupplierController.destroy.form({
                                                        supplier: supplier.id,
                                                    })}
                                                >
                                                    {({ processing, submit }) => (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`Delete ${supplier.name}`}
                                                            className="text-destructive hover:text-destructive"
                                                            disabled={processing}
                                                            onClick={() =>
                                                                openDeleteConfirm(
                                                                    supplier,
                                                                    submit,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    )}
                                                </Form>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {!hasRows
                                ? 'No suppliers to display.'
                                : `Showing ${paginationRange.start}-${paginationRange.end} of ${paginationRange.total} suppliers`}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    changePage(Math.max(1, currentPage - 1))
                                }
                                disabled={!hasRows || currentPage <= 1}
                            >
                                Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Page {hasRows ? currentPage : 1} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    changePage(Math.min(totalPages, currentPage + 1))
                                }
                                disabled={!hasRows || currentPage >= totalPages}
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
                                ? 'Edit supplier'
                                : 'Create supplier'}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogState?.mode === 'edit'
                                ? 'Update the supplier details.'
                                : 'Add a new supplier to your catalog.'}
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
                                        <Label htmlFor="name">Supplier name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.supplier.name
                                                    : ''
                                            }
                                            placeholder="Acme Inc."
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_name">
                                            Contact person
                                        </Label>
                                        <Input
                                            id="contact_name"
                                            name="contact_name"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.supplier
                                                          .contact_name ?? ''
                                                    : ''
                                            }
                                            placeholder="John Doe"
                                        />
                                        <InputError
                                            message={errors.contact_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.supplier.email ?? ''
                                                    : ''
                                            }
                                            placeholder="contact@example.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.supplier.phone ?? ''
                                                    : ''
                                            }
                                            placeholder="(555) 123-4567"
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="image">Supplier photo</Label>
                                        <Input
                                            id="image"
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Uploaded images are compressed to WebP automatically.
                                        </p>
                                        <InputError message={errors.image} />
                                        {dialogState?.mode === 'edit' &&
                                            dialogState.supplier.image_url && (
                                                <div className="flex items-center gap-3 rounded-md border border-border/70 bg-muted/40 p-2">
                                                    <img
                                                        src={dialogState.supplier.image_url}
                                                        alt={`${dialogState.supplier.name} current photo`}
                                                        className="h-12 w-12 rounded-full object-cover"
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        Current photo
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address</Label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            defaultValue={
                                                dialogState?.mode === 'edit'
                                                    ? dialogState.supplier
                                                          .address ?? ''
                                                    : ''
                                            }
                                            placeholder="123 Market Street, Springfield"
                                            className="min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                        <InputError message={errors.address} />
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
                                                : 'Create supplier'}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={viewSupplier !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewSupplier(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Supplier details</DialogTitle>
                        <DialogDescription>
                            Explore more information about this supplier and their contact details.
                        </DialogDescription>
                    </DialogHeader>

                    {viewSupplier && (
                        <div className="grid gap-4 text-sm">
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Photo
                                </span>
                                {viewSupplier.image_url ? (
                                    <img
                                        src={viewSupplier.image_url}
                                        alt={`${viewSupplier.name} photo`}
                                        className="h-40 w-full max-w-xs rounded-full border border-border/70 object-cover"
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
                                    {viewSupplier.name}
                                </span>
                            </div>
                            {viewSupplier.address && (
                                <div className="grid gap-1">
                                    <span className="text-xs uppercase text-muted-foreground">
                                        Address
                                    </span>
                                    <span className="text-foreground">
                                        {viewSupplier.address}
                                    </span>
                                </div>
                            )}
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Contact person
                                </span>
                                <span className="text-foreground">
                                    {viewSupplier.contact_name ?? '—'}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Email
                                </span>
                                <span className="text-foreground">
                                    {viewSupplier.email ?? '—'}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Phone
                                </span>
                                <span className="text-foreground">
                                    {viewSupplier.phone ?? '—'}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-xs uppercase text-muted-foreground">
                                    Products supplied
                                </span>
                                <span className="text-foreground">
                                    {viewSupplier.products_count}
                                </span>
                            </div>
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
