import { AppLayout } from "@/components/layout/app";
import { Avatar } from "@/components/system/avatar";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../../_app";
import {
    createContext,
    ReactNode,
    RefObject,
    useContext,
    useEffect,
} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { useBottomScroll } from "@/utils/use-bottom-scroll";
import { Sendbar } from "@/components/chat/Sendbar";
import { useDirectMessageHandlers } from "@/utils/handlers/ably";
import { Spinner } from "@/components/system/spinner";
import { DirectMessageItem } from "@/components/chat/DirectMessageItem";
import { skeleton } from "@/components/system/skeleton";

type Params = {
    user: string;
};

const ViewContext = createContext<
    | {
          viewRef: RefObject<HTMLDivElement>;
          scrollToBottom: () => void;
      }
    | undefined
>(undefined);

const DMPage: NextPageWithLayout = () => {
    const { user } = useRouter().query as Params;
    const { status } = useSession();
    const { scrollToBottom, viewRef } = useContext(ViewContext)!!;
    const variables = {
        userId: user,
        count: 30,
        cursorType: "before",
    } as const;

    useDirectMessageHandlers(variables);
    const query = trpc.dm.messages.useInfiniteQuery(variables, {
        enabled: status === "authenticated",
        staleTime: Infinity,
        getPreviousPageParam: (messages) =>
            messages.length != 0
                ? messages[messages.length - 1].timestamp
                : null,
    });

    const pages = query.data?.pages;
    const [sentryRef, { rootRef }] = useInfiniteScroll({
        hasNextPage: query.hasPreviousPage ?? true,
        onLoadMore: () => {
            console.log("load more");

            return query.fetchPreviousPage();
        },
        disabled: query.isLoading,
        delayInMs: 100,
        loading: query.isFetchingPreviousPage,
        rootMargin: "20px",
    });

    useEffect(() => {
        rootRef(viewRef.current);
    }, [rootRef, viewRef]);

    useEffect(() => {
        scrollToBottom();
    }, [pages, scrollToBottom]);

    return (
        <>
            <div className="flex flex-col gap-3 mb-8">
                {query.isLoading || query.hasPreviousPage ? (
                    <div ref={sentryRef} className="flex flex-col m-auto">
                        <Spinner size="large" />
                    </div>
                ) : (
                    <Welcome />
                )}
                {pages?.map((messages, i) => (
                    <div
                        key={messages[0]?.id ?? `undefined-${i}`}
                        className="flex flex-col-reverse gap-3"
                    >
                        {messages.map((message) => (
                            <DirectMessageItem
                                key={message.id}
                                message={message}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <DMSendbar />
        </>
    );
};

function DMSendbar() {
    const { user } = useRouter().query as Params;
    const sendMutation = trpc.dm.send.useMutation();

    return (
        <Sendbar
            isLoading={sendMutation.isLoading}
            onSend={({ content }) =>
                sendMutation.mutateAsync({
                    userId: user,
                    message: content,
                })
            }
        />
    );
}

function Welcome() {
    const { user } = useRouter().query as Params;
    const { status } = useSession();
    const query = trpc.dm.info.useQuery(
        { userId: user },
        { enabled: status === "authenticated" }
    );

    const data = query.data;
    return (
        <div className="flex flex-col gap-3 mb-10">
            <Avatar src={data?.image} fallback={data?.name} size="large" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {data?.name ?? (
                    <span
                        className={skeleton({ className: "w-40 h-[40px]" })}
                    />
                )}
            </h1>
            <p className="text-accent-800 dark:text-accent-600 text-lg">
                Start your conversations with{" "}
                {data?.name ?? (
                    <span
                        className={skeleton({
                            className: "align-middle",
                        })}
                    />
                )}
            </p>
        </div>
    );
}

function Body({ children }: { children: ReactNode }) {
    const { handleRootScroll, scrollableRootRef, scrollToBottom } =
        useBottomScroll();

    return (
        <ViewContext.Provider
            value={{ scrollToBottom, viewRef: scrollableRootRef }}
        >
            <div
                className="overflow-y-auto"
                ref={scrollableRootRef}
                onScroll={handleRootScroll}
            >
                {children}
            </div>
        </ViewContext.Provider>
    );
}

function BreadcrumbItem() {
    const { user } = useRouter().query as Params;
    const { status } = useSession();
    const query = trpc.dm.info.useQuery(
        { userId: user },
        { enabled: status === "authenticated" }
    );

    return query.data == null ? (
        <div className={skeleton()} />
    ) : (
        <div className="flex flex-row gap-2 items-center">
            <Avatar
                src={query.data.image}
                fallback={query.data.name}
                size="small"
            />
            <span>{query.data.name}</span>
        </div>
    );
}

DMPage.useLayout = (c) => {
    const router = useRouter();

    return (
        <AppLayout
            layout={Body}
            breadcrumb={[
                {
                    text: <BreadcrumbItem />,
                    href: router.asPath,
                },
            ]}
        >
            {c}
        </AppLayout>
    );
};
export default DMPage;