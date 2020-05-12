import * as React from "react";
import { TextField } from "office-ui-fabric-react/lib/TextField";

import { ILink } from "./Links";
import { DefaultButton, PrimaryButton } from "office-ui-fabric-react/lib/Button";
import ApiHelper from "../common/utils/ApiHelper";
import { IUser } from "../App";
import { LogFactory } from "../common/utils/InitLogger";

const log = LogFactory.getLogger("Link.tsx");

// const styles = require("../assets/styles/entries/Link.module.scss");
// const meta = {
//     title: "Link",
//     description: "",
//     meta: {
//         charset: "utf-8",
//         name: {
//             keywords: "Link"
//         }
//     }
// };

interface ILinkProps {
    user: IUser;
    link: ILink | undefined;
}
interface ILinkState {
    editMode: boolean;
    link: ILink | undefined;
    originalLink: ILink | undefined;
}

export default class UserEntry extends React.Component<ILinkProps, ILinkState> {
    static STORE_CLASSES = [];

    constructor(props: ILinkProps) {
        super(props);

        this.state = {
            editMode: false,
            link: this.props.link,
            originalLink: this.props.link ? JSON.parse(JSON.stringify(this.props.link)) : undefined
        };

        this.editButtonClick = this.editButtonClick.bind(this);
        this.saveButtonClick = this.saveButtonClick.bind(this);
        this.cancelButtonClick = this.cancelButtonClick.bind(this);
    }

    editButtonClick() {
        this.setState({
            editMode: true
        });
    }

    async saveButtonClick() {
        log.debug(`User logged in, calling API`);
        await ApiHelper.patch(`/_api/v1/redirect`, this.state.link, true);
        this.setState({
            originalLink: JSON.parse(JSON.stringify(this.state.link)),
            editMode: false
        });
    }

    cancelButtonClick() {
        this.setState({
            link: JSON.parse(JSON.stringify(this.state.originalLink))
        });
    }

    updateState(event: React.FormEvent, variable: string, value?: string) {
        log.info(
            `updateState() executing from element [${event.target}] with variable [${variable}]`
        );
        const updateState: any = { link: this.state.link };
        updateState.link[variable] = value || "";
        this.setState(updateState);
    }

    render() {
        return (
            this.state.link &&
            <>
                <TextField label="Short name" defaultValue={this.state.link.rowKey} readOnly={true} />
                <TextField label="Redirect to" 
                        onChange={(event: React.FormEvent, value?: string) =>
                            this.updateState(event, `redirectTo`, value)
                        }
                        defaultValue={this.state.link.redirectTo} 
                        readOnly={!this.state.editMode} />

                {!this.state.editMode ? <DefaultButton text={`Edit`} onClick={this.editButtonClick} />
                : <>
                    <PrimaryButton text={`Save`} onClick={this.saveButtonClick} />
                    <DefaultButton text={`Cancel`} onClick={this.cancelButtonClick} />
                </>}
            </>
        );
    }
}
