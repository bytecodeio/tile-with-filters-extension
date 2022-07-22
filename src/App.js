/**
 * This is a sample Looker Extension written in javascript and React. It imports one component, <HelloWorld>.
 * HelloWorld makes a simple call to the Looker API using the Extension Framework's built in authentication,
 * and returns the logged in user.
 */

import React from "react";
import { HelloWorld } from "./HelloWorld";
import { ExtensionProvider } from "@looker/extension-sdk-react";
import { hot } from "react-hot-loader/root";

export const App = hot(() => {
  return (
    <ExtensionProvider>
      <HelloWorld />
    </ExtensionProvider>
  );
});
