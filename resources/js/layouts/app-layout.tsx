import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'
import { type BreadcrumbItem, type PageProps} from '@/types'
import { type ReactNode, use, useRef, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { Toaster, toast } from 'sonner'

interface AppLayoutProps {
    children: ReactNode
    breadcrumbs?: BreadcrumbItem[]
}
export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const {flash} = usePage<PageProps>().props;
    const lastFlashRef = useRef<string | null>(null);
    useEffect(() => {
        if (flash?.success && flash.success !== lastFlashRef.current) {
            toast.success(flash.success)
            lastFlashRef.current = flash.success
        }
        if (flash?.error && flash.error !== lastFlashRef.current) {
            toast.error(flash.error)
            lastFlashRef.current = flash.error
        }
        if (flash?.warning && flash.warning !== lastFlashRef.current) {
            toast.warning(flash.warning)
            lastFlashRef.current = flash.warning
        }
    }, [flash])
    return (
        <>
            <Toaster position='top-right' richColors />
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>

        </>
    )
}

/* export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayoutTemplate>
); */
