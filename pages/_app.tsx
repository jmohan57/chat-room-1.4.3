import { trpc } from "@/utils/trpc";
import { ThemeProvider } from "next-themes";
import { SessionProvider, useSession } from "next-auth/react";
import type { AppProps } from "next/app";
import { ReactElement, useEffect } from "react";
import { NextPage } from "next";
import { configureAbly } from "@ably-labs/react-hooks";

import "cropperjs/dist/cropper.css";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/system/toast";
import { channels } from "@/utils/ably";
import { useBaseHandlers } from "@/utils/handlers/base";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    useLayout?: (page: ReactElement) => ReactElement;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

const prefix = process.env.API_ROOT || "";
const ably = configureAbly({
    authUrl: `${prefix}/api/ably/auth`,
    autoConnect: false,
});
ably.connection.on("connected", () => console.log("Ably Client connected"));
ably.connection.on("closed", () => console.log("Ably Client disconnected"));

function Connect() {
    const { status, data } = useSession();

    useEffect(() => {
        const connected = ably.connection.state === "connected";

        if (!connected && status === "authenticated") {
            ably.connect();
        }

        if (connected && status === "unauthenticated") {
            ably.close();
        }
    }, [status]);

    const handlers = useBaseHandlers();

    channels.private.useChannel(
        [data?.user?.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        (message) => {
            const self = ably.connection.id === message.connectionId;

            switch (message.name) {
                case "group_created": {
                    if (self) return;

                    handlers.createGroup(message.data);
                }
                case "group_updated": {
                    if (self) return;

                    handlers.updateGroup(message.data);
                }
            }
        }
    );

    return <></>;
}

function App({
    Component,
    pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
    return (
        <SessionProvider session={session}>
            <Connect />
            <ToastProvider />
            <ThemeProvider attribute="class" disableTransitionOnChange>
                <Content Component={Component} pageProps={pageProps} />
            </ThemeProvider>
        </SessionProvider>
    );
}

function Content({
    Component,
    pageProps,
}: Pick<AppPropsWithLayout, "Component" | "pageProps">) {
    const useLayout = Component.useLayout ?? ((page) => page);
    const layout = useLayout(<Component {...pageProps} />);

    return layout;
}

export default trpc.withTRPC(App);
