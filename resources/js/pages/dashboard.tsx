import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as productsIndex } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Package, PackageOpen, Truck } from 'lucide-react';

type SupplierSummary = {
    id: string;
    name: string;
};

type ProductSummary = {
    id: string;
    name: string;
    sku: string;
    stock: number;
    supplier: SupplierSummary | null;
    created_at?: string | null;
};

type DashboardStats = {
    totalProducts: number;
    totalSuppliers: number;
};

type DashboardPageProps = {
    stats: DashboardStats;
    lowStockProducts: ProductSummary[];
    recentProducts: ProductSummary[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const numberFormatter = new Intl.NumberFormat('id-ID');
const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });
const LOW_STOCK_THRESHOLD = 10;

const formatStock = (stock: number) => numberFormatter.format(stock);

const formatDate = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }

    return dateFormatter.format(parsed);
};

export default function Dashboard({
    stats,
    lowStockProducts,
    recentProducts,
}: DashboardPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Total Produk</span>
                                <Package className="size-6 text-muted-foreground" aria-hidden />
                            </div>
                            <p className="text-3xl font-semibold tracking-tight">
                                {formatStock(stats.totalProducts)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Total Supplier</span>
                                <Truck className="size-6 text-muted-foreground" aria-hidden />
                            </div>
                            <p className="text-3xl font-semibold tracking-tight">
                                {formatStock(stats.totalSuppliers)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="hidden xl:flex">
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Produk Terbaru</span>
                                <PackageOpen className="size-6 text-muted-foreground" aria-hidden />
                            </div>
                            <p className="text-3xl font-semibold tracking-tight">
                                {formatStock(recentProducts.length)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Daftar 5 produk terbaru dapat dilihat di bawah.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid flex-1 gap-4 lg:grid-cols-2">
                    <Card className="h-full">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-lg font-semibold">Produk Hampir Habis</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Menampilkan 5 produk dengan stok terendah.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-0">
                            {lowStockProducts.length === 0 ? (
                                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Belum ada data produk untuk ditampilkan.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {lowStockProducts.map((product) => (
                                        <li
                                            key={product.id}
                                            className="rounded-lg border border-border/70 bg-muted/30 p-4 dark:border-border"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="truncate text-sm font-semibold">{product.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">SKU: {product.sku}</p>
                                                    {product.supplier ? (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            Supplier: {product.supplier.name}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <Badge
                                                    variant={
                                                        product.stock <= LOW_STOCK_THRESHOLD
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    Stok: {formatStock(product.stock)}
                                                </Badge>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                        <CardFooter className="w-full justify-end pt-0">
                            <Link
                                href={productsIndex().url}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Lihat semua produk
                            </Link>
                        </CardFooter>
                    </Card>

                    <Card className="h-full">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-lg font-semibold">Produk Terbaru</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Pembaruan terbaru dari produk yang baru ditambahkan.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-0">
                            {recentProducts.length === 0 ? (
                                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Belum ada produk yang ditambahkan.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {recentProducts.map((product) => (
                                        <li
                                            key={product.id}
                                            className="rounded-lg border border-border/70 bg-muted/30 p-4 dark:border-border"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 space-y-1">
                                                    <p className="truncate text-sm font-semibold">{product.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">SKU: {product.sku}</p>
                                                    {product.supplier ? (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            Supplier: {product.supplier.name}
                                                        </p>
                                                    ) : null}
                                                    <p className="text-xs text-muted-foreground">
                                                        Ditambahkan: {formatDate(product.created_at)}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary">
                                                    Stok: {formatStock(product.stock)}
                                                </Badge>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                        <CardFooter className="w-full justify-end pt-0">
                            <Link
                                href={productsIndex().url}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Kelola produk
                            </Link>
                        </CardFooter>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
