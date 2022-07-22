import React, { useEffect, useState, useContext } from "react";
import { Space, ComponentsProvider, Span } from "@looker/components";
import { ExtensionContext } from "@looker/extension-sdk-react";

/**
 * A simple component that uses the Looker SDK through the extension sdk to display a customized hello message.
 */

export const HelloWorld = () => {
  const { core40SDK } = useContext(ExtensionContext);
  const [message, setMessage] = useState();

  useEffect(() => {
    const initialize = async () => {
      try {
        const value = await core40SDK.ok(core40SDK.me());
        setMessage(`Hello, ${value.display_name}`);
      } catch (error) {
        setMessage("Error occured getting information about me!");
        console.error(error);
      }
    };
    initialize();
  }, []);

  return (
    <>
      <ComponentsProvider>
        <Space around>
          <Span fontSize="xxxxxlarge">{message}</Span>
        </Space>
      </ComponentsProvider>
    </>
  );
};
