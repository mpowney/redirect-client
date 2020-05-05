import * as React from "react";
import DocumentMeta from "react-document-meta";

import { CommandBar } from "office-ui-fabric-react/lib/CommandBar";
import { SearchBox } from "office-ui-fabric-react/lib/SearchBox";
import { Modal, IDragOptions } from "office-ui-fabric-react/lib/Modal";

import Navigation from "../components/Navigation";
import Header from "../components/Header";
import Link from "./Link";
import { LogFactory } from "../common/utils/InitLogger";
import LinksColumns from "../components/LinksColumns";
import ISortingInformation from "../common/utils/ISortingInformation";
import { IColumn, SelectionMode, DetailsListLayoutMode, DetailsList, ISelection } from "office-ui-fabric-react/lib/DetailsList";
import { IUser } from "../App";
import ApiHelper from "../common/utils/ApiHelper";
import { Panel } from "office-ui-fabric-react/lib/Panel";
import { IconButton } from "office-ui-fabric-react/lib/Button";
import { ContextualMenu } from "office-ui-fabric-react/lib/ContextualMenu";
import { AddLink } from "../components/AddLink";

const log = LogFactory.getLogger("Links.tsx");
const styles = require("../assets/styles/entries/Links.module.scss");
const meta = {
    title: "Links",
    description: "",
    meta: {
        charset: "utf-8",
        name: {
            keywords: "Links"
        }
    }
};

export interface ILink {
    timestamp: Date;
    partitionKey: string;
    rowKey: string;
    redirectTo: string;
    clickCount?: number;
    geoCount?: any;
    created: Date;
}

interface ILinksProps {
    user: IUser;
    recycled: boolean;
}
interface ILinksPersistedState {
    LinksSorting: ISortingInformation[];
    LinksSearch: string;
}
interface ILinksState extends ILinksPersistedState {
    LinksLoading: boolean;
    ShowLink: ILink | undefined;
    LinksSourceData: ILink[];
    LinksSearchData?: ILink[];
    isAddModalOpen: boolean;
}

export default class LinksEntry extends React.Component<ILinksProps, ILinksState> {
    static STORE_CLASSES = [];
    
    constructor(props: ILinksProps) {
        super(props);

        this.linksColumnClick = this.linksColumnClick.bind(this);
        this.dismissLinkPanel = this.dismissLinkPanel.bind(this);
        this.linkClick = this.linkClick.bind(this);
        this.closeAddModalClick = this.closeAddModalClick.bind(this);
        this.addButtonClick = this.addButtonClick.bind(this);
        this.initLinks = this.initLinks.bind(this);

        const dummyLink: ILink = {
            timestamp: new Date(),
            partitionKey: "dummy",
            rowKey: "dummy",
            redirectTo: "dummy",
            created: new Date()
        };

        this.state = {
            isAddModalOpen: false,
            LinksSorting: [],
            LinksLoading: true,
            LinksSearch: "",
            ShowLink: undefined,
            LinksSourceData: [
                dummyLink, dummyLink, dummyLink, dummyLink, dummyLink
            ]
        };
    }

    private _selection: ISelection | undefined;
    private _getKey(item: any/*, index?: number*/): string {
        // log.debug(`_getKey() executed with item ${JSON.stringify(item)} and index ${index}`);
        return item.key;
    }

    private renderSearchBox() {
        return (<SearchBox
            styles={{ root: { marginTop: 4, width: 180 } }}
            placeholder="Search"
            onSearch={(newValue: any) => log.debug(`Search with value ${newValue}`)}
            onFocus={() => log.debug("Search onFocus called")}
            onBlur={() => log.debug("Search onBlur called")}
            onChange={() => log.debug("Search onChange called")}
          />);
    }

    private linksColumnClick = (
        ev: React.MouseEvent<HTMLElement>,
        column: IColumn
    ): void => {
        log.debug(
            `linksColumnClick() executed with column ${JSON.stringify(
                column
            )}, event target ${JSON.stringify(ev.pageY)}`
        );

        const currentSorting: ISortingInformation[] = this.state.LinksSorting;
        let newSorting: (ISortingInformation | undefined)[] = [];
        if (
            currentSorting.filter(currentSort => {
                return currentSort.fieldName === column.fieldName;
            }).length > 0
        ) {
            newSorting = currentSorting.map(currentSortingColumn => {
                if (currentSortingColumn.fieldName === column.fieldName) {
                    if (currentSortingColumn.isSortedDescending) {
                        return undefined;
                    } else {
                        return {
                            fieldName: currentSortingColumn.fieldName,
                            isSorted: true,
                            isSortedDescending: !currentSortingColumn.isSortedDescending
                        };
                    }
                } else {
                    return currentSortingColumn;
                }
            });
        } else if (column.fieldName !== undefined) {
            newSorting.push({
                fieldName: column.fieldName,
                isSorted: true,
                isSortedDescending: false
            });
        }

        this.setState({
            LinksSorting: newSorting.filter(sort => {
                return sort !== undefined;
            }) as ISortingInformation[]
        });
    };

    dismissLinkPanel() {
        this.setState({
            ShowLink: undefined
        });
    }

    linkClick(item: ILink) {
        this.setState({
            ShowLink: item
        });
    }

    componentDidMount() {

        this.initLinks();

    }

