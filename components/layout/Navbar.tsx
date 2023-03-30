import { usePageStore } from "@/utils/stores/page";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { BreadcrumbItem, Breadcrumbs } from "./Breadcrumbs";

export function Navbar({
    children,
    breadcrumb,
}: {
    breadcrumb?: BreadcrumbItem[];
    children?: ReactNode;
}) {
    const router = useRouter();
    const breadcrumbItems = useMemo(() => {
        if (breadcrumb != null) return breadcrumb;

        const nodes = router.route.split("/").filter((v) => v.length > 0);

        return nodes.map((subpath, idx) => {
            const href = "/" + nodes.slice(0, idx + 1).join("/");

            return {
                href,
                text: subpath.slice(0, 1).toUpperCase() + subpath.slice(1),
            };
        });
    }, [breadcrumb, router.route]);
    const [setSidebarOpen] = usePageStore((v) => [v.setSidebarOpen]);

    //backdrop filter will break the `fixed` position in children elements
    return (
        <div className="sticky top-0 z-10 bg-light-100/50 dark:bg-dark-900/50 before:backdrop-blur-lg before:absolute before:inset-0 before:-z-[1]">
            <div className="flex flex-row gap-2 max-w-screen-2xl px-4 py-2 mx-auto min-h-[52px]">
                <button
                    className="md:hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <HamburgerMenuIcon className="w-6 h-6" />
                </button>
                <Breadcrumbs items={breadcrumbItems} />
                <div className="ml-auto" />
                <div className="flex flex-row gap-2 items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
