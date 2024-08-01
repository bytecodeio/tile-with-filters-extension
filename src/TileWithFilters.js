import React, { useEffect, useState, useContext } from "react";
import {
  Button,
  ComponentsProvider,
  FieldText,
  Heading,
  RadioGroup,
  Select,
} from "@looker/components";
import { DataProvider } from "@looker/components-data";
import { ExtensionContext } from "@looker/extension-sdk-react";
import { Query, Visualization } from "@looker/visualizations";
import { Filters } from "./Filters";
import { vizOptions } from "./vizOptions";
/**
 * A simple component that renders a Looker custom visualization.
 */

export const TileWithFilters = () => {
  const {
    core40SDK,
    tileSDK,
    tileHostData,
    visualizationData,
    visualizationSDK,
    extensionSDK,
    lookerHostData
  } = useContext(ExtensionContext);

  // console.log('extensionContext', ExtensionContext);
  // console.log("lookerHostData", lookerHostData);
  // console.log("tileHostData", tileHostData);
  // console.log("visualizationData", visualizationData);
  // console.log("visualizationSDK", visualizationSDK);
  // console.log("core40SDK", core40SDK);
  // console.log("tileSDK", tileSDK);
  // console.log("extensionSDK", extensionSDK);

  const [queryValue, setQueryValue] = useState();
  const [vizType, setVizType] = useState();
  const [filterConfig, setFilterConfig] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [model, setModel] = useState();
  const [explore, setExplore] = useState();

  const getAndSetQueryId = async (querySlug) => {
    // Get the query id from the query slug
    if (filterConfig.length > 0) {
      
      // Query with filters
      core40SDK.ok(core40SDK.query_for_slug(querySlug)).then((query) => {
        setModel(query.model);
        setExplore(query.view);
        visualizationSDK.setVisConfig({
          initialQuery: queryId
        })
        // Remove the client_id and id from the query object
        const { client_id, id, can, slug, ...initialQuery } = query;
        // Create a new query with the filterValues plus incoming filters
        const newQuery = {
          ...initialQuery,
          filters: {
            ...initialQuery.filters,
            ...filterValues
          }
        }
        console.log('new query', newQuery)
        core40SDK.ok(core40SDK.create_query(
          newQuery
        )).then((newQueryResponse) => {
          console.log('new query', newQueryResponse)
          setQueryValue(newQueryResponse.id);
        })
      })
    }
    else {
      // Query without filters
      core40SDK.ok(core40SDK.query_for_slug(querySlug)).then((query) => {
      setQueryValue(query.id);
      setModel(query.model);
      setExplore(query.view);
      visualizationSDK.setVisConfig({initialQuery: query.id})
    })
  };
  }

  useEffect(() => {
    const route = extensionSDK.lookerHostData.route
    if (route && route.includes("qid=")) {
      console.log("In an explore configuring the viz")
      const querySlug = route?.split("qid=")[1].split("&")[0]

      getAndSetQueryId(querySlug)
    }
    if (!route) {
      console.log("Rendering in a dashboard")
      // Load the query id and viz type from the visualization SDK
      const visConfig = visualizationSDK.visConfig;
      console.log('initialQuery', visConfig.visConfig.initialQuery)
      
      console.log('visConfig1', visConfig.visConfig.filterConfig)
      const filterConfig = visConfig._visConfig.filterConfig;
      console.log('filterConfig', filterConfig)
    }
  // Not sure yet if these are the correct things to listen to.
  }, [filterValues, extensionSDK.lookerHostData]);

  // When the filterConfig changes, store it in the visualization config
  useEffect(() => {
    visualizationSDK.setVisConfig({
      filterConfig: filterConfig
    })
  }, [filterConfig])

  return (
    <>
      <ComponentsProvider>
        {!vizType && (
          <div>
            <Heading>Looker Visualization Component With Filters</Heading>

            <Heading as="h4">
              Configure this visualization using a different type.
              You can return to that type to re-configure it. 
              When you're ready to view the visualization, 
              select a visualization type below to continue.
            </Heading>

            <Select
              name="queryValue"
              value={vizType}
              onChange={(value) => setVizType(value)}
              label="Query ID"
              options={vizOptions}
              placeholder="Select Visualization Type"
            />
          </div>
        )}

        {queryValue && vizType && (
          <>
          <Filters 
            sdk={core40SDK} 
            filterConfig={filterConfig} 
            setFilterConfig={setFilterConfig} 
            filterValues={filterValues} 
            setFilterValues={setFilterValues}
            model={model} 
            explore={explore}/>
          <DataProvider sdk={core40SDK}>
            <Query
              query={queryValue}
              config={{ type: vizType }}>
              <Visualization />
            </Query>
          </DataProvider>
          </>
        )}
      </ComponentsProvider>
    </>
  );
};
