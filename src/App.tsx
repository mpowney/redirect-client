import * as React from "react";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import * as Msal from "msal";

import { API_BASE } from "./config/env";
import routes from "./routes";

import theme from "./assets/styles/theme";
import TopBar from "./components/TopBar";
import { Customizations } from "@uifabric/utilities";
import { LogFactory } from "./common/utils/InitLogger";
import Config from "./common/utils/Config";
import "office-ui-fabric-core/dist/css/fabric.min.css";
import { Modal } from "office-ui-fabric-react/lib/Modal";
import { PrimaryButton } from "office-ui-fabric-react/lib/Button";

require("./assets/styles/global.scss");

const styles = require("./assets/styles/app.module.scss");
const log = LogFactory.getLogger("app.tsx");

export const PACKAGE_NAME = "Azure Redirects";
export const TENANT_NAME = "powney.xyz";
export const TENANT_ID = "dc8659ad-22da-4759-8a7a-97e1606e6be4";
export const CLIENT_ID = "419cc170-bd84-448a-a3dd-1f1e2a89d55c";
export const SHORT_URL_PREFIX = "http://m.pown.ee/";

export const Routes = routes;

export interface IUser {
    loginName: string;
    displayName: string;
    accessToken: string;
    accessTokenExpires: Date;
}

export interface IAppProps {}
export interface IAppState {
    userLoggedIn: boolean;
    loginModalOpen: boolean;
    loginModalRecover: boolean;
    user: IUser | null;
}

// Browser App entry
export default class App extends React.Component<IAppProps, IAppState> {

    private accessTokenTimeout: number = 0;
    private msalConfig: any;
    private msalLoginRequest: any;
    private msalInstance: Msal.UserAgentApplication | undefined = undefined;

    constructor(props: IAppProps) {

        super(props);

        this.state = {
            userLoggedIn: false,
            loginModalOpen: false,
            loginModalRecover: false,
            user: null
        };
        
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.hideLoginModal = this.hideLoginModal.bind(this);
        this.renewAccessToken = this.renewAccessToken.bind(this);

        this.init().then(() => {
            this.initLogin();
        });

    }

    public async init() {

        const config = new Config();

        this.msalConfig = {
            auth: {
                clientId: `${await config.get(`AAD Application Client ID`)}`,
                authority: `https://login.windows.net/${await config.get(`AAD Tenant ID`)}`,
                postLogoutRedirectUri: `${window.location.protocol}//${window.location.host}`,
                // redirectUri: `https://redirect-api-ause.azurewebsites.net/_api/v1/test`,
                // redirectUri: `${window.location.href}`,
                redirectUri: `${window.location.protocol}//${window.location.host}`,
                // validateAuthority: false
            }
        };

        this.msalLoginRequest = {
            // scopes: ['User.ReadWrite.All'] // optional Array<string>
            // scopes: ['openid', 'profile', 'email']
            scopes: [`${API_BASE}/user_impersonation`]
        };

        this.msalInstance = new Msal.UserAgentApplication(this.msalConfig);

        if (!!!this.msalInstance.getAccount()) {
            this.setState({
                loginModalOpen: true
            });
        }

    }

    public async handleLogin() {

        log.debug(`handleLogin() executing`);

        if (this.msalInstance) {

            this.msalInstance.handleRedirectCallback((error: any, response: any) => {
                // handle redirect response or error
                if (error) {
                    log.error(error.errorMessage);
                } else if (response) {
                    log.debug(`Response from MSAL: ${response.account}`);
                }
            });
    
            try {
                if (this.msalInstance.getAccount() == null || this.state.loginModalRecover) {
                    const loginResponse = await this.msalInstance.loginPopup(this.msalLoginRequest);
                    log.debug(`loginResponse: ${JSON.stringify(loginResponse)}`);
                }
    
                await this.initLogin();
    
            } catch (err) {
                log.error(`Error occurred during loginPopup: ${err}`);
            }
    
        }

    }

    public async initLogin() {

        if (this.msalInstance) {

            if (this.msalInstance.getAccount() != null) {

                try {
                    const tokenResponse = await this.msalInstance.acquireTokenSilent(this.msalLoginRequest);
                    log.debug(`Response from AAD: ${JSON.stringify(tokenResponse)}`);

                    if (tokenResponse.accessToken !== null) {
                        this.setState({
                            userLoggedIn: true,
                            user: { 
                                loginName: this.msalInstance.getAccount().userName, 
                                displayName: this.msalInstance.getAccount().name,
                                accessToken: tokenResponse.accessToken,
                                accessTokenExpires: new Date(tokenResponse.expiresOn)
                            },
                            loginModalOpen: false,
                            loginModalRecover: false
                        });
                    }
                }
                catch (err) {
                    log.error(`Error occurred during initLogin(): ${err}`);
                    this.setState({
                        loginModalRecover: true
                    });
                }
            }
        }
    }

    public renewAccessToken() {
        this.initLogin();
    }

    public async handleLogout() {
        if (this.msalInstance) {

            this.msalInstance.logout();

        }
    }

    public hideLoginModal() {
        this.setState({
            loginModalOpen: false,
            loginModalRecover: false
        })
    }

    render() {
        Customizations.applySettings({ theme: theme });
        initializeIcons();

        const renderMergedProps = (component: any, ...rest: any[]) => {
            const finalProps = Object.assign({}, ...rest, { user: this.state.user });
            return React.createElement(component, finalProps);
        };

        const PropsRoute = ({ component, ...rest }: any) => {
            return (
                <Route
                    {...rest}
                    render={(routeProps: any) => {
                        return renderMergedProps(component, routeProps, rest);
                    }}
                />
            );
        };

        const { DateTime } = require("luxon");
        if (this.state.user && this.state.user.accessTokenExpires) {
            const diffDuration = DateTime.fromJSDate(this.state.user.accessTokenExpires).diff(DateTime.local(), "seconds");
            log.debug(`render() accessTokenExpires diff ${JSON.stringify(diffDuration.seconds)}`);
            window.clearTimeout(this.accessTokenTimeout);
            this.accessTokenTimeout = window.setTimeout(this.renewAccessToken, diffDuration.seconds * 1000);
        }

        return (
            <>
                <TopBar userLoggedIn={this.state.userLoggedIn} user={this.state.user} loginHandler={this.handleLogin} logoutHandler={this.handleLogout} />
                <div id={`appContainer`} className={styles.appContainer}>
                    <BrowserRouter>
                        <Switch>
                            {routes.map((route: any, index: any) =>
                                route.redirect ? (
                                    <Route key={index} exact={!!route.exact} path={route.path}>
                                        <Redirect key={index} from={route.path} to={route.redirect} />
                                    </Route>
                                ) : (
                                    <PropsRoute
                                        key={index}
                                        exact={!!route.exact}
                                        path={route.path}
                                        component={route.component}
                                    />
                                )
                            )}
                        </Switch>
                    </BrowserRouter>
                </div>
                <Modal
                    isOpen={this.state.loginModalOpen || this.state.loginModalRecover}
                    onDismiss={this.hideLoginModal}
                    isBlocking={true}>
                        <div className={styles.loginModalContainer}>
                            <h1>Sign in to {PACKAGE_NAME}</h1>
                            <p>To use this service you must first sign in</p>
                            <PrimaryButton text={`Sign in`} onClick={this.handleLogin} />
                        </div>
                </Modal>

            </>
        );
    }
}
