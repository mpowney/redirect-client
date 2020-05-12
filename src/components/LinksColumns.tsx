import * as React from "react";
import { IColumn } from "office-ui-fabric-react/lib/DetailsList";
import { Shimmer } from "office-ui-fabric-react/lib/Shimmer";

import ISortingInformation from "../common/utils/ISortingInformation";
import { ILink } from "../entries/Links"

export default class LinksColumns {
    public Columns(
        onColumnClick: any,
        sorting: ISortingInformation[],
        isLoading: boolean
    ): IColumn[] {

        const { DateTime } = require("luxon");

        let columns = [
            {
                key: `rowKey`,
                name: "Short name",
                fieldName: "rowKey",
                minWidth: 40,
                maxWidth: 100,
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
                key: `redirectTo`,
                name: "Redirect to",
                fieldName: "redirectTo",
                minWidth: 100,
                maxWidth: 240,
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
                key: `created`,
                name: "Date created",
                fieldName: "created",
                minWidth: 80,
                maxWidth: 140,
                isResizable: true,
                sortAscendingAriaLabel: "Sorted earliest to latest",
                sortDescendingAriaLabel: "Sorted latest to earliest",
                isCollapsible: true,
                data: "string",
                onColumnClick: (event: any, column: any) => {
                    onColumnClick(event, column);
                },
                onRender: (item: ILink) => {
                    return isLoading ? <Shimmer width={`${70 + Math.floor(Math.random() * 10)}%`} /> : <>{DateTime.fromISO(item.created).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}</>;
                },
                isPadded: true
            },
            {
                key: `clickCount`,
                name: "Clicks",
                fieldName: "clickCount",
                minWidth: 40,
                maxWidth: 60,
                isResizable: true,
                sortAscendingAriaLabel: "Sorted lowest to highest",
                sortDescendingAriaLabel: "Sorted highest to lowest",
                isCollapsible: true,
                data: "number",
                onColumnClick: (event: any, column: any) => {
                    onColumnClick(event, column);
                },
                onRender: (item: ILink) => {
                    return isLoading ? <Shimmer width={`${70 + Math.floor(Math.random() * 10)}%`} /> : <>{item.clickCount}</>;
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
