import { useGroupLayout } from "@/components/layout/group";
import { NextPageWithLayout } from "@/pages/_app";
import { useRouter } from "next/router";
import { getQuery } from ".";
import { Invite } from "@/components/chat/settings/invite";
import { Danger } from "@/components/chat/settings/danger";
import { Info } from "@/components/chat/settings/info";
import { useIsGroupAdmin } from "@/utils/trpc/is-group-admin";
import { Spinner } from "@/components/system/spinner";

const Settings: NextPageWithLayout = () => {
    const router = useRouter();
    const { groupId } = getQuery(router);
    const isAdmin = useIsGroupAdmin({ groupId });

    return (
        <div className="flex flex-col gap-10 max-w-3xl">
            {isAdmin.loading ? (
                <Spinner size="large" />
            ) : (
                <>
                    <Info group={groupId} />
                    {isAdmin.value && <Invite group={groupId} />}
                    {isAdmin.value && <Danger group={groupId} />}
                </>
            )}
        </div>
    );
};

Settings.useLayout = (children) =>
    useGroupLayout((group) => ({
        title: "Settings",
        breadcrumb: [{ href: `/chat/${group}/settings`, text: "Settings" }],
        children,
    }));
export default Settings;
