import Home from "./entries/Home";
import NotFound from "./entries/NotFound";
import RecycledLinks from "./entries/RecycledLinks";
import Links from "./entries/Links";
import Domains from "./entries/Domains";

const routes = [
    { path: "/", exact: true, component: Home },
    { path: "/links", exact: true, component: Links },
    { path: "/links/recycled", exact: true, component: RecycledLinks },
    { path: "/domains", exact: true, component: Domains },
    { path: "", exact: false, component: NotFound }
];

export default routes;
