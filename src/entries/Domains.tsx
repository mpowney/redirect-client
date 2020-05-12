import * as React from "react";
import DocumentMeta from "react-document-meta";

import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import { SearchBox } from "office-ui-fabric-react/lib/SearchBox";
import { Modal, IDragOptions } from "office-ui-fabric-react/lib/Modal";

import Navigation from "../components/Navigation";
import Header from "../components/Header";
import { LogFactory } from "../common/utils/InitLogger";
import DomainsColumns from "../components/DomainsColumns";
import ISortingInformation from "../common/utils/ISortingInformation";
import { IColumn, SelectionMode, DetailsListLayoutMode, DetailsList, Selection } from "office-ui-fabric-react/lib/DetailsList";
import { IUser } from "../App";
import ApiHelper from "../common/utils/ApiHelper";
import { IconButton } from "office-ui-fabric-react/lib/Button";
import { ContextualMenu } from "office-ui-fabric-react/lib/ContextualMenu";
import { MarqueeSelection } from "office-ui-fabric-react/lib/MarqueeSelection";
import { AddDomain } from "../components/AddDomain";

const log = LogFactory.getLogger("Domains.tsx");
const styles = require("../assets/styles/entries/Domains.module.scss");
const meta = {
    title: "Domains",
    description: "",
    meta: {
        charset: "utf-8",
        name: {
            keywords: "Domains"
        }
    }
};

export interface IDomain {
    timestamp: Date;
    partitionKey: string;
    rowKey: string;
    account: string;
    configured: boolean;
    sslConfigured: boolean;
}

interface IDomainsProps {
    user: IUser;
}
interface IDomainsPersistedState {
    DomainsSorting: ISortingInformation[];
    DomainsSearch: string;
}
interface IDomainsState extends IDomainsPersistedState {
    DomainsLoading: boolean;
    ShowDomain?: IDomain;
    DomainsSourceData: IDomain[];
    DomainsSearchData?: IDomain[];
    isDomainModalOpen: boolean;
    numberOfDomainsSelected: number;
}

export default class DomainsEntry extends React.Component<IDomainsProps, IDomainsState> {
    static STORE_CLASSES = [];
    private _selection: Selection;
    
    constructor(props: IDomainsProps) {
        super(props);

        this.domainsColumnClick = this.domainsColumnClick.bind(this);
        this.dismissDomainPanel = this.dismissDomainPanel.bind(this);
        this.linkClick = this.linkClick.bind(this);
        this.linkActive = this.linkActive.bind(this);
        this.closeAddModalClick = this.closeAddModalClick.bind(this);
        this.refreshButtonClick = this.refreshButtonClick.bind(this);
        this.addButtonClick = this.addButtonClick.bind(this);
        this.initDomains = this.initDomains.bind(this);
        this.deleteDomains = this.deleteDomains.bind(this);

        const dummyDomain: IDomain = {
            timestamp: new Date(),
            partitionKey: "",
            rowKey: "dummy",
            account: "dummy",
            configured: false,
            sslConfigured: false
        };

        this.state = {
            isDomainModalOpen: false,
            numberOfDomainsSelected: 0,
            DomainsSorting: [],
            DomainsLoading: true,
            DomainsSearch: "",
            ShowDomain: undefined,
            DomainsSourceData: [
                { ...dummyDomain, rowKey: 'dummy1' }, { ...dummyDomain, rowKey: 'dummy2' }, { ...dummyDomain, rowKey: 'dummy3' }, { ...dummyDomain, rowKey: 'dummy4' }, { ...dummyDomain, rowKey: 'dummy5' }
            ]
        };

        this._selection = new Selection({
            onSelectionChanged: () => this.setState({ numberOfDomainsSelected: this._selection.getSelectedCount() }),
        });
    
    
    }

