import { AllApiKeys } from "@/components/apiKeys/all-apikeys";
import { CreateApiKeyDialog } from "@/components/apiKeys/create-apikey";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

const APIKeys = () => {
    return (
        <PageLayout
            title="API Keys"
            subtitle="View And Manage Your Storix API Keys."
            rightAction={
                <CreateApiKeyDialog>
                    <Button className="pr-7!">
                        <PlusIcon />
                        Create Key
                    </Button>
                </CreateApiKeyDialog>
            }
        >
            <div className="w-full h-auto">
                <AllApiKeys />
            </div>
        </PageLayout>
    );
};

export default APIKeys;
