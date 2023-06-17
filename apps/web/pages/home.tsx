import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { AppLayout, Content } from "@/components/layout/app";
import { trpc } from "@/utils/trpc";
import { groupIcon } from "shared/media/format";
import clsx from "clsx";
import { NextPageWithLayout } from "./_app";
import Link from "next/link";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { GroupWithNotifications, DMChannel } from "@/utils/types";
import { Spinner } from "ui/components/spinner";
import { BoxIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { DirectMessageContextMenu } from "@/components/menu/DirectMessageMenu";
import { useRouter } from "next/router";
import { Navbar } from "@/components/layout/Navbar";
import { tv } from "tailwind-variants";

const BoardingModal = dynamic(() => import("@/components/modal/BoardingModal"));
const CreateGroupModal = dynamic(
    () => import("@/components/modal/CreateGroupModal")
);
const JoinGroupModal = dynamic(
    () => import("@/components/modal/JoinGroupModal")
);

type Modal = "create-group" | "join-group" | "boarding";

function Modals({
    modal,
    setModal,
}: {
    modal?: Modal;
    setModal: (v?: Modal) => void;
}) {
    if (modal === "create-group")
        return (
            <CreateGroupModal
                open
                setOpen={(open) => setModal(open ? "create-group" : undefined)}
            />
        );
    if (modal === "join-group")
        return (
            <JoinGroupModal
                open
                setOpen={(open) => setModal(open ? "join-group" : undefined)}
            />
        );

    if (modal === "boarding")
        return <BoardingModal onCreateGroup={() => setModal("create-group")} />;

    return <></>;
}

const Home: NextPageWithLayout = () => {
    const router = useRouter();
    const [modal, setModal] = useState<Modal>();
    const { modal: initialModal } = router.query;

    useEffect(() => {
        if (initialModal === "new") {
            router.replace("/home", undefined, { shallow: true }).then(() => {
                setModal("boarding");
            });
        }
    }, [initialModal, router, setModal]);

    const dmQuery = trpc.dm.channels.useQuery(undefined, {
        enabled: false,
    });
    const groups = trpc.group.all.useQuery(undefined, {
        enabled: false,
    });

    const onRetry = () => {
        dmQuery.refetch();
        groups.refetch();
    };

    return (
        <>
            <Modals modal={modal} setModal={setModal} />
            <h1 className="text-4xl font-bold">Recent Chat</h1>
            <div className="flex flex-row gap-3 mt-3">
                <Button
                    color="primary"
                    onClick={() => setModal("create-group")}
                >
                    Create Group
                </Button>
                <Button onClick={() => setModal("join-group")}>
                    Join Group
                </Button>
            </div>

            {dmQuery.isLoading || groups.isLoading ? (
                <div className="m-auto">
                    <Spinner size="large" />
                </div>
            ) : dmQuery.isError || groups.isError ? (
                <div className="m-auto flex flex-col gap-3">
                    <h2 className="font-semibold text-lg text-foreground">
                        Failed to fetch info
                    </h2>
                    <Button color="danger" size="medium" onClick={onRetry}>
                        Retry
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mt-6">
                        {dmQuery.data.map((chat) => (
                            <ChatItem key={chat.id} chat={chat} />
                        ))}
                    </div>
                    <h1 className="text-lg font-semibold mt-6">Chat Groups</h1>
                    {groups.data.length === 0 ? (
                        <Placeholder />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-6 ">
                            {groups.data.map((group) => (
                                <GroupItem key={group.id} group={group} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

const card = tv({
    base: [
        "relative rounded-xl bg-card p-4 flex flex-row gap-3 transition duration-100 hover:bg-accent/50",
        "shadow-2xl shadow-brand-500/10 dark:shadow-none",
    ],
});

function GroupItem({ group }: { group: GroupWithNotifications }) {
    return (
        <Link href={`/chat/${group.id}`} className={card()}>
            <Avatar
                src={groupIcon.url([group.id], group.icon_hash)}
                fallback={group.name}
            />
            <div className="w-0 flex-1">
                <p className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                    {group.name}
                </p>
                <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                    {group.last_message?.content}
                </p>
            </div>

            {group.unread_messages > 0 && (
                <p className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {group.unread_messages}
                </p>
            )}
        </Link>
    );
}

function ChatItem({ chat }: { chat: DMChannel }) {
    const user = chat.user;

    return (
        <DirectMessageContextMenu channelId={chat.id}>
            <Link href={`/dm/${chat.id}`} className={card()}>
                <Avatar src={user.image} fallback={user.name} />
                <div className="flex-1 w-0">
                    <p className="text-base font-medium text-foreground">
                        {user.name}
                    </p>
                    <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {chat.last_message?.content}
                    </p>
                </div>
                {chat.unread_messages > 0 && (
                    <p className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {chat.unread_messages}
                    </p>
                )}
            </Link>
        </DirectMessageContextMenu>
    );
}

function Placeholder() {
    return (
        <div className="flex flex-col items-center justify-center my-auto">
            <BoxIcon className="w-20 h-20 text-brand-500 dark:text-brand-400 max-md:hidden" />
            <p className="font-medium text-base text-foreground">
                Nothing here
            </p>
            <p className="text-muted-foreground text-sm">
                Try to find someone chat with you?
            </p>
        </div>
    );
}

Home.useLayout = (children) => (
    <AppLayout>
        <Navbar
            breadcrumb={[
                {
                    href: "/home",
                    text: "Home",
                },
            ]}
        >
            <div className="max-sm:hidden flex flex-row gap-3">
                <ThemeSwitch />
            </div>
        </Navbar>

        <Content>{children}</Content>
    </AppLayout>
);

export default Home;
