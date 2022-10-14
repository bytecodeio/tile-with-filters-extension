import React, { useEffect, useState, useContext } from "react";
import {
  Button,
  ComponentsProvider,
  FieldText,
  Heading,
  RadioGroup,
} from "@looker/components";
import { DataProvider } from "@looker/components-data";
import { ExtensionContext } from "@looker/extension-sdk-react";
import { Query, Visualization } from "@looker/visualizations";

/**
 * A simple component that renders a Looker custom visualization.
 */

export const HelloWorldVisComponent = () => {
  const { core40SDK } = useContext(ExtensionContext);

  const [queryInputValue, setQueryInputValue] = useState("");
  const [queryValue, setQueryValue] = useState();

  // Set the prop of the <Query /> component on submit
  const handleSubmit = () => setQueryValue(queryInputValue);

  return (
    <>
      <ComponentsProvider>
        <Heading>Looker Visualization Component</Heading>
        <Heading as="h4">
          Enter a query slug and click submit to render a visualization
          component.
        </Heading>

        <FieldText
          name="queryValue"
          value={queryInputValue}
          onChange={(e) => setQueryInputValue(e.target.value)}
          label="Query ID"
        />
        <Button onClick={handleSubmit}>Submit</Button>

        {queryValue && (
          <DataProvider sdk={core40SDK}>
            <Query query={queryValue}>
              <Visualization />
            </Query>
          </DataProvider>
        )}
      </ComponentsProvider>
    </>
  );
};
