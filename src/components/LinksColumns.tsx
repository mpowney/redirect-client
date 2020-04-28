import * as React from "react";
import { IColumn } from "office-ui-fabric-react/lib/DetailsList";
import { Shimmer } from "office-ui-fabric-react/lib/Shimmer";

import ISortingInformation from "common/utils/ISortingInformation";
import { ILink } from "../entries/Links"

export default class LinksColumns {
    public Columns(
        onColumnClick: any,
        sorting: ISortingInformation[],
        isLoading: boolean
    ): IColumn[] {
        let columns = [
            {
                key: `column1`,
                name: "Short name",
                fieldName: "RowKey",
                minWidth: 100,
                maxWidth: 200,
                isRowHeader: true,
                isResizable: true,
                sortAscendingAriaLabel: "Sorted A to Z",
                sortDescendingAriaLabel: "Sorted Z to A",
                data: "string",
                onColumnClick: (event: any, column: any) => {
                    onColumnClick(event, column);
                },
                onRender: (item: ILink) => {
                    return isLoading ? (
                        <Shimmer width={`${60 + Math.floor(Math.random() * 20)}%`} />
                    ) : (
                        <>{item.rowKey}</>
                    );
                },
                isPadded: true
            },
            {
                key: `column2`,
                name: "Redirect to",
                fieldName: "RediectTo",
                minWidth: 90,
                maxWidth: 150,
                isResizable: true,
                sortAscendingAriaLabel: "Sorted A to Z",
                sortDescendingAriaLabel: "Sorted Z to A",
                data: "string",
                onColumnClick: (event: any, column: any) => {
                    onColumnClick(event, column);
                },
                onRender: (item: ILink) => {
                    return isLoading ? (
                        <Shimmer width={`${50 + Math.floor(Math.random() * 10)}%`} />
                    ) : (
                        <>{item.redirectTo}</>
                    );
                },
                isPadded: true
            },
            {
                key: `column3`,
                name: "Date created",
                fieldName: "Created",
                minWidth: 120,
                maxWidth: 240,
                isResizable: true,
                isCollapsible: true,
                data: "string",
                onColumnClick: (event: any, column: any) => {
                    onColumnClick(event, column);
                },
                onRender: (item: ILink) => {
                    return isLoading ? <Shimmer width={`${70 + Math.floor(Math.random() * 10)}%`} /> : <>{item.created}</>;
                },
                isPadded: true
            }
        ];

        return columns.map(column => {
            const sortField = sorting.filter(sort => {
                return sort.fieldName === column.fieldName;
            });
            if (sortField.length > 0) {
                return { ...column, ...sortField[0] };
            } else {
                return { ...column };
            }
        });
    }
}
