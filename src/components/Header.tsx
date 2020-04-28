import * as React from "react";
import { LogFactory } from "common/utils/InitLogger";
import { PACKAGE_NAME } from "app";

const styles = require("styles/components/Header.less");
const log = LogFactory.getLogger("Header.tsx");

interface IHeaderProps {
    tenantName?: string;
}
interface IHeaderState {
    minimised: boolean;
}

export class Header extends React.Component<IHeaderProps, IHeaderState> {
    static STORE_CLASSES = [];

    constructor(props) {
        super(props);

    }

    render() {
        log.debug(`render() executing`);

        return (
            <div className={styles.Header}>
                <div className={styles.TenantName}>{PACKAGE_NAME}{this.props.tenantName && `: ${this.props.tenantName}`}</div>
            </div>
        );
    }
}

export default Header;
