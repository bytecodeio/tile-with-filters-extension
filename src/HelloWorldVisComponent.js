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

  // Enter a query value in the form
  const queryTypeOptions = [
    {
      label: "Query",
      value: "query",
    },
    {
      label: "Dashboard",
      value: "dashboard",
    },
  ];
  const [selectedQueryType, setSelectedQueryType] = useState("query");
  const [queryValue, setQueryValue] = useState("");

  // Set the prop of the <Query /> component on submit
  const [queryProp, setQueryProp] = useState();
  const handleSubmit = () => {
    setQueryProp({
      [selectedQueryType]: queryValue,
    });
  };

  return (
    <>
      <ComponentsProvider>
        <Heading>Looker Visualization Component</Heading>
        <Heading as="h4">
          Enter a query slug or a dashboard ID and click submit to render a
          visualization component.
        </Heading>

        <RadioGroup
          value={selectedQueryType}
          name="queryTypes"
          options={queryTypeOptions}
          onChange={setSelectedQueryType}
        />
        <FieldText
          name="queryValue"
          value={queryValue}
          onChange={(e) => setQueryValue(e.target.value)}
          label={`${
            queryTypeOptions.find((t) => t.value === selectedQueryType).label
          } ID`}
        />
        <Button onClick={handleSubmit}>Submit</Button>

        {queryProp && (
          <DataProvider sdk={core40SDK}>
            <Query {...queryProp}>
              <Visualization />
            </Query>
          </DataProvider>
        )}
      </ComponentsProvider>
    </>
  );
};
