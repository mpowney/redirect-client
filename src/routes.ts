import Home from "entries/Home";
import NotFound from "entries/NotFound";
import Link from "entries/Link";
import Links from "entries/Links";

const routes = [
    { path: "/", exact: true, component: Home },
    { path: "/links", exact: true, component: Links },
    { path: "/links/:linkId", exact: true, component: Link },
    { path: "", exact: false, component: NotFound }
];

export default routes;
