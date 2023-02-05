import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import { AppLayout } from "@/components/layout/app";
import { gql } from "@/gql";
import {
    GetBookQuery,
    GetBookQueryVariables,
    OnChatSubscription,
    OnChatSubscriptionVariables,
} from "@/gql/generated/graphql";
import { useQuery, useSubscription } from "@apollo/client";
import { PlusIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { NextPageWithLayout } from "./_app";

const GET_BOOK = gql(/* GraphQL */ `
    query getBook {
        book
    }
`);

const CHAT_SUBSCRIPTION = gql(/* GraphQL */ `
    subscription onChat {
        counter
    }
`);

const Home: NextPageWithLayout = () => {
    const { data, loading, subscribeToMore } = useQuery<
        GetBookQuery,
        GetBookQueryVariables
    >(GET_BOOK);

    return (
        <>
            <h1 className="text-4xl font-bold">Recent Chat</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                <ChatItem />
                <ChatItem />
                <ChatItem />
                <ChatItem />
            </div>
            <div className="md:hidden fixed bottom-6 right-6">
                <IconButton aria-label="Create Group">
                    <PlusIcon className="w-7 h-7" />
                </IconButton>
            </div>
        </>
    );
};

function ChatItem() {
    const user = useSession().data?.user;

    if (user == null) return <></>;

    return (
        <div
            className={clsx(
                "rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-row gap-2",
                "shadow-2xl dark:shadow-none shadow-brand-500/10"
            )}
        >
            <Avatar
                alt="avatar"
                src={user.image ?? undefined}
                fallback={user.name ?? undefined}
            />
            <div>
                <p className="font-semibold text-base">SonMooSans</p>
                <p className="text-accent-700 dark:text-accent-600 text-sm">
                    Sleeping
                </p>
            </div>
        </div>
    );
}

Home.getLayout = (children) => (
    <AppLayout
        title="Home"
        items={
            <>
                <Button variant="primary">Create Group</Button>
            </>
        }
    >
        {children}
    </AppLayout>
);

function Counter() {
    const { data, loading } = useSubscription<
        OnChatSubscription,
        OnChatSubscriptionVariables
    >(CHAT_SUBSCRIPTION);

    return <p>{data?.counter}</p>;
}

export default Home;