    private _getKey(item: IDomain/* , index?: number*/): string {
        // log.debug(`_getKey() executed with item ${JSON.stringify(item)} and index ${index}`);
        return item.rowKey;
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

    private domainsColumnClick = (
        ev: React.MouseEvent<HTMLElement>,
        column: IColumn
    ): void => {
        log.debug(
            `domainsColumnClick() executed with column ${JSON.stringify(
                column
            )}, event target ${JSON.stringify(ev.pageY)}`
        );

        const currentSorting: ISortingInformation[] = this.state.DomainsSorting;
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
            DomainsSorting: newSorting.filter(sort => {
                return sort !== undefined;
            }) as ISortingInformation[]
        });
    };

    dismissDomainPanel() {
        this.setState({
            ShowDomain: undefined
        });
    }

    linkClick(item: IDomain) {
        this.setState({
            ShowDomain: item,
            isDomainModalOpen: true
        });
    }

    linkActive(item?: IDomain, index?: number | undefined, ev?: React.FocusEvent<HTMLElement> | undefined) {
        log.debug(`${JSON.stringify(this._selection)}`)
    }

    componentDidMount() {

        this.initDomains();

    }

    async initDomains() {

        if (this.props.user) {

            log.debug(`User logged in, calling API`);
            try {

                const sourceDomains = await ApiHelper.get(`/_api/v1/domains`, true);
                this.setState({
                    DomainsLoading: false,
                    DomainsSourceData: sourceDomains
                });
    
            }
            catch (err) {
                log.error(`${JSON.stringify(err)}`);
                this.setState({
                    DomainsLoading: false,
                    DomainsSourceData: []
                });
            }
        }
        else {

            log.debug(`User not logged in`);
            this.setState({
                DomainsLoading: false,
                DomainsSourceData: []
            });
        }

    };

    refreshButtonClick() {
        this.initDomains();
    }

    addButtonClick() {
        this.setState({
            isDomainModalOpen: true,
            ShowDomain: undefined
        });
    }

    closeAddModalClick() {
        this.setState({
            isDomainModalOpen: false
        });
    }

    deleteDomains() {
        const items = this._selection.getSelectedIndices().map(index => { return this._selection.getItems()[index]});
        log.debug(`deleteDomains() ${JSON.stringify(items)}`);
        const promises = items.map(link => { return ApiHelper.delete(`/_api/v1/redirect/${(link as IDomain).rowKey}`, true); });

        if (promises.length > 0) {
            this.performPromiseActions(promises);
        }
    }

    async performPromiseActions(promises: Promise<void>[]) {
        await Promise.all(promises);
        this.initDomains();
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

        const commandBarItems: ICommandBarItemProps[] = [];
        commandBarItems.push({
            key: "adddomain",
            text: "Add a domain",
            iconProps: { iconName: "AddDomain" },
            onClick: this.addButtonClick
        });
        commandBarItems.push({
            key: "refresh",
            text: "Refresh",
            iconProps: { iconName: "Refresh" },
            onClick: this.refreshButtonClick
        });
        commandBarItems.push({
            key: "deletedomain",
            text: `Delete domain`,
            iconProps: { iconName: "Delete" },
            disabled: this.state.numberOfDomainsSelected === 0,
            onClick: this.deleteDomains
        });

        const commandBarFarItems: ICommandBarItemProps[] = [];
        //     {
        //         key: "searchBox",
        //         onRender: this.renderSearchBox.bind(this)
        //     },
        //     {
        //         key: "filter",
        //         text: "Filter",
        //         iconProps: { iconName: "Filter" }
        //     }
        // ];

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

        const columns = new DomainsColumns();
        // const items = this.state.DomainsSourceData;

        const items = this.applySorting(
            (this.state.DomainsSearchData || this.state.DomainsSourceData),
            this.state.DomainsSorting
        );

        return (
            <>
                <Navigation />
                <main id={`viewport`} className={styles.Domains}>
                    <DocumentMeta {...meta} />
                    <Header />
                    <h1>{`Domains`}</h1>
                    <CommandBar styles={{ root: { padding: 0 } }}
                        items={commandBarItems}
                        farItems={commandBarFarItems} />

                    <MarqueeSelection selection={this._selection}>
                        <DetailsList
                            items={items}
                            compact={false}
                            columns={columns.Columns(
                                this.domainsColumnClick,
                                this.state.DomainsSorting,
                                this.state.DomainsLoading
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
                    </MarqueeSelection>

                    <Modal
                        titleAriaId={`modalHeader`}
                        isOpen={this.state.isDomainModalOpen}
                        onDismiss={this.closeAddModalClick}
                        isBlocking={false}
                        containerClassName={styles.modalContainer}
                        dragOptions={dragOptions}
                    >
                        <div className={styles.modalHeader}>
                            <IconButton
                                styles={iconButtonStyles}
                                iconProps={ { iconName: 'Cancel' } }
                                ariaLabel="Close popup modal"
                                onClick={this.closeAddModalClick}
                            />
                        </div>
                        <div className={styles.modalBody}>
                            <AddDomain 
                                rowKey={this.state.ShowDomain?.rowKey}
                                dismissClick={this.closeAddModalClick} 
                                user={this.props.user} 
                                refreshCallback={this.initDomains} />
                        </div>
                    </Modal>



                </main>
            </>
        );
    }
}
