import React, { useEffect, useState, useContext } from "react";
import {
  ComponentsProvider,
  FieldText,
  Heading,
} from "@looker/components";
import { ExtensionContext } from "@looker/extension-sdk-react";
import Filters from "./Filters";
import styled from "styled-components";
import EmbedVisualization from './EmbedVisualization'; 

// Define the styled component
const TileFrame = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  gap: 9px;
  width: 700px;
  height: 409px;
  background: #FFFFFF;
  flex: none;
  order: 1;
  flex-grow: 1;
`;

/**
 A component that renders a Looker extension framework Visualization element with filters.
Configuring the tile involves creating a Look and copying the Look ID.
The user can then add an extension 'Tile with Filters' to a dashboard.
The dashboard tile can then 'select' a filter from the top of the Dashboard. 
The filter config will be copied by the tile, and can then be removed from the dashboard.
New filters can be copied into the tile when in dashboard edit mode.
The original Look can be updated to automatically update the viz.
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

  // React state to hold the initial look id, embed url, initial query slug, final query slug, client_id, filter config, filter values, model, and explore
  const [initialLookId, setInitialLookId] = useState();
  // The Embed URL is used to render the visualization
  const [embedUrl, setEmbedUrl] = useState();
  // The initial query slug is used to create the final query. It should not change once set.
  const [initialQuerySlug, setInitialQuerySlug] = useState();
  // The initial query is used to create the final query. It should not change once set.
  const [initialQuery, setInitialQuery] = useState();
  // The final query slug is used to render the visualization. It changes with filter values.
  const [finalQuerySlug, setFinalQuerySlug] = useState();
  // The client_id is another unique identifier for the query. It is used to render the visualization. It changes with filter values.
  const [client_id, setClient_id] = useState();
  // The filterConfig is the filter configuration for the visualization. It only changes if filters are added to the tile.
  const [filterConfig, setFilterConfig] = useState();
  // The filterValues are the current filter values for the visualization. It changes with user interaction.
  const [filterValues, setFilterValues] = useState({});
  // The model and explore are used to set the filter configuration. They should not change once set.
  const [model, setModel] = useState();
  // The model and explore are used to set the filter configuration. They should not change once set.
  const [explore, setExplore] = useState();

  // Useful tile details from the tile host data 
  const { dashboardFilters, dashboardRunState, isDashboardEditing } = tileHostData

  // This function is used to find the final query to be used in the visualization
  // It also sets the model and explore for filter configuration
  const createFinalQuery = async () => {

    if (!initialQuery) {
      console.error('No initial query provided')
      return
    }

    console.log('Creating final query with filterValues', filterValues)
    // Set the model and explore. These should be immutable once set.
    !model && initialQuery?.model && setModel(initialQuery.model);
    !explore && initialQuery?.view && setExplore(initialQuery.view);

    // TODO: handle dashboardFilters also
    if (!filterValues || filterValues.length == 0) {
      // Query without filters
      setFinalQuerySlug(initialQuerySlug)
      setClient_id(initialQuery.client_id)
    } else {
      // Create a new query with the filterValues plus incoming filters
      const { client_id, id, can, slug, ...strippedQuery } = initialQuery;

      // Create a new query with the filterValues plus incoming filters
      const newQueryData = {
        ...strippedQuery,
        filters: {
          ...strippedQuery.filters,
          ...filterValues
        }
      }
      // console.log(newQueryData)
      const newQuery = await core40SDK.ok(core40SDK.create_query(
        newQueryData
      ))
      // Set the new query in local state/ don't persist this transient query
      setFinalQuerySlug(newQuery.slug);
      setClient_id(newQuery.client_id);
      // console.log('newQuery slug', newQuery.slug)

    }
  }

  // This function takes the state and persists it into the extension context
  const persistStateToContext = async () => {
    const elementId = tileHostData.elementId
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping persistStateToContext')
      return
    }
    // console.log('setting contextData for elementId', tileHostData.elementId)
    
    const contextData = extensionSDK.getContextData()
    // console.log('Previous contextData', contextData)

    const newFilterElementId = tileHostData.elementId + ':filterConfig'
    const newLookElementId = tileHostData.elementId + ':lookId';

    // Save the new context data, starting with the previous state
    let revisedContextData = { ...contextData }

    if(filterConfig) {
      revisedContextData[newFilterElementId] = JSON.parse(JSON.stringify(filterConfig))
    }
    revisedContextData[newLookElementId] = initialLookId

    // console.log('revisedContextData', revisedContextData)
    extensionSDK.saveContextData(revisedContextData)
    

    // console.log('New contextData', extensionSDK.getContextData())
  }

  // This function takes the context and populates the initial query slug and filter config
  const populateStateFromContext = async () => {

    const elementId = tileHostData.elementId
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping populateStateFromContext')
      return
    }
    const contextData = await extensionSDK.getContextData();
    // console.log('contextData inside populateStateFromContext', contextData);

    const newFilterConfigElementId = elementId + ':filterConfig';
    const newLookID = elementId + ':lookId';

    // Check and set initialQuerySlug if not already assigned
    if (!initialLookId && contextData[newLookID]) {
      setInitialLookId(contextData[newLookID]);
      // console.log('Setting initial look id from contextData', contextData[newLookID]);
    }

    // Check and set filterConfig if not already assigned
    if (contextData[newFilterConfigElementId] && contextData[newFilterConfigElementId].length > 0) {
      setFilterConfig(contextData[newFilterConfigElementId]);
      // console.log('Setting filterConfig from contextData', contextData[newFilterConfigElementId]);
      // PUll the default_value and dimension or measure from each filterConfig, if it exists and set it in filterValues
      const newFilterValues = contextData[newFilterConfigElementId].reduce((acc, filter) => {
        if (filter.default_value) {
          if (filter.dimension) {
            acc[filter.dimension] = filter.default_value
          } else if (filter.measure) {
            acc[filter.measure] = filter.default_value
          }
        }
        return acc
      }, {})
      setFilterValues(newFilterValues)
    }
  }

  // This Hook will set the initial react state based on the context data
  useEffect(() => {
    populateStateFromContext()
    // it should only fire once.
  }, [tileHostData.elementId])

  // This Hook will persist the react state into context when necessary
  useEffect(() => {
    if (initialLookId || filterConfig) {
      persistStateToContext()
    }
  }, [initialLookId, filterConfig, tileHostData.elementId])

  // This hook with create a final query when filter value or the initial query change
  useEffect(() => {
    if (initialQuery && initialLookId) {
      createFinalQuery()
    }
  }, [filterValues, dashboardFilters, initialLookId, initialQuerySlug]);

  useEffect(() => {
    const fetchInitialQueryFromLook = async () => {
      let response = await core40SDK.ok(core40SDK.look(
        initialLookId, 'query,embed_url'))
      //  console.log('setting embedUrl', response.embed_url)
      // console.log('setting initialQuerySlug', response.query.slug)
      setInitialQuerySlug(response.query.slug)
      setEmbedUrl(response.embed_url)
      if (!initialQuery) {
        let newQueryResponse = await core40SDK.ok(core40SDK.query_for_slug(response.query.slug))
        setInitialQuery(newQueryResponse)
        // console.log('setting initialQuery', newQueryResponse)
      }         
    }

    console.log('initialLookId', initialLookId)
    if (initialLookId && !initialQuerySlug) {
      fetchInitialQueryFromLook()
    }
  }, [initialLookId])

// use effects to watch the filterConfig and filterValues
  useEffect(() => {
    console.log('filterConfig:', filterConfig)
  }, [filterConfig])
  useEffect(() => {
    console.log('filterValues:', filterValues)
  }, [filterValues])

  return (
    <>
      <ComponentsProvider>
        <TileFrame>
        {isDashboardEditing && (
          <div>
            <Heading>Looker Visualization Component With Filters</Heading>

            <FieldText
              name="lookId"
              value={initialLookId}
              onChange={(event) => setInitialLookId(Number(event.target.value))}
              label="Look ID - Copy the id from a Look URL and paste it here."
            />
          </div>
        )}
        <Filters
          isDashboardEditing={isDashboardEditing}
          filterConfig={filterConfig}
          setFilterConfig={setFilterConfig}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
          model={model}
          explore={explore} />
        {client_id && embedUrl && (
          <EmbedVisualization embedUrl={embedUrl} lookId={initialLookId} query={client_id} />
        )}
        
        </TileFrame>
      </ComponentsProvider>
    </>
  );
};
