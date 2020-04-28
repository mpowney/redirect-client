import * as React from "react";
import { withRouter } from "react-router-dom";

import { Nav, INavLink } from "office-ui-fabric-react/lib/Nav";
import { LogFactory } from "common/utils/InitLogger";

const styles = require("styles/components/Navigation.less");
const log = LogFactory.getLogger("Navigation.tsx");

interface INavigationProps {
    history: string[];
}
interface INavigationState {
    minimised: boolean;
}

export class Navigation extends React.Component<INavigationProps, INavigationState> {
    static STORE_CLASSES = [];

    constructor(props) {
        super(props);

        this.itemClick = this.itemClick.bind(this);
    }

    private itemClick(ev?: React.MouseEvent<HTMLElement, MouseEvent>, item?: INavLink): void {
        log.debug(`itemClick() executed with event ${ev && ev.target}`);

        if (item) { item.url && this.props.history.push(item.url); }
        if (ev) { ev.preventDefault(); }
    }

    render() {
        return (
            <div className={styles.navigation}>
                <Nav
                    onLinkClick={this.itemClick}
                    styles={{ root: { width: 280 }, groupContent: { marginBottom: 0 } }}
                    groups={[
                        {
                            links: [{ key: "Home", name: "Home", url: "/", icon: "Home" }]
                        },
                        {
                            links: [
                                { key: "Links", name: "Links", url: "/links", icon: "Link" },
                                { key: "ManageLinks", name: "Manage links", url: "/links" },
                                { key: "AddLink", name: "Add new link", url: "/links/add" }
                            ]
                        }
                    ]}
                />
            </div>
        );
    }
}

export default withRouter(Navigation);
