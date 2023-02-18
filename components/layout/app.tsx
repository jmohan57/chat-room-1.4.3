import Sidebar from "@/components/layout/Sidebar";
import clsx from "clsx";
import Head from "next/head";
import { ReactNode } from "react";
import { BreadcrumbItem } from "./Breadcrumbs";
import { Navbar } from "./Navbar";

export function AppLayout({
    title,
    items,
    children,
    breadcrumb,
}: {
    title: string;
    breadcrumb?: BreadcrumbItem[];
    items?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <>
            <Head>
                <title>Create Next App</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main
                className={clsx(
                    "grid grid-cols-1 md:grid-cols-[20rem_auto] h-screen text-accent-900 bg-light-100",
                    "dark:text-accent-50 dark:bg-dark-900"
                )}
            >
                <Sidebar />
                <div className="flex flex-row overflow-y-auto">
                    <div className="max-w-screen-2xl mx-auto flex-1 flex flex-col p-4 pb-0">
                        <Navbar title={title} breadcrumb={breadcrumb}>
                            {items}
                        </Navbar>
                        {children}
                    </div>
                </div>
            </main>
        </>
    );
}
