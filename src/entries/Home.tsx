import * as React from "react";

import DocumentMeta from "react-document-meta";
import Navigation from "../components/Navigation";

const styles = require("../assets/styles/entries/Home.module.scss");
const meta = {
    title: "Home",
    description: "",
    meta: {
        charset: "utf-8",
        name: {
            keywords: "Home"
        }
    }
};

interface HomeProps {}
interface HomeState {}

export default class HomeEntry extends React.Component<HomeProps, HomeState> {
    static STORE_CLASSES = [];

    render() {
        return (
            <>
                <Navigation />
                <div className={styles.home}>
                    <DocumentMeta {...meta} />
                    Welcome
                </div>
            </>
        );
    }
}
