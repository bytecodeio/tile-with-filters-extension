import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import styled from 'styled-components';
import { ComponentsProvider, Heading, SpaceVertical, FieldText } from '@looker/components';
import { ExtensionContext } from '@looker/extension-sdk-react';
import Filters from './Filters';
import EmbedVisualization from './EmbedVisualization';


const TileFrame = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  
  gap: 9px;
  width: auto;
  height: auto;
  flex: none;
  order: 1;
  flex-grow: 1;
`;

const FiltersContainer = styled.div`
  width: 100%;
  padding-bottom: 7px;
  padding-left: 20px;
  background-color: white;
  position: relative;
  
`;

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

  const [initialLookId, setInitialLookId] = useState();
  const [initialQuery, setInitialQuery] = useState();
  const [client_id, setClient_id] = useState();
  const [filterConfig, setFilterConfig] = useState();
  const [filterValues, setFilterValues] = useState({});
  const [model, setModel] = useState();
  const [explore, setExplore] = useState();
  const [showInstructions, setShowInstructions] = useState(false);
  const [elementId, setElementId] = useState(tileHostData.elementId);
  const { isDashboardEditing, dashboardId } = tileHostData;
  const toggleInstructions = useCallback(() => {
    setShowInstructions(prev => !prev);
  }, []);

  const createFinalQuery = useCallback(async (initialQueryOverride = null, filterValuesOverride = null) => {
    if (!initialQuery && !initialQueryOverride) {
      console.error('No initial query provided');
      return;
    }

    const query = initialQueryOverride || initialQuery;
    const filters = filterValuesOverride || filterValues;

    console.log('Creating final query with filters', filters);
    if (!filters || Object.keys(filters).length === 0) {
      console.log('No filters to apply, using initial query');
      query && setClient_id(query.client_id);
    } else {
      console.log('Applying filters to query');
      const { client_id, id, can, slug, expanded_share_url, ...strippedQuery } = query;
      const newQueryData = {
        ...strippedQuery,
        filters: {
          ...filters
        },
      };
      const newQuery = await core40SDK.ok(core40SDK.create_query(newQueryData));
      newQuery && setClient_id(newQuery.client_id);
    }
  }, [filterValues, model, explore, initialQuery]);

  const persistStateToContext = useCallback(async () => {
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping persistStateToContext');
      return;
    }

    const contextData = extensionSDK.getContextData();
    const newFilterElementId = elementId + ':filterConfig';
    const newLookElementId = elementId + ':lookId';
    const initialQueryElementId = elementId + ':initialQuery';

    let revisedContextData = { ...contextData };

    if (filterConfig) {
      revisedContextData[newFilterElementId] = JSON.parse(JSON.stringify(filterConfig));
    }
    revisedContextData[newLookElementId] = initialLookId;

    const unfilteredQueryResponse = await core40SDK.ok(core40SDK.look(
      initialLookId, 'query'))
    const unfilteredQuery = unfilteredQueryResponse?.query
    revisedContextData[initialQueryElementId] = unfilteredQuery;
    console.log('persisting context data', revisedContextData);
    extensionSDK.saveContextData(revisedContextData);
  }, [elementId, filterConfig, initialLookId, extensionSDK]);

  const persistClientIdToContext = useCallback(async () => {
    if (!elementId) {
      console.error('No elementId found in tileHostData, skipping persistClientIdToContext');
      return;
    }

    const contextData = extensionSDK.getContextData();
    const newClientId = elementId + ':clientId';
    let revisedContextData = { ...contextData };

    if (client_id) {
      revisedContextData[newClientId] = client_id;
    }

    console.log('persisting client_id to context', revisedContextData);
    extensionSDK.saveContextData(revisedContextData);
  }, [client_id, elementId, extensionSDK]);

  const hasPersistedClientId = useRef(false);

  const populateStateFromContext = useCallback(async () => {
    const contextData = await extensionSDK.getContextData();
    console.log('populating state from context', contextData);
    let properElementId = elementId
    // Check if the extension is loading in a lookml dashboard
    // The dashboardId will include :: and not be a number if so.
    if (dashboardId && !Number.isInteger(Number(dashboardId))) {
      // Check if there is any context data, if not, we are loading in a LookML dashboard
      const lookIDKey = elementId + ':lookId';
      if (!contextData[lookIDKey]) {
        console.log('Loading in a LookML dashboard, loading last UDD context data');
        // I'd like to find the elementId that is largest stored in context data, with a suffix of :filterConfig
        // and set the elementId to that value
        let newElementId = '';
        let maxElementId = 0;
        for (const key in contextData) {
          if (key.includes(':filterConfig')) {
            const elementId = key.split(':')[0];
            if (Number(elementId) > maxElementId) {
              maxElementId = Number(elementId);
              newElementId = elementId;
            }
          }
        }
        console.log('Setting elementId to', newElementId);
        setElementId(newElementId);
        properElementId = newElementId;
      }
    } else {
      setElementId(tileHostData.elementId);
    }
    const newFilterConfigElementId = properElementId + ':filterConfig';
    const newLookID = properElementId + ':lookId';
    const newClientId = properElementId + ':clientId';
    const initialQueryElementId = properElementId + ':initialQuery';

    if (!contextData) {
      extensionSDK.saveContextData({});
      console.error('No context data found in populateStateFromContext');
      return;
    }
    console.log('setting client_id from context', contextData[newClientId]);
    setInitialLookStateSimultaneously(contextData[newLookID], contextData[newClientId], contextData[initialQueryElementId],);

    if (contextData[newFilterConfigElementId] && contextData[newFilterConfigElementId].length > 0) {
      setFilterConfig(contextData[newFilterConfigElementId]);
    }

    visualizationData && setInitialQuery(visualizationData.query);
  }, [extensionSDK, elementId, dashboardId]);

  const setInitialLookStateSimultaneously = useCallback((lookId, client_id, query) => {
    setClient_id(client_id);
    setInitialLookId(lookId);
    if (query) {
      setInitialQuery(query);
      setModel(query.model);
      setExplore(query.view);
    }
  }, []);

  useEffect(() => {
    populateStateFromContext();
  }, [elementId, populateStateFromContext]);

  useEffect(() => {
    if (initialLookId || filterConfig) persistStateToContext();
  }, [initialLookId, filterConfig, tileHostData.elementId, persistStateToContext]);

  useEffect(() => {
    if (client_id && !hasPersistedClientId.current) {
      persistClientIdToContext();
      hasPersistedClientId.current = true;
    }
  }, [client_id, persistClientIdToContext]);

  useEffect(() => {
    if (initialQuery) {
      console.log('going to create final query with filter values;', filterValues);
      createFinalQuery();
    }
  }, [filterValues, createFinalQuery]);

  const isSaved = Number.isInteger(Number(elementId));

  const embedVisualizationProps = useMemo(() => ({
    host: lookerHostData.hostOrigin.replace('https://', ''),
    query: client_id
  }), [initialLookId, client_id]);

  return (
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
          <FiltersContainer isDashboardEditing={isDashboardEditing}>
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
        {client_id && model && explore && !isDashboardEditing && (
          <EmbedVisualization {...embedVisualizationProps} model={model}
            explore={explore} />
          // <iframe src={`${lookerHostData.hostUrl}/embed/query/${model}/${explore}?qid=${client_id}`} width="100%" height="100%"></iframe>
        )}
      </TileFrame>
    </ComponentsProvider>
  );
};

export default TileWithFilters;