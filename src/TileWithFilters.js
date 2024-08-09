import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import {
  ComponentsProvider,
  FieldText,
  Heading,
  SpaceVertical,
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
  width: auto;
  height: auto;
  background: #FFFFFF;
  flex: none;
  order: 1;
  flex-grow: 1;
`;

const FiltersContainer = styled.div`
  width: 100%;
  padding-bottom: 7px;
  background-color: white;
  z-index: 1;
  position: relative;
`;

/**
 A component that renders a Looker extension framework Visualization element with filters.
Configuring the tile involves creating a Look and copying the Look ID.
The user can then add an extension 'Tile with Filters' to a dashboard.
The dashboard tile can then 'select' a filter from the top of the Dashboard. 
The filter config will be copied by the tile, and can then be removed from the dashboard.
New filters can be copied into the tile when in dashboard edit mode.
The original Look can be updated to automatically update the viz.
Filters in the original look should be removed if they are going to be dynamic.
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

  // React state to hold the initial look id, embed url, initial query slug, final query slug, client_id, filter config, filter values, model, and explore
  const [initialLookId, setInitialLookId] = useState();
  // The Embed URL is used to render the visualization
  const [host, setHost] = useState();
  // The initial query is used to create the final query. It should not change once set.
  const [initialQuery, setInitialQuery] = useState();
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
  // The showInstructions flag is used to show the instructions when the tile is saved and the user is in edit mode
  const [showInstructions, setShowInstructions] = useState(false);

  // This function toggles the instructions
  const toggleInstructions = () => {
    setShowInstructions(!showInstructions)
  }
  // Useful tile details from the tile host data 
  const { dashboardFilters, elementId, isDashboardEditing, dashboardId } = tileHostData

  // This function is used to find the final query to be used in the visualization
  // It also sets the model and explore for filter configuration
  const createFinalQuery = useCallback(async (initialQueryOverride = null, filterValuesOverride = null) => {

    if (!initialQuery && !initialQueryOverride) {
      console.error('No initial query provided')
      return
    }

    const query = initialQueryOverride || initialQuery
    const filters = filterValuesOverride || filterValues

    console.log('Creating final query with filters', filters)
    // Set the model and explore. These should be immutable once set.
    !model && query?.model && setModel(query.model);
    !explore && query?.view && setExplore(query.view);

    // TODO: handle dashboardFilters also
    if (!filters || filters.length == 0) {
      setClient_id(query.client_id)
    } else {
      const { client_id, id, can, slug, expanded_share_url, ...strippedQuery } = query;
      // Create a new query with the filters
      const newQueryData = {
        ...strippedQuery,
        filters: {
          ...filters
        },
      }
      const newQuery = await core40SDK.ok(core40SDK.create_query(
        newQueryData
      ))
      console.log('newQuery', newQuery)
      // Set the new query in local state/ don't persist this transient query
      setClient_id(newQuery.client_id);
      // console.log('newQuery slug', newQuery.slug)

    }
  }, [filterValues, model, explore])

  // This function takes the state and persists it into the extension context
  const persistStateToContext = async () => {
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping persistStateToContext')
      return
    }

    const contextData = extensionSDK.getContextData()

    const newFilterElementId = tileHostData.elementId + ':filterConfig'
    const newLookElementId = tileHostData.elementId + ':lookId';

    // Save the new context data, starting with the previous state
    let revisedContextData = { ...contextData }

    if (filterConfig) {
      revisedContextData[newFilterElementId] = JSON.parse(JSON.stringify(filterConfig))
    }
    revisedContextData[newLookElementId] = initialLookId

    extensionSDK.saveContextData(revisedContextData)
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

    if (!contextData) {
      // initialize with emtpy context data
      extensionSDK.saveContextData({})
      console.error('No context data found in populateStateFromContext')
      return
    }

    // Check and set initialLookId if not already assigned
    if (!initialLookId && contextData && contextData[newLookID]) {
      setInitialLookId(contextData[newLookID]);
      // console.log('Setting initial look id from contextData', contextData[newLookID]);
    }

    // Check and set filterConfig if not already assigned
    if (contextData[newFilterConfigElementId] && contextData[newFilterConfigElementId].length > 0) {
      
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

      const unfilteredQueryResponse = await core40SDK.ok(core40SDK.look(
        contextData[newLookID], 'query,image_embed_url'))

      const newEmbedUrl = new URL(unfilteredQueryResponse.image_embed_url)
      setInitialStateSimultaneously(unfilteredQueryResponse, newFilterValues, newEmbedUrl, unfilteredQueryResponse.query, contextData[newFilterConfigElementId], newFilterValues)
    }
  }

  const setInitialStateSimultaneously = (unfilteredQueryResponse, newFilterValues, newEmbedUrl, query, filterConfig, filterValues) => {
        // Create the (first) final query with the filter values
        console.log('calling createFinalQuery with newQueryResponse', unfilteredQueryResponse.query, newFilterValues)
        createFinalQuery(unfilteredQueryResponse.query, newFilterValues)
        setInitialQuery(query)
        setFilterConfig(filterConfig)
        setFilterValues(filterValues)
        setHost(newEmbedUrl.host)
  }

  // This Hook will set the initial react state based on the context data. Should fire once.
  useEffect(() => {
    if (tileHostData.elementId) populateStateFromContext()
  }, [tileHostData.elementId])

  // This Hook will persist the react state into context when necessary
  useEffect(() => {
    if (initialLookId || filterConfig) persistStateToContext()
  }, [initialLookId, filterConfig, tileHostData.elementId])

  // This hook with create a final query when filter value or the initial query change
  useEffect(() => {
    if (initialQuery && filterValues && host) createFinalQuery()
  }, [filterValues]);

  // If the elementId is not an integer, the tile is not saved and the user is in edit mode
  const isSaved = Number.isInteger(Number(elementId))

  const embedVisualizationProps = useMemo(() => ({
    host,
    lookId: initialLookId,
    query: client_id
  }), [host, initialLookId, client_id]);

  return (
    <>
      <ComponentsProvider>
        <TileFrame>
          {isDashboardEditing && (!isSaved || showInstructions) && (
            <div>
              <Heading>Looker Visualization Component With Filters</Heading>
              <h4>Instructions</h4>
              <p>
                This extension requires a few steps for configuration:
              </p>
              <ol>
                <li>Save the dashboard with this extension tile.</li>
                <li>Configure the 'starting' tile. This is the visualization you want to add filters to.
                  <ol>
                    <li>Create the visualization tile in an explore.</li>
                    <li>Add the tile to this Dashboard.</li>
                    <li>Also save the tile as a Look.</li>
                    <li>Note the Look Id.</li>
                    <li>Remove any dynamic filters from the Look.</li>
                  </ol>
                </li>
                <li>Configure the extension tile with filters
                  <ol>
                    <li>Copy the Look Id into the Look ID field.</li>
                    <li>Add filters to the dashboard, configured exactly as you want them to appear in the tile.</li>
                    <li>Select the filters from the top of the dashboard and click 'Add Filter'.</li>
                    <li>Remove the filters from the dashboard (they are now in the tile).</li>
                  </ol>
                </li>
                <li>Save the dashboard.</li>
              </ol>
            </div>
          )}
          {isDashboardEditing && isSaved && (
            <SpaceVertical>
              <button onClick={toggleInstructions}>
                {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
              </button>

              <FieldText
                name="lookId"
                value={initialLookId}
                onChange={(event) => setInitialLookId(Number(event.target.value))}
                label="Look ID - Copy the id from a Look URL and paste it here."
              />
            </SpaceVertical>
          )}
          {isSaved && (
            <FiltersContainer>
              <Filters
                isDashboardEditing={isDashboardEditing}
                filterConfig={filterConfig}
                setFilterConfig={setFilterConfig}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
                model={model}
                explore={explore}
                dashboardId={dashboardId}
              />
            </FiltersContainer>
          )}
          {client_id && host && initialLookId && (
            <EmbedVisualization {...embedVisualizationProps} />
          )}

        </TileFrame>
      </ComponentsProvider>
    </>
  );
};
