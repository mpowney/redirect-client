import * as React from "react";

import { LogFactory } from "../common/utils/InitLogger";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { PrimaryButton, DefaultButton } from "office-ui-fabric-react/lib/Button";

import copy from 'copy-to-clipboard';
import Config from "../common/utils/Config";
import ApiHelper from "../common/utils/ApiHelper";
import { IUser } from "../App";
import { ILink } from "../entries/Links";

const styles = require("../assets/styles/components/AddLink.module.scss");
const log = LogFactory.getLogger("AddLink.tsx");

interface IAddLinkProps {
    user: IUser;
    dismissClick: any;
    refreshCallback: any;
    rowKey?: string;
}
interface IAddLinkState {
    link?: ILink;
    shortPrefix: string | null;
    redirectTo: string;
    shortName: string;
    hasGenerated: boolean;
    generateError: boolean;
    isLoading: boolean;
    editMode: boolean;
}

export class AddLink extends React.Component<IAddLinkProps, IAddLinkState> {

    private urlRef: any;

    constructor(props: IAddLinkProps) {
        super(props);

        this.urlRef = React.createRef();

        this.state = {
            shortPrefix: null,
            redirectTo: '',
            shortName: '',
            hasGenerated: false,
            generateError: false,
            isLoading: false,
            editMode: false
        }

        this.generateClick = this.generateClick.bind(this);
        this.cancelClick = this.cancelClick.bind(this);
        this.saveClick = this.saveClick.bind(this);
        this.copyClick = this.copyClick.bind(this);

    }

    componentDidMount() {
        this.init();
        this.urlRef.current.focus();
    }

    async init() {
        const config = new Config();
        const shortUrlPrefix = await config.get('Short URL Prefix');
        this.setState({
            shortPrefix: shortUrlPrefix
        });
        if (this.props.rowKey) {
            this.setState({
                isLoading: true
            });
            const response = await ApiHelper.get(`/_api/v1/redirect/${this.props.rowKey}`, this.props.user.accessToken);
            log.debug(`init() response from api get ${JSON.stringify(response)}`)
            this.setState({
                redirectTo: response.redirectTo,
                shortName: response.rowKey,
                hasGenerated: true,
                editMode: true,
                isLoading: false
            });
        }
        
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

    async saveClick() {

        await ApiHelper.patch(`/_api/v1/redirect/${this.state.shortName}`, {
            redirectTo: this.state.redirectTo
        }, this.props.user.accessToken);
        this.setState({
            hasGenerated: true
        });
        await this.props.refreshCallback();
        this.props.dismissClick();

    }

    copyClick() {
        log.info(`copyClick() executing`);
        if ( this.state.shortName ) {
            copy(`${this.state.shortPrefix}${this.state.shortName}`);
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
            
                <h2 id={`modalHeader`}>{this.state.isLoading ? `Loading...` : this.state.editMode ? `Edit a redirect` : `Add a redirect`}</h2>
                <TextField value={this.state.redirectTo} label={`Redirect to`} disabled={this.state.isLoading} placeholder={`Enter the URL to link to`} className={styles.LinkField} onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => this.updateState(event, `redirectTo`, value) } componentRef={this.urlRef} />
                <TextField value={this.state.shortName} label={`Short name`} disabled={this.state.isLoading || this.state.hasGenerated} prefix={`${this.state.shortPrefix}`} placeholder={`Leave blank to generate random short name`} className={styles.ShortNameField} onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => this.updateState(event, `shortName`, value) } />

                <div className={styles.buttonContainer}>
                    { this.state.editMode ? 
                        <PrimaryButton text={`Save`} onClick={this.saveClick} className={styles.generateButton} disabled={!generateButtonActive} />
                        :
                        <PrimaryButton text={this.state.hasGenerated ? `Close` : `Generate`} onClick={this.generateClick} className={styles.generateButton} disabled={!generateButtonActive} />
                    }
                    <DefaultButton text={`Cancel`} onClick={this.cancelClick} className={styles.cancelButton} />
                    {this.state.hasGenerated && <DefaultButton text={`Copy`} onClick={this.copyClick} /> }
                </div>
            </div>
        );
    }
}
