import * as React from "react";
import { withRouter, useHistory } from "react-router-dom";

import { Nav, INavLink } from "office-ui-fabric-react/lib/Nav";
import { LogFactory } from "../common/utils/InitLogger";
export interface INavigationProps {
}
export interface INavigationState {
    minimised: boolean;
}

export class Navigation extends React.Component<INavigationProps, INavigationState> {

    constructor(props: INavigationProps) {
        super(props);
        this.itemClick = this.itemClick.bind(this);
    }

    private itemClick(ev?: React.MouseEvent<HTMLElement, MouseEvent>, item?: INavLink): void {
        const log = LogFactory.getLogger("Navigation.tsx");
        let history = useHistory();
        
        log.debug(`itemClick() executed with event ${ev && ev.target}`);

        if (item) { item.url && history.push(item.url); }
        if (ev) { ev.preventDefault(); }
    }

    render() {

        const styles = require("../assets/styles/components/Navigation.module.scss");

        return (
            <div className={styles.navigation}>
                <Nav onLinkClick={this.itemClick}
                    styles={{ root: { width: 280 }, groupContent: { marginBottom: 0 } }}
                    groups={[
                        {
                            links: [{ key: "Home", name: "Home", url: "/", icon: "Home" }]
                        },
                        {
                            links: [
                                { key: "Links", name: "Links", url: "/links", icon: "Link" },
                                { key: "ManageLinks", name: "Manage links", url: "/links" },
                                { key: "RecycledLinks", name: "Recycle bin", url: "/links/recycled" }
                            ]
                        }
                    ]}
                />
            </div>
        );
    }
}

export default Navigation;
