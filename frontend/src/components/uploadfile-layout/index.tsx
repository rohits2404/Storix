import { LAYOUT_VIEW, type LayoutViewType } from "@/constants";
import {
    useDeleteFilesMutation,
    useDownloadFilesMutation,
    useGetAllFilesQuery,
} from "@/features/files/filesAPI";
import type { FileType } from "@/features/files/filesType";
import { useDebouncedSearch } from "@/hooks/use-debounce-search";
import { useState } from "react";
import { toast } from "sonner";
import { ToolBar } from "./toolbar";
import { ListView } from "./list-view/list-view";
import { GridView } from "./grid-view/grid-view";

type Props = {
    layoutView: LayoutViewType;
    isShowPagination: boolean;
    showToolBar: boolean;
    pageSize?: number;
};

export const UploadFileLayout = (props: Props) => {
    const {
        layoutView = LAYOUT_VIEW.GRID,
        isShowPagination,
        showToolBar = true,
    } = props;

    const [filter, setFilter] = useState({
        pageNumber: 1,
        pageSize: props.pageSize || 10,
    });

    const [_layoutView, setLayoutView] = useState<LayoutViewType>(layoutView);
    const [selectedFiles, setSelectedFiles] = useState<FileType[]>([]);

    const { debouncedTerm, searchTerm, setSearchTerm } = useDebouncedSearch(
        "",
        {
            delay: 500,
        },
    );

    const [downloadFiles, { isLoading: isDownloading }] =
        useDownloadFilesMutation();
    const [deleteFiles, { isLoading: isDeleting }] = useDeleteFilesMutation();

    const { data, isLoading, isFetching } = useGetAllFilesQuery({
        keyword: debouncedTerm,
        pageNumber: filter.pageNumber,
        pageSize: filter.pageSize,
    });

    const fileData = data?.files || [];

    const pagination = {
        totalCount: data?.pagination.totalCount || 0,
        totalPages: data?.pagination.totalPages || 0,
        pageNumber: filter.pageNumber,
        pageSize: filter.pageSize,
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
    };

    const handleLayoutView = (view: LayoutViewType) => {
        setLayoutView(view);
    };

    const handleToggleSelected = (file: FileType) => {
        const isSelected = selectedFiles.find((f) => f._id === file._id);
        if (isSelected) {
            setSelectedFiles((prev) => prev.filter((f) => f._id !== file._id));
        } else {
            setSelectedFiles((prev) => [...prev, file]);
        }
    };

    const handleClear = () => {
        setSelectedFiles([]);
    };

    const handleCopy = () => {
        const urls = selectedFiles
            .map((file) => {
                return `${import.meta.env.VITE_BASE_API_URL}/files/${file._id}/view`;
            })
            .join("\n");
        navigator.clipboard
            .writeText(urls)
            .then(() => {
                setSelectedFiles([]);
                toast.success(`Copied ${selectedFiles.length} File Url `);
            })
            .catch(() => {
                toast.error("Failed To Copy Links");
            });
    };

    const handleDelete = () => {
        if (isDeleting) return;
        const fileIds = selectedFiles?.map((file) => file._id);
        if (!fileIds.length) {
            toast.error("No File Selected");
            return;
        }

        const toastId = toast.loading(
            `Deleting ${fileIds.length} Selected File(s)...`,
        );
        deleteFiles(fileIds)
            .unwrap()
            .then((res) => {
                toast.dismiss(toastId);
                if (res.failedCount > 0) {
                    toast.warning(
                        `Deleted ${res.deletedCount} File(s). ${res.failedCount} Failed.`,
                        { description: "Some Files Could Not Be Deleted." },
                    );
                } else {
                    toast.success(
                        `Successfully Deleted ${res.deletedCount} File(s).`,
                    );
                }
                setSelectedFiles([]);
            })
            .catch(() => {
                toast.dismiss(toastId);
                toast.error("Failed To Delete Files. Please Try Again.");
            });
    };

    const handleDowload = () => {
        if (isDownloading) return;
        const fileIds = selectedFiles?.map((file) => file._id);
        if (!fileIds.length) {
            toast.error("No File Selected");
            return;
        }

        const toastId = toast.loading("Preparing Your Download...", {
            duration: Infinity,
        });

        downloadFiles(fileIds)
            .unwrap()
            .then((res) => {
                toast.dismiss(toastId);
                if (res.downloadUrl) {
                    const link = document.createElement("a");
                    link.href = res.downloadUrl;
                    link.download = "";
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    const message = res.isZip
                        ? "Zip File Is Downloading..."
                        : "Your File Is Downloading...";

                    toast.success(
                        <>
                            {message}
                            <br />
                            If It Doesn't Start,{" "}
                            <a
                                href={res.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-black!"
                            >
                                Click Here
                            </a>
                        </>,
                    );
                } else {
                    toast.error("Download URL Missing");
                }
            })
            .catch(() => {
                toast.dismiss(toastId);
                toast.error("Download Failed Try Again");
            })
            .finally(() => {
                setSelectedFiles([]);
            });
    };

    return (
        <div>
            {showToolBar && (
                <ToolBar
                    layoutView={_layoutView}
                    searchTerm={searchTerm}
                    isLoading={false}
                    isSelected={selectedFiles?.length > 0 || false}
                    noOfFileselected={selectedFiles?.length}
                    handleSearch={handleSearch}
                    handleLayoutView={handleLayoutView}
                    onClear={handleClear}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onDownload={handleDowload}
                />
            )}
            <div className="mt-1">
                {_layoutView === LAYOUT_VIEW.LIST ? (
                    <ListView
                        data={fileData}
                        isLoading={isLoading}
                        selectedFiles={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        isShowPagination={isShowPagination}
                        pagination={pagination}
                        setPagination={setFilter}
                    />
                ) : (
                    <GridView
                        data={fileData}
                        isLoading={isFetching}
                        selectedFiles={selectedFiles}
                        onToggleSelect={handleToggleSelected}
                    />
                )}
            </div>
        </div>
    );
};
