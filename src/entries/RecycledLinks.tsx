import * as React from "react";
import Links from "./Links";
import { IUser } from "../App";


interface IRecycledLinksProps {
    user: IUser
}
interface IRecycledLinksState {}

export default class HomeEntry extends React.Component<IRecycledLinksProps, IRecycledLinksState> {

    constructor(props: IRecycledLinksProps) {
        super(props);
    }

    render() {
        return (
            <>
                <Links user={this.props.user} recycled={true} />
            </>
        );
    }
}
