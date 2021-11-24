import { MetaFunction, LinksFunction } from "remix";
import { Outlet } from "remix";

import styles from "../styles/index.css";

export let meta: MetaFunction = () => {
  return {
    title: "Funniest domains",
    description: "A collection of the funniest domains out there",
  };
};

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export default function Index() {
  return (
    <div className="container">
      <h1>Funniest domains</h1>

      <Outlet />
    </div>
  );
}