    async initLinks() {

        if (this.props.user) {

            log.debug(`User logged in, calling API`);
            const sourceLinks = await ApiHelper.get(this.props.recycled ? `/_api/v1/redirects/recycled` : `/_api/v1/redirects`, this.props.user.accessToken);
            this.setState({
                LinksLoading: false,
                LinksSourceData: sourceLinks
            });

        }
        else {

            log.debug(`User not logged in`);
            this.setState({
                LinksLoading: false,
                LinksSourceData: []
            });
        }

    };

    addButtonClick() {
        this.setState({
            isAddModalOpen: true
        });
    }

    closeAddModalClick() {
        this.setState({
            isAddModalOpen: false
        });
    }

    applySorting(items: any, sorting: ISortingInformation[]) {
        let returnItems = [...(items || [])];
        log.debug(`applySorting with options: ${JSON.stringify(sorting)}`);
        for (const sortOption of sorting) {
            returnItems.sort((a, b) => {
                if (sortOption.isSortedDescending) {
                    if (a[sortOption.fieldName] > b[sortOption.fieldName]) {
                        return -1;
                    }
                    if (a[sortOption.fieldName] < b[sortOption.fieldName]) {
                        return 1;
                    }
                    return 0;
                } else {
                    if (a[sortOption.fieldName] < b[sortOption.fieldName]) {
                        return -1;
                    }
                    if (a[sortOption.fieldName] > b[sortOption.fieldName]) {
                        return 1;
                    }
                    return 0;
                }
            });
        }
        return returnItems;
    }

    render() {

        const commandBarItems = [
            {
                key: "addlink",
                text: "Add a link",
                iconProps: { iconName: "AddLink" },
                onClick: this.addButtonClick
            },
            {
                key: "refresh",
                text: "Refresh",
                iconProps: { iconName: "Refresh" },
                onClick: this.initLinks
            },
            {
                key: "deletelink",
                text: "Delete link",
                iconProps: { iconName: "Delete" }
            }
        ];
    
        const commandBarFarItems = [
            {
                key: "searchBox",
                onRender: this.renderSearchBox.bind(this)
            },
            {
                key: "filter",
                text: "Filter",
                iconProps: { iconName: "Filter" }
            }
        ];

        const dragOptions: IDragOptions = {
            moveMenuItemText: 'Move',
            closeMenuItemText: 'Close',
            menu: ContextualMenu,
        };

        const iconButtonStyles = {
            root: {
                // color: theme.palette.neutralPrimary,
                marginLeft: 'auto',
                marginTop: '4px',
                marginRight: '2px',
            },
            rootHovered: {
                // color: theme.palette.neutralDark,
            },
        };

        const columns = new LinksColumns();
        // const items = this.state.LinksSourceData;

        const items = this.applySorting(
            (this.state.LinksSearchData || this.state.LinksSourceData),
            this.state.LinksSorting
        );

        return (
            <>
                <Navigation />
                <main id={`viewport`} className={styles.Links}>
                    <DocumentMeta {...meta} />
                    <Header />
                    <h1>{this.props.recycled ? `Recycle bin` : `Active Links`}</h1>
                    <CommandBar styles={{ root: { padding: 0 } }}
                        items={commandBarItems}
                        farItems={commandBarFarItems} />

                    <DetailsList
                        items={items}
                        compact={false}
                        columns={columns.Columns(
                            this.linksColumnClick,
                            this.state.LinksSorting,
                            this.state.LinksLoading
                        )}
                        selectionMode={SelectionMode.multiple}
                        getKey={this._getKey}
                        setKey="multiple"
                        layoutMode={DetailsListLayoutMode.fixedColumns}
                        isHeaderVisible
                        selection={this._selection}
                        selectionPreservedOnEmptyClick
                        onItemInvoked={this.linkClick}
                        enterModalSelectionOnTouch
                        ariaLabelForSelectionColumn="Toggle selection"
                        ariaLabelForSelectAllCheckbox="Toggle selection for all items"
                        checkButtonAriaLabel="Row checkbox"
                    />

                    <Panel
                        headerText="Link details"
                        isOpen={this.state.ShowLink !== undefined}
                        onDismiss={this.dismissLinkPanel}
                        // You MUST provide this prop! Otherwise screen readers will just say "button" with no label.
                        closeButtonAriaLabel="Close" >
                        <Link link={this.state.ShowLink} user={this.props.user} />
                    </Panel>

                    <Modal
                        titleAriaId={`modalHeader`}
                        isOpen={this.state.isAddModalOpen}
                        onDismiss={this.closeAddModalClick}
                        isBlocking={false}
                        containerClassName={styles.modalContainer}
                        dragOptions={dragOptions}
                    >
                        <div className={styles.modalHeader}>
                            <h2 id={`modalHeader`}>Add a link</h2>
                            <IconButton
                                styles={iconButtonStyles}
                                iconProps={ { iconName: 'Cancel' } }
                                ariaLabel="Close popup modal"
                                onClick={this.closeAddModalClick}
                            />
                        </div>
                        <div className={styles.modalBody}>
                            <AddLink dismissClick={this.closeAddModalClick} user={this.props.user} refreshCallback={this.initLinks} />
                        </div>
                    </Modal>



                </main>
            </>
        );
    }
}
