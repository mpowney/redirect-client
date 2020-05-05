import * as React from "react";

import { LogFactory } from "../common/utils/InitLogger";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { PrimaryButton, DefaultButton } from "office-ui-fabric-react/lib/Button";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";

import copy from 'copy-to-clipboard';
import Config from "../common/utils/Config";
import ApiHelper from "../common/utils/ApiHelper";
import { IUser } from "../App";

const styles = require("../assets/styles/components/AddLink.module.scss");
const log = LogFactory.getLogger("AddLink.tsx");

interface IAddLinkProps {
    user: IUser;
    dismissClick: any;
    refreshCallback: any;
}
interface IAddLinkState {
    shortPrefix: string | null;
    redirectTo: string;
    shortName: string;
    hasGenerated: boolean;
    generateError: boolean;
    isLoading: boolean;
}

export class AddLink extends React.Component<IAddLinkProps, IAddLinkState> {

    constructor(props: IAddLinkProps) {
        super(props);

        this.state = {
            shortPrefix: null,
            redirectTo: '',
            shortName: '',
            hasGenerated: false,
            generateError: false,
            isLoading: false
        }

        this.generateClick = this.generateClick.bind(this);
        this.cancelClick = this.cancelClick.bind(this);

    }

    componentDidMount() {
        this.init();
    }

    async init() {
        const config = new Config();
        const shortUrlPrefix = await config.get('Short URL Prefix');
        this.setState({
            shortPrefix: shortUrlPrefix
        });
        
    }

    updateState(event: React.FormEvent, variable: string, value?: string) {
        log.info(
            `updateState() executing from element [${event.target}] with variable [${variable}]`
        );
        const updateState: any = { };
        updateState[variable] = value || "";
        this.setState(updateState);
    }

    async generateClick() {

        log.info(`generateClick() executing`);

        if (this.state.hasGenerated) {
            this.props.dismissClick();
            return;
        }

        this.setState({
            isLoading: true
        });
        
        const validCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = this.state.shortName;

        if (this.state.shortName === '') {
            for ( var i = 0; i < 6; i++ ) {
                randomString += validCharacters.charAt(Math.floor(Math.random() * validCharacters.length));
            }
        }

        this.setState({
            shortName: randomString
        }, async () => {
            let linkExists: boolean = false;
            try {
                const existingLink = await ApiHelper.get(`/_api/v1/redirect/${this.state.shortName}`, this.props.user.accessToken).catch();
                if (existingLink) linkExists = true;
            }
            catch {}

            if (linkExists) {
                this.setState({
                    generateError: true,
                    isLoading: false
                });
            }
            else {

                try {

                    await ApiHelper.post(`/_api/v1/redirect`, {
                        redirectTo: this.state.redirectTo,
                        rowKey: this.state.shortName
                    }, this.props.user.accessToken);
                    this.setState({
                        hasGenerated: true
                    });
                    await this.props.refreshCallback();
    
                }
                catch {

                    this.setState({
                        generateError: true,
                        isLoading: false
                    });
                }

                this.setState({
                    isLoading: false
                })
            }

        });
        
    }

    copyClick() {
        log.info(`copyClick() executing`);
        if ( this.state.shortName ) {
            copy(this.state.shortName);
        }
    }

    cancelClick() {
        log.info(`cancelClick() executing`);
        this.props.dismissClick();
    }

    isValidURL(str: string) {
        var pattern = new RegExp('^(https?:\\/\\/)'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    }

    render() {

        const generateButtonActive = this.isValidURL(this.state.redirectTo);

        return (
            <div className={styles.addLink}>
                <TextField defaultValue={this.state.redirectTo} label={`Redirect to`} placeholder={`Enter the URL to link to`} className={styles.LinkField} onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => this.updateState(event, `redirectTo`, value) } />
                <TextField value={this.state.shortName} label={`Short name`} prefix={`${this.state.shortPrefix}`} placeholder={`Leave blank to generate random short name`} className={styles.ShortNameField} onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => this.updateState(event, `shortName`, value) } iconProps={{ iconName: 'Copy', onClick: this.copyClick }} />

                <div className={styles.buttonContainer}>
                    <PrimaryButton text={this.state.hasGenerated ? `Close` : `Generate`} onClick={this.generateClick} className={styles.generateButton} disabled={!generateButtonActive} />
                    <DefaultButton text={`Cancel`} onClick={this.cancelClick} />
                    { this.state.isLoading && <Spinner size={SpinnerSize.small} />}
                </div>
            </div>
        );
    }
}
