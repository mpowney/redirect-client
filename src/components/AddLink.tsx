import * as React from "react";

import { LogFactory } from "../common/utils/InitLogger";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { PrimaryButton, DefaultButton } from "office-ui-fabric-react/lib/Button";

import copy from 'copy-to-clipboard';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
  
  
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
    statsExpanded: boolean;
    statsMarkers: any;
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
            editMode: false,
            statsExpanded: false,
            statsMarkers: null
        }

        this.generateClick = this.generateClick.bind(this);
        this.cancelClick = this.cancelClick.bind(this);
        this.saveClick = this.saveClick.bind(this);
        this.copyClick = this.copyClick.bind(this);
        this.checkForEnterKey = this.checkForEnterKey.bind(this);
        this.statsClick = this.statsClick.bind(this);

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
            const response = await ApiHelper.get(`/_api/v1/redirect/${this.props.rowKey}`, true);
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

        if (!this.isValidURL(this.state.redirectTo)) {
            return;    
        }

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
                const existingLink = await ApiHelper.get(`/_api/v1/redirect/${this.state.shortName}`, true).catch();
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
                    }, true);
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
        }, true);
        this.setState({
            hasGenerated: true
        });
        await this.props.refreshCallback();
        this.props.dismissClick();

    }

    checkForEnterKey(ev: any) {
        if (ev.keyCode === 13) {
            this.generateClick();
        }
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

    statsClick() {
        log.info(`statsClick() executing`);
        this.setState({
            statsExpanded: !this.state.statsExpanded
        }, async () => {
            if (this.state.statsExpanded) {
                const geoData = await ApiHelper.get(`/_api/v1/redirect/${this.state.shortName}/geo`, true);
                log.debug(`geoData: ${JSON.stringify(geoData)}`);

                const geoStats = geoData && Object.keys(geoData).map((key: string, index: number) => {
                    log.debug(`geoData geoStats map: ${JSON.stringify(geoData[key])}`)
                    return { 
                        name: `${geoData[key].city}: ${geoData[key].clickCount}`,
                        markerOffset: -25,
                        coordinates: [geoData[key].longitude, geoData[key].latitude]
                    };
                });

                if (geoStats) {
                    this.setState({statsMarkers: geoStats});
                }
            }
        });
    }

    // https://1drv.ms/x/s!ArmpCQgx5KlzlSia0WUtfqv5q0IW?e=s7qnyF
    isValidURL(str: string) {
        var pattern = new RegExp('^(https?:\\/\\/)'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-A-Za-z\\d%_.~+!]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    }

    render() {

        const generateButtonActive = this.isValidURL(this.state.redirectTo);
        const geoUrl = "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

        log.debug(`render() this.state.statsMarkers: ${JSON.stringify(this.state.statsMarkers)}`);
      
        return (
            <div className={`${styles.addLink} ${this.state.statsExpanded && styles.statsExpanded}`}>
            
                <h2 id={`modalHeader`}>{this.state.isLoading ? `Loading...` : this.state.editMode ? `Edit a redirect` : `Add a redirect`}</h2>
                <TextField value={this.state.redirectTo} label={`Redirect to`} onKeyUp={this.checkForEnterKey} disabled={this.state.isLoading} placeholder={`Enter the URL to link to`} className={styles.LinkField} onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => this.updateState(event, `redirectTo`, value) } componentRef={this.urlRef} />
                <TextField value={this.state.shortName} label={`Short name`} onKeyUp={this.checkForEnterKey} disabled={this.state.isLoading || this.state.hasGenerated} prefix={`${this.state.shortPrefix}`} placeholder={`Leave blank to generate random short name`} className={styles.ShortNameField} onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => this.updateState(event, `shortName`, value) } />

                { this.state.statsExpanded && <div className={styles.statsSection}>
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{
                            // rotate: [58, 20, 0],
                            scale: 100
                        }}
                        >
                            <ZoomableGroup zoom={1}>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map(geo => (
                                            <Geography 
                                            key={geo.rsmKey} 
                                            geography={geo}
                                            fill="#ccc"
                                            stroke="#EAEAEC"
                                            strokeWidth="0.5"
                                            />
                                        ))}
                                </Geographies>

                                {this.state.statsMarkers && this.state.statsMarkers.map((marker: any) => { return (
                                    <Marker key={marker.name} coordinates={marker.coordinates}>
                                        <circle r={10} fill="#F00" stroke="#fff" strokeWidth={2} />
                                        <text
                                            textAnchor="middle"
                                            y={marker.markerOffset}
                                            style={{ fontFamily: "system-ui", fill: "#5D5A6D" }}>
                                            {marker.name}
                                        </text>
                                    </Marker>);
                                })}

                            </ZoomableGroup>

                        </ComposableMap>

                    </div>}    


                <div className={styles.buttonContainer}>
                    { this.state.editMode ? 
                        <PrimaryButton text={`Save`} onClick={this.saveClick} className={styles.generateButton} disabled={!generateButtonActive} />
                        :
                        <PrimaryButton text={this.state.hasGenerated ? `Close` : `Generate`} onClick={this.generateClick} className={styles.generateButton} disabled={!generateButtonActive} />
                    }
                    <DefaultButton text={`Cancel`} onClick={this.cancelClick} className={styles.cancelButton} />
                    {this.state.hasGenerated && <DefaultButton text={`Copy`} onClick={this.copyClick} className={styles.copyButton} /> }
                    {this.state.hasGenerated && <DefaultButton text={`Stats`} onClick={this.statsClick} /> }
                </div>
            </div>
        );
    }
}
