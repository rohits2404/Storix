import { DataTable } from "@/components/data-table";
import type { FileType } from "@/features/files/filesType";
import type { RowSelectionState } from "@tanstack/react-table";
import { useMemo } from "react";
import { listColumns } from "./column";

type Props = {
    data: FileType[];
    selectedFiles: FileType[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<FileType[]>>;
    isShowPagination: boolean;
    pagination: {
        totalCount: number;
        totalPages: number;
        pageNumber: number;
        pageSize: number;
    };
    isLoading: boolean;
    setPagination: React.Dispatch<
        React.SetStateAction<{
            pageNumber: number;
            pageSize: number;
        }>
    >;
};

export const ListView = (props: Props) => {
    const {
        data,
        isShowPagination = false,
        pagination,
        setPagination,
        selectedFiles,
        setSelectedFiles,
        isLoading,
    } = props;

    const rowSelection = useMemo(() => {
        const state: Record<string, boolean> = {};
        selectedFiles.forEach((file) => {
            state[file._id] = true;
        });
        return state;
    }, [selectedFiles]);

    const handlePageChange = (pageNumber: number) => {
        setPagination((prev) => ({ ...prev, pageNumber }));
    };

    const handlePageSizeChange = (pageSize: number) => {
        setPagination((prev) => ({ ...prev, pageSize }));
    };

    const handleRowSelectionChange = (
        updater:
            RowSelectionState | ((old: RowSelectionState) => RowSelectionState),
    ) => {
        const nextState =
            typeof updater === "function" ? updater(rowSelection) : updater;
        const selectedIds = Object.keys(nextState).filter(
            (key) => nextState[key],
        );
        const selectedObjects = data.filter((file: FileType) =>
            selectedIds.includes(file?._id),
        );
        setSelectedFiles(selectedObjects);
    };

    return (
        <div>
            <DataTable
                columns={listColumns || []}
                data={data || []}
                isLoading={isLoading}
                showSearch={false}
                selection={true}
                isShowPagination={isShowPagination}
                pagination={pagination}
                rowSelection={rowSelection}
                onRowSelectionChange={handleRowSelectionChange}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
};
